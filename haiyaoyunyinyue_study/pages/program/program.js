// pages/program/program.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    programList: [],            // 节目集合
    programUrl: '',             // 某个节目的播放地址
    pid: 0,                     // 当前的programId
    isPlay: false,              // 判断当前节目是否正在播放
    index: 0,                   // 标识点击要播放的节目的下标
    prePid: 0,                  // 记录上一个节目的id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    // console.log(options.rid)

    this.getProgramList(options.rid)

    // 获取全局唯一的音频管理器
    this.backgroundAudioManager = wx.getBackgroundAudioManager();

    console.log()

    // 监听音频播放结束
    this.backgroundAudioManager.onEnded(() => {
      console.log("进入监听音频onEnded()事件")
      let index = this.data.index;
      index = parseInt(index)
      console.log("preIndex:",index)
      this.setData({
        index: index + 1,
      })
      console.log("afterIndex",this.data.index);
      console.log(this.data.programList[this.data.index].mainSong.id)
      this.getProgramDetail(this.data.programList[this.data.index].mainSong.id)

    })


  },

  // 获取某电台的所有节目
  async getProgramList(rid) {
    let programList = await request('/dj/program',{rid: rid})
    this.setData({
      programList: programList.programs
    })
    this.setData({
      pid: this.data.programList[0].mainSong.id
    })
    // 将电台名设为标题
    wx.setNavigationBarTitle({
      title: programList.programs[0].dj.brand
    })

  },

  // 点击节目开始播放
  toPlayProgram(event) {
    // console.log(event)
    // 得到节目id
    let pid = event.currentTarget.id;         // string类型

    // 判断是否点击了同一个节目，如果是同一个就不给prePid赋值，如果不是就赋值并且把播放状态设为未播放
    if (pid !== this.data.prePid) {
      console.log("进入pid和prePid判断")
      this.setData({
        // 有点问题
        isPlay: false,
        prePid: pid
      })
    }
    this.setData({
      index: event.currentTarget.dataset.index,
      pid: parseInt(pid),
    })
    // 当播放状态为false（即未播放）时，点击播放才去获取地址加播放
    if (!this.data.isPlay) {
      // 使用节目id就能获取节目播放地址（/song/url?id=xxx）
      this.getProgramDetail(pid)
    } else {
      // 音频暂停
      this.backgroundAudioManager.pause();
      this.setData({
        isPlay: false
      })
    }

  },

  async getProgramDetail(pid) {
    let programDetail = await request('/song/url',{id: pid})
    this.setData({
      programUrl: programDetail.data[0].url,
      isPlay: true,
      pid: parseInt(pid),
      prePid: pid
    })

    // 获取播放地址
    let programUrl = this.data.programUrl;
    // 放链接（必填）
    this.backgroundAudioManager.src = programUrl;
    // 设置标题（必填）
    this.backgroundAudioManager.title = this.data.programList[this.data.index].name;
  },

  // 播放全部
  toPlayAll(event) {
    console.log(event)
    this.toPlayProgram(event)
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