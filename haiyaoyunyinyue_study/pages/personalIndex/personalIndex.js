// pages/personalIndex/personalIndex.js
import request from "../../utils/request";
import moment from "moment";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userDetail: [],         // 用户详情（包括等级、听歌次数等等）
    userInfo: [],           // 用户信息（包含昵称、创建时间等等）
    createTime: '',         // 创建时间
    levelInfo: {},          // 等级信息
    personalPlayList: [],           // 用户歌单
    createdPlaylistCount: 0,      // 用户自己创建的歌单数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let userId = options.userId
    this.getUserDetail(userId);
    this.getLevelInfo(userId);
  },

  async getUserDetail(userId) {
    let userDetail = await request('/user/detail',{uid: userId})
    // 格式化创建时间
    let createTime = moment(userDetail.profile.createTime).format('yyyy-MM-DD');
    this.setData({
      userDetail,
      userInfo: userDetail.profile,
      createTime
    })
  },

  async getLevelInfo(userId) {
    let levelInfo = await request('/user/subcount')
    this.setData({
      levelInfo,
      createdPlaylistCount: levelInfo.createdPlaylistCount
    })
    let personalPlayList = await request('/user/playlist',{uid: userId, limit: this.data.createdPlaylistCount})
    this.setData({
      personalPlayList: personalPlayList.playlist
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