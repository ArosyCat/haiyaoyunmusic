// pages/radio/radio.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hotRadioDetailList: [],             // 热门电台详情列表
    currentRadioId: '',                 // 当前点击的电台id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getHotRadioList()


    wx.setNavigationBarTitle({
      title: '热门电台'
    })

  },

  /* 获取热门电台列表 */
  async getHotRadioList() {
    // 获取到热门电台排行列表
    let hotRadioList = await request('/dj/toplist?type=hot',{limit: 50});

    let hotRadioDetailList = this.data.hotRadioDetailList;

    // for循环获取电台详情
    // 用radioId获取电台详情信息
    for (let i = 0; i < hotRadioList.toplist.length; i++) {
      // 使用rid获取每个电台的详情（但不包含电台的url）
      let radioDetail = await request('/dj/detail',{rid: hotRadioList.toplist[i].id});

      hotRadioDetailList.push(radioDetail);
      this.setData({
        hotRadioDetailList,
      })
    }
  },

  // 点击去展示该电台下的所有节目页面（需要带上rid）
  toShowProgram(event) {
    let currentRadioId = event.currentTarget.id;

    this.setData({
      currentRadioId
    })

    wx.navigateTo({
      url: '/pages/program/program?rid=' + currentRadioId
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