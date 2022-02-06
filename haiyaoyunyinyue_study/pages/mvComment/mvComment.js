// pages/mvComment/mvComment.js
import request from "../../utils/request";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    mvId: 0,              // mvId
    MVComment: [],        // mv评论
    hotComments: [],      // 热门评论
    latestComments: [],   // 最新评论
    hotOrLatest: 'hot',   // 选择的是热门评论还是最新评论，默认是热门
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let mvId = options.id
    this.setData({
      mvId
    })
    this.getMVComment(mvId)

    wx.setNavigationBarTitle({
      title: 'MV评论'
    })

  },
  // 获取MV评论
  async getMVComment(id) {
    let MVComment = await request('/comment/mv',{id: id})
    this.setData({
      MVComment,
      hotComments: MVComment.hotComments,
      latestComments: MVComment.comments
    })
  },

  // 点击热门评论
  showHotComment(event) {
    let type = event.currentTarget.dataset.type;

    this.setData({
      hotOrLatest: type
    })
  },

  // 点击最新评论
  showLatestComment(event) {
    let type = event.currentTarget.dataset.type;

    this.setData({
      hotOrLatest: type
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