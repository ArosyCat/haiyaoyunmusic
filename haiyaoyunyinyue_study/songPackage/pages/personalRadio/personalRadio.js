// songPackage/pages/peronalRadio/personalRadio.js
import request from "../../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    uid: '',                // userId
    UserRadioList: [],          // 用户电台列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.setData({
      uid: options.uid
    })

    this.getUserRadio()

  },

  // 获取用户电台
  async getUserRadio() {
    let userRadioList = await request('/user/dj',{uid: this.data.uid});
    this.setData({
      userRadioList
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