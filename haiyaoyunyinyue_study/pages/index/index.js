import request from "../../utils/request";
import PubSub from "pubsub-js";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [],      // 轮播图数据
    recommendList: [],   // 推荐歌单
    topList: [],         // 排行榜数据
    song: {},            // 歌曲信息
    isIndex: true,       // 标识是首页跳转过去的
    topListIndex: 0,     // 为了确认点击的是哪个热搜榜
    index: 0,            // 下标
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let bannerListData = await request('/banner',{type: 2})
    this.setData({
      bannerList: bannerListData.banners,
    })

    //获取推荐歌单数据
    let recommendListData = await request('/personalized',{limit: 10});
    this.setData({
      recommendList: recommendListData.result
    })

    // 获取排行榜数据
    /*
    * 需求分析：
    *   1、需要根据idx的值获取对应的数据
    *   2、idx的取值范围是0-20，我们需要0-4
    *   3、需要发送5次请求
    * */
    let index = 0;
    let resultArr = [];
    while (index < 5){
      let topListData = await request('/top/list',{idx: index++});
      // 数组截取 splice(这个会修改原数组，可以对指定的数组进行增删改) slice(不会修改原数组)
      let topListItem = {name: topListData.playlist.name,tracks: topListData.playlist.tracks.slice(0,3)}
      resultArr.push(topListItem);
      //发一次请求就渲染一次数据，不需要等待五次请求全部结束才更新，用户体验较好，但是渲染的次数会多一些
      this.setData({
        topList: resultArr
      })
    }

    //更新topList的状态值，放在此处更新会导致发送请求的过程中页面长时间白屏，用户体验差
    // this.setData({
    //   topList: resultArr
    // })

    // 订阅来自songDetail页面发布的消息
    this.handlePubSubFun();

  },

  /* 用来处理消息订阅的函数 */
  handlePubSubFun() {
    // 取消订阅
    PubSub.unsubscribe('switchType');
    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,{type,playModel}) => {
      // console.log(msg,{type,playModel});
      let tracks = this.data.topList[this.data.topListIndex].tracks
      let index = this.data.index;
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
        // console.log(playModel)
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
      // console.log(tracks)
      let musicId = tracks[index].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId',musicId)
    });
  },

  /* 跳转至推荐歌曲页面 */
  toRecommendSongIndex() {
    wx.navigateTo({
      url: '/songPackage/pages/recommendSong/recommendSong'
    })
  },

  /* 跳转至搜索歌曲页面 */
  toSearchSongs() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /* 跳转至视频页 */
  toVideo() {
    // 这里使用 wx.navigateTo()会报错，
    // 因为不能用这个方法跳转到底部的tabbar地址
    // 所以要使用 wx.switchTab()
    wx.switchTab({
      url: '/pages/video/video'
    })
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
        url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId + '&isIndex=' + this.data.isIndex
            + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
      })
    } else {
      wx.showToast({
        title: '目前还没有播放任何音乐',
        icon: 'none'
      })
    }
  },

  handlePlaySong() {
    wx.navigateTo({
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + this.data.song.id
    })
  },

  /* 点击轮播图播放实时推送的音乐 */
  toPlaySong(event) {
    let bannerListIndex = event.currentTarget.id;
    let bannerList = this.data.bannerList;
    // console.log(bannerList[bannerListIndex])
    if (bannerList[bannerListIndex].song) {
      this.setData({
        song: bannerList[bannerListIndex].song
      })
      this.handlePlaySong()
    }
  },

  /* 为了确认点击的是哪个热搜榜 */
  confirmTopIndex(event) {
    this.setData({
      topListIndex: event.currentTarget.id
    })
  },

  /* 点击播放热搜榜的歌曲 */
  toPlayTopSong(event) {
    /* 区别于上方法的topListIndex，这个topIndex标识一个热搜榜中三首歌的哪一首 */
    let topIndex = event.currentTarget.id;
    console.log("topIndex=",topIndex)
    this.setData({
      song: this.data.topList[this.data.topListIndex].tracks[topIndex]
    })
    this.handlePlaySong()
  },

  //跳转到歌单歌曲列表页面
  toPlayList(event){
    // console.log(this.data.recommendList[event.currentTarget.id])

    wx.navigateTo({
      url: '/songPackage/pages/playlist/playlist?id=' + this.data.recommendList[event.currentTarget.id].id
    })
  },

  /* 点击前往音乐排行榜 */
  toTopList() {
    wx.navigateTo({
      url: '/pages/topList/topList'
    })
  },

  /* 点击前往我的歌单 */
  toMySongList() {
    wx.navigateTo({
      url: '/pages/mySongList/mySongList'
    })
  },

  /* 点击前往推荐电台 */
  toRadioList() {
    wx.navigateTo({
      url: '/pages/radio/radio'
    })
  },

  /* 点击前往MV排行榜 */
  toMVTopList() {
    wx.navigateTo({
      url: '/pages/mv/mv'
    })
  },

  /* 点击前往私人FM */
  toPersonalFM() {
    wx.navigateTo({
      url: '/songPackage/pages/personalFM/personalFM'
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
    this.handlePubSubFun()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // console.log("index页面隐藏，取消订阅执行")

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