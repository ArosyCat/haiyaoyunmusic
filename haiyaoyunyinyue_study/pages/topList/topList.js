// pages/topList/topList.js
import request from "../../utils/request";
import PubSub from "pubsub-js";
import moment from "moment";
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    topListData: {},          // 获取所有类型排行榜
    topListType: '0',         // 获取是哪个类型的排行榜
    tracks: [],               // 获取某个排行榜的所有歌曲列表
    index: 0,                 // 音乐下标
    song: {},                 // 存放音乐信息
    isPlay: false,            // 标识当前播放状态：播放还是停止
    musicId: '',              // 歌曲ID
    currentTime: '00:00',
    currentWidth: 0,
    playModel: 0,             // 暂时设置默认0
    musicLink: '',             // 音乐链接
    isClose: true,                   // 用来判断当前弹框是否关闭，默认是hidden=true，就是隐藏
    similarSinger: [],              // 相似歌手列表
    currentSong: {},                // 用来进行搜索功能的歌曲信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getTopListData(this.data.topListType);

    this.setData({
      song: wx.getStorageSync('song')
    })

    // 取消订阅
    PubSub.unsubscribe('switchType');
    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,{type,playModel}) => {
      // console.log(msg,{type,playModel});
      let {tracks,index} = this.data;
      if (playModel === 0) {
        if (type === 'pre') {   // 上一首
          (index === 0) && (index = tracks.length)
          index -= 1;
        } else {                // 下一首
          (index === tracks.length - 1) && (index = -1)
          index += 1;
        }
      }
      // playModel=2 -> 随机播放模式
      else if (playModel === 2) {
        let randomIndex = Math.floor(Math.random()*32);
        if (randomIndex === index) {
          randomIndex = Math.floor(Math.random()*32);
        } else {
          index = randomIndex;
        }
        // console.log(randomIndex)
      }
      // 更新下标
      this.setData({
        index
      })
      let musicId = tracks[index].id;
      appInstance.globalData.musicId = musicId;
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId',musicId)
    });

    // 创建控制音乐播放的实例对象
    this.backgroundAudioManager = wx.getBackgroundAudioManager()

    // 设置音频监听器的链接
    let musicLink = wx.getStorageSync('musicLink')
    this.setData({
      musicLink
    })

    wx.setNavigationBarTitle({
      title: '音乐排行榜'
    })

  },

  async getTopListData(topListType) {
    // 获取排行榜数据
    let topListData = await request('/top/list',{idx: topListType});
    this.setData({
      topListData,
      tracks: topListData.playlist.tracks,
    })

  },

  /* 点击各个音乐榜的回调 */
  displayTopList(event) {
    // 获取是哪个热搜榜的类型
    let topListType = event.currentTarget.id;
    this.setData({
      topListType
    })
    this.getTopListData(topListType)
  },

  /* 点击播放音乐（跳转到播放音乐界面播放） */
  async toPlayMusic(event) {
    let index = parseInt(event.currentTarget.id);
    let musicId = this.data.tracks[index].id;

    /* 要获取音乐的封面图 */
    let songData = await request('/song/detail',{ids: musicId});

    /* 将获取到的音乐信息设置给全局 */
    this.setData({
      song: songData.songs[0],
      // 更新下标
      index: index,
    })

    // console.log(this.data.song)

    let currentTime = wx.getStorageSync('currentTime');
    let currentWidth = wx.getStorageSync('currentWidth');
    // 路由跳转传参：query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId
          + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
    })
  },

  /* 点击播放 / 暂停音乐（当前搜索页面底部的播放器进行播放） */
  handlePlay(musicId,musicLink) {
    let isPlay = !this.data.isPlay
    this.setData({
      isPlay
    })

    let songId = musicId ? musicId : this.data.song.id;
    let songLink = musicLink ? musicLink : this.data.musicLink;

    if (this.data.isPlay) {
      this.musicControl(this.data.isPlay,songId,songLink)

    } else {
      this.backgroundAudioManager.pause();
    }

  },

  /* 点击切歌的回调 */
  handleSwitch(event) {
    // 获取切歌的类型
    let type = event.currentTarget.id;

    let tracks = this.data.tracks;

    let index = this.data.index;
    if (type === 'pre') {
      if (index !== 0) {
        index--;
      } else {
        index = tracks.length - 1;
      }
    } else if (type === 'next') {
      if (index === tracks.length - 1) {
        index = 0;
      } else {
        index++;
      }
    }
    // 更新下标
    this.setData({
      index
    })

    // 关闭当前播放的音乐
    this.backgroundAudioManager.stop();

    let playModel = this.data.playModel;
    // playModel=0 -> 列表播放 || playModel=2 -> 随机播放
    if (playModel === 0 || playModel === 2) {
      // 清除音乐链接
      this.setData({
        musicLink: ''
      })
      // 获取音乐id
      let musicId = tracks[index].id;

      // 获取音乐详情信息
      this.getMusicInfo(musicId);
      // 进入音乐播放界面后先自动播放当前的音乐
      this.setData({
        musicId,
        isPlay: false
      })
      this.handlePlay(musicId,this.data.musicLink);
      // this.musicControl(this.data.isPlay,musicId,this.data.musicLink)
    }
    // playModel=1 -> 单曲循环
    else if (playModel === 1) {
      this.setData({
        isPlay: false
      })
      this.handlePlay();
    }

  },

  /* 获取音乐详情 */
  async getMusicInfo(musicId) {
    // 获取音乐详情的接口
    let songData = await request('/song/detail',{ids: musicId});

    console.log(songData)

    // songData.song[0].dt   单位ms
    // let durationTime = moment(songData.songs[0].dt).format('mm:ss');

    this.setData({
      song: songData.songs[0],
    })

    // 将歌曲详情存入Storage
    wx.setStorageSync('song',this.data.song);

  },

  // 控制音乐播放 / 暂停的功能函数
  async musicControl(isPlay,musicId,musicLink) {
    if (isPlay) {    // 音乐播放
      if (!musicLink) {
        // 获取音乐播放链接
        let musicLinkData = await request('/song/url',{id: musicId});
        musicLink = musicLinkData.data[0].url;
        wx.setStorageSync('musicLink',musicLink);
        this.setData({
          musicLink
        })
      }
      this.backgroundAudioManager.src = musicLink;   // 这里放音乐链接
      this.backgroundAudioManager.title = this.data.song.name
      // this.backgroundAudioManager.title = this.data.song.name;
    } else {      // 暂停音乐
      this.backgroundAudioManager.pause();

      // 说明：
      // 点击播放或者暂停前再重置一下Storage域的数据（刷新一下，防止数据丢失）
      // wx.setStorageSync('song',this.data.song);
    }
  },

  /* 跳转至播放歌曲页面 */
  toSongDetail() {
    // 从Storage域中取出歌曲数据
    let song = wx.getStorageSync('song');
    this.setData({
      song
    })
    // 获取音乐Id
    let musicId = this.data.song.id;
    // 取出音乐已经播放的时长
    let currentTime = wx.getStorageSync('currentTime');
    // 取出音乐已经播放过的进度条长度
    let currentWidth = wx.getStorageSync('currentWidth');

    if (musicId) {
      wx.navigateTo({
        url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId
            + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
      })
    } else {
      wx.showToast({
        title: '目前还没有播放任何音乐',
        icon: 'none'
      })
    }
  },

  // 点击歌曲后面三点，展示更多功能
  toShowMoreFunction(event) {
    // 使用了catchTap阻止点击事件的冒泡行为
    // console.log("点击三点")
    // 让弹框显示
    this.setData({
      isClose: false,
      currentSong: event.currentTarget.dataset.song
    })
  },

  // 关闭弹框
  toClose() {
    this.setData({
      isClose: true
    })
  },

  // 点击搜索
  toSearch(event) {
    wx.navigateTo({
      url: '/pages/searchList/searchList?keywords=' + event.currentTarget.dataset.value
    })
  },

  // 点击查找与当前歌手风格相似的歌手 /simi/artist?id=6452
  async toSearchSimilarSinger(event) {
    let aid = event.currentTarget.dataset.value;
    wx.navigateTo({
      url: '/songPackage/pages/similarSinger/similarSinger?aid=' + aid
    })
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      isPlay: wx.getStorageSync('isPlay'),
      song: wx.getStorageSync("song")
    })

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})