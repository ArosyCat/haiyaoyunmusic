// pages/comment/comment.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    comments: {},         // 歌曲评论整体信息
    hotComments: [],      // 歌曲评论列表
    song: {}              // 歌曲对象
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    // console.log(options.musicId)

    this.getMusicComment(options.musicId);

    this.setData({
      song: wx.getStorageSync('song')
    })


    wx.setNavigationBarTitle({
      title: '热门评论'
    })
  },

  /* 获取歌曲评论 */
  async getMusicComment(musicId) {
    let comments = await request('/comment/music',{id: musicId});
    this.setData({
      comments,
      hotComments: comments.hotComments
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