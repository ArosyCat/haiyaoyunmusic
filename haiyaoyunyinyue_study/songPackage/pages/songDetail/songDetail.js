// pages/songDetail/songDetail.js
import PubSub from 'pubsub-js';
import request from "../../../utils/request";
import moment from "moment";
// 获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,        // 标识音乐是否播放
    song: {},             // 歌曲详情对象
    musicId: '',          // 音乐id
    musicLink: '',        // 音乐的链接
    currentTime: '00:00', // 进度条实时时间记录
    durationTime: '00:00',// 总时长
    currentWidth: 0,      // 实时进度条长度
    playModel: 0,         // 调节播放模式，0为列表播放，1为单曲循环，2为随机播放
    isIndex: false,       // 是否是由主页跳转过来的
    lyric: [],            // 歌词
    lyricTime: 0,         // 歌词对应的时间
    currentLyric: ''      // 当前歌词对象
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options：用于接收路由跳转的query参数
    // 原生小程序中路由传参，对参数的长度有限制，如果参数长度过长，会自动截取掉
    // console.log(JSON.parse(options.song))
    // console.log("songDetail-options",options)
    // console.log(typeof musicId)
    // 获取歌曲Id
    let musicId = parseInt(options.musicId);
    this.setData({
      musicId,
      isIndex: options.isIndex ? options.isIndex : false,
      currentTime: options.currentTime,
      currentWidth: options.currentWidth,
      // 因为只需要在进入页面时显示出歌词，所以可以在onLoad中就做判断
      currentLyric: musicId === wx.getStorageSync('song').id && wx.getStorageSync('song').id.toString() ? wx.getStorageSync('currentLyric') : ''
    })

    // console.log(wx.getStorageSync('song').id.toString() === musicId)
    console.log("songDetail-onLoad-musicId = ",musicId)
    console.log(typeof musicId)

    // 获取音乐详情
    this.getMusicInfo(musicId);
    this.getLyric(musicId);
    /*
    * 问题：如果用户操作系统的控制音乐播放 / 暂停的按钮，页面不知道，
    *       导致页面显示是否播放的状态和真实的音乐播放状态不一致
    * 解决方案：
    *   1、通过控制音频的实例 backgroundAudioManager 去监视音乐播放 / 暂停
    * */

    // 判断当前页面的音乐是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
      // 修改当前页面音乐播放状态为true
      this.setData({
        isPlay: true
      })
    }

    // console.log(musicId)
    // 如果是由主页跳转过来的则原来是播放还是暂停就不要去改它
    if (!this.data.isIndex && musicId !== wx.getStorageSync('song').id) {
      // 如果不是由主页跳转过来的执行以下
      // 点击音乐就进入播放界面开始播放
      this.handleMusicPlay();
    }

    this.backgroundAudioManager = wx.getBackgroundAudioManager()

  },

  // 修改播放状态的功能函数
  changePlayState(isPlay) {
    // 修改音乐是否播放的状态
    this.setData({
      isPlay
    })
    wx.setStorageSync('isPlay',isPlay)
    // 修改全局音乐播放的状态
    appInstance.globalData.isMusicPlay = isPlay;

  },

  // 获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail',{ids: musicId});
    // console.log("songData",songData)
    // songData.song[0].dt   单位ms
    // TODO 这里有报错 dt，可能是songs[0]没有，可以打印一下songData查看一下
    console.log("songDetail-getMusicInfo-songData = ",songData)

    let durationTime = moment(songData.songs[0].dt).format('mm:ss');

    this.setData({
      song: songData.songs[0],
      durationTime
    })

    // 将歌曲详情存入Storage
    wx.setStorageSync('song',this.data.song);

    // console.log(this.data.song)

    // 动态修改窗口的标题为歌名
    wx.setNavigationBarTitle({
      title: this.data.song.name + ' - ' + this.data.song.name,
    })

  },

  // 点击播放 / 暂停按钮的回调
  handleMusicPlay() {

    let isPlay = !this.data.isPlay;
    wx.setStorageSync('isPlay',isPlay)
    let {musicId,musicLink} = this.data;
    // console.log(musicId)
    this.musicControl(isPlay,musicId,musicLink);
  },

  // 控制音乐播放 / 暂停的功能函数
  async musicControl(isPlay,musicId,musicLink) {
    if (isPlay) {    // 音乐播放
      if (!musicLink) {
        // console.log("musicLink为空")
        // 获取音乐播放链接
        let musicLinkData = await request('/song/url',{id: musicId});
        musicLink = musicLinkData.data[0].url;
        wx.setStorageSync('musicLink',musicLink);
        this.setData({
          musicLink
        })
      }

      this.backgroundAudioManager.src = this.data.musicLink;   // 这里放音乐链接

      this.backgroundAudioManager.title = this.data.song.name;
    } else {      // 暂停音乐
      this.backgroundAudioManager.pause();

      // 说明：
      // 点击播放或者暂停前再重置一下Storage域的数据（刷新一下，防止数据丢失）
      // wx.setStorageSync('song',this.data.song);
    }

    wx.setStorageSync('musicLink',this.data.musicLink)

  },

  // 点击切歌的回调
  handleSwitch(event) {
    // 获取切歌的类型
    let type = event.currentTarget.id;

    // 关闭当前播放的音乐
    this.backgroundAudioManager.stop();

    let playModel = this.data.playModel;
    // playModel=0 -> 列表播放 || playModel=2 -> 随机播放
    if (playModel === 0 || playModel === 2) {
      // 清除音乐链接
      this.setData({
        musicLink: ''
      })
      // 订阅来自recommendSong页面发布的musicId消息
      PubSub.subscribe('musicId',(msg,musicId) => {

        console.log("songDetail页面这边接收到的musicId是：",musicId)

        // 获取音乐详情信息
        this.getMusicInfo(musicId);
        this.getLyric(musicId)
        // 进入音乐播放界面后先自动播放当前的音乐
        this.setData({
          musicId,
          isPlay: false
        })
        this.handleMusicPlay();
        // 取消订阅
        PubSub.unsubscribe('musicId');

      })
    }
    // playModel=1 -> 单曲循环
    else if (playModel === 1) {
      this.setData({
        isPlay: false
      })
      this.handleMusicPlay();
    }
    // 发布消息数据给recommendSong页面
    PubSub.publish('switchType',{type,playModel});

  },

  // 设置播放模式（随机播放，单曲循环，列表循环）
  handlePlayModel() {
    let playModel = this.data.playModel;
    // 让playModel在0，1，2取值
    if (playModel === 2) {
      // 重置
      this.setData({
        playModel: 0
      })
    } else {
      // playModel++
      playModel++
      this.setData({
        playModel
      })
    }
  },

  // 获取歌词
  async getLyric(musicId) {
    console.log("歌词方法的id",musicId)
    let lyricData = await request("/lyric",{id: musicId});
    // console.log(lyricData)
    let lyric = this.formatLyric(lyricData.lrc.lyric);
  },

  //传入初始歌词文本text
  formatLyric(text) {
    let result = [];
    let arr = text.split("\n"); //原歌词文本已经换好行了方便很多，我们直接通过换行符“\n”进行切割
    let row = arr.length; //获取歌词行数
    for (let i = 0; i < row; i++) {
      let temp_row = arr[i]; //现在每一行格式大概就是这样"[00:04.302][02:10.00]hello world";
      let temp_arr = temp_row.split("]");//我们可以通过“]”对时间和文本进行分离
      let text = temp_arr.pop(); //把歌词文本从数组中剔除出来，获取到歌词文本了！
      //再对剩下的歌词时间进行处理
      temp_arr.forEach(element => {
        let obj = {};
        let time_arr = element.substr(1, element.length - 1).split(":");//先把多余的“[”去掉，再分离出分、秒
        let s = parseInt(time_arr[0]) * 60 + Math.ceil(time_arr[1]); //把时间转换成与currentTime相同的类型，方便待会实现滚动效果
        obj.time = s;
        obj.text = text;
        result.push(obj); //每一行歌词对象存到组件的lyric歌词属性里
      });
    }
    result.sort(this.sortRule) //由于不同时间的相同歌词我们给排到一起了，所以这里要以时间顺序重新排列一下
    this.setData({
      lyric: result
    })
  },
  sortRule(a, b) { //设置一下排序规则
    return a.time - b.time;
  },

  //控制歌词播放
  getCurrentLyric(){
    let j;
    for(j=0; j<this.data.lyric.length-1; j++){
      if(this.data.lyricTime == this.data.lyric[j].time){
        this.setData({
          currentLyric : this.data.lyric[j].text
        })
        wx.setStorageSync('currentLyric',this.data.currentLyric);
      }
    }
  },

  /* 来到歌曲评论区 */
  toComment() {
    // 获取当前播放的musicId
    let musicId = this.data.musicId
    wx.navigateTo({
      url: '/pages/comment/comment?musicId=' + musicId
    })
  },


  toMove() {
    console.log("移动了。。。")
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
    // console.log("songDetail")

    // 创建控制音乐播放的实例对象
    this.backgroundAudioManager = wx.getBackgroundAudioManager();

    // 监视音乐播放 / 暂停 / 停止
    this.backgroundAudioManager.onPlay(() => {
      this.changePlayState(true)
      this.getCurrentLyric();
      appInstance.globalData.musicId = this.data.musicId;
    });
    this.backgroundAudioManager.onPause(() => {
      this.changePlayState(false)
    });
    this.backgroundAudioManager.onStop(() => {
      this.changePlayState(false)
    });
    // 监听音乐播放自然结束
    this.backgroundAudioManager.onEnded(() => {

      // 自动切换至下一首音乐，并且自动播放
      PubSub.publish('switchType','next')
      // 将实时进度条的长度还原成0、时间还原成00:00
      this.setData({
        currentWidth: 0,
        // 保险起见重置一下初始播放时间
        currentTime: '00:00',
        // 歌词重置
        lyric: [],
        lyricTime: 0
      });

    })
    // 监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(() => {
      // console.log('总时长：',this.backgroundAudioManager.duration);
      // console.log('实时的时长：',this.backgroundAudioManager.currentTime);

      // 获取歌词对应时间
      let lyricTime = Math.ceil(this.backgroundAudioManager.currentTime);

      // 格式化实时的播放时间
      let currentTime = moment(this.backgroundAudioManager.currentTime*1000).format('mm:ss');
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration*550;
      this.setData({
        lyricTime,
        currentTime,
        currentWidth
      })

      this.getCurrentLyric();

      // 暂停时存储一下播放时间和进度条长度(播放就没必要存数据)
      wx.setStorageSync('currentTime',currentTime);
      wx.setStorageSync('currentWidth',currentWidth);

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