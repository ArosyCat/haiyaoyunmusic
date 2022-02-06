// songPackage/pages/singerPage/singerPage.js
import request from "../../../utils/request";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isClose: true,
    artistDetail: {},           // 歌手信息
    hotSongs: [],               // 歌手的50首热门歌曲
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let sid = options.sid
    this.getArtistDetail(sid)
  },

  async getArtistDetail(sid) {
    let artistDetail = await request('/artists/detail',{id: sid})
    this.setData({
      artistDetail: artistDetail.artist,
      hotSongs: artistDetail.hotSongs
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