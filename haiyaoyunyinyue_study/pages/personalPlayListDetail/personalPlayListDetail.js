// pages/personalPlayListDetail/personalPlayListDetail.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pid: 0,               // 歌单id
    playListDetail: {},   // 歌单详情
    tracks: [],           // 存放歌曲信息（不包含url），用来在界面显示歌曲列表的信息
    // 存放所有歌曲id，返回的 trackIds 是完整的，tracks 则是不完整的，
    // 可拿全部 trackIds 请求一次 song/detail 接口获取所有歌曲的详情
    trackIds: [],
    musicLinks: [],       // 存放当前歌单所有歌曲的url
    isPlay: false,        // 播放状态（true:播放,false:暂停）
    song: {},             // 歌曲信息
    index: 0,             // 数组下标，用来标识哪首歌的url
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      pid: options.pid
    })

    this.getPersonalPlayListDetail()

    // 创建控制音乐播放的实例对象
    this.backgroundAudioManager = wx.getBackgroundAudioManager();


  },

  // 获取用户歌单详情
  async getPersonalPlayListDetail() {
    let playListDetail = await request('/playlist/detail',{id: this.data.pid})
    // 获取歌单详情和歌曲信息（但是不包含歌曲播放地址url，需要去发另外一个请求）
    this.setData({
      playListDetail: playListDetail.playlist,
      tracks: playListDetail.playlist.tracks,
      trackIds: playListDetail.playlist.trackIds          // 用来发请求获取url
    })
    // 将点击的歌单名称作为标题
    wx.setNavigationBarTitle({
      title: this.data.playListDetail.name
    })

    // 获取所有歌曲url
    let trackIds = this.data.trackIds;
    let musicLinks = this.data.musicLinks;
    for (let i = 0; i < trackIds.length; i++) {
      let musicLink = await request('/song/url',{id: trackIds[i].id})

      musicLinks.push(musicLink.data[0])
      this.setData({
        musicLinks
      })
    }
  },

  // 点击歌曲就开始在底部磁盘区播放歌曲（这里不跳转到歌曲播放界面）
  toHandlePlay(event) {
    this.setData({
      song: event.currentTarget.dataset.song,
      index: event.currentTarget.dataset.index
    })
    this.handlePlay();
  },

  // 点击底部磁盘的播放键 播放 / 暂停
  handlePlay() {
    let isPlay = !this.data.isPlay;

    this.setData({
      isPlay
    })

    // 有url数组，有index下标就可以知道播放哪首歌，用全局音频管理器backgroundAudioManager管理
    if (isPlay) {
      let currentMusicLink = this.data.musicLinks[this.data.index].url
      let currentMusicTitle = this.data.tracks[this.data.index].name

      this.backgroundAudioManager.src = currentMusicLink
      this.backgroundAudioManager.title = currentMusicTitle

    } else {

      // 音乐暂停
      this.backgroundAudioManager.pause();

    }

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