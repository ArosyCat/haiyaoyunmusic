// songPackage/pages/personalPlayList/personalPlayList.js
import request from "../../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    personalPlayList: [],           // 用户歌单
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getPersonalPlayList(options.uid)

    wx.setNavigationBarTitle({
      title: '我的歌单'
    })

  },

  // 获取用户歌单
  async getPersonalPlayList(uid) {
    let personalPlayList = await request('/user/playlist',{uid: uid})
    this.setData({
      personalPlayList: personalPlayList.playlist
    })
  },

  // 点击某个歌单前往查看详情
  // 需要传入歌单id(pid)
  toShowPersonalPlayListDetail(event) {
    wx.navigateTo({
      url: '/pages/personalPlayListDetail/personalPlayListDetail?pid=' + event.currentTarget.id
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