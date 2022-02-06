// pages/moreSongList/moreSongList.js
import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hotPlayList: [],              // 热门歌单
    hotPlayListLength: 0,         // 热门歌单列表长度
    hotPlayListDetail: [],        // 存储所有歌单的详细信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getHotPlayList()
  },

  // 获取热门歌单
  async getHotPlayList() {
    let hotPlayList = await request('/playlist/hot')
    this.setData({
      hotPlayList: hotPlayList.tags,
      hotPlayListLength: hotPlayList.tags.length
    })

    // 获取所有热门歌单的详情信息
    for (let i = 0; i < this.data.hotPlayListLength; i++) {
      // 利用每个pid获取每种歌单的详情
      let playListDetail = await request('/top/playlist',{cat: this.data.hotPlayList[i].name,limit: 20,order: 'hot'})

      let hotPlayListDetail = this.data.hotPlayListDetail;
      // 将每种歌单的详情放入集合中
      hotPlayListDetail.push(playListDetail)
      // 将集合设置回全局
      this.setData({
        hotPlayListDetail
      })
    }
  },

  // 前往歌单详情页
  toPlayList(event) {
    let musicId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: '/songPackage/pages/playlist/playlist?id=' + musicId
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