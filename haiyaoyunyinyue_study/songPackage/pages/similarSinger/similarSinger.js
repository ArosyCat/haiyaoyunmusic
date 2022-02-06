// songPackage/pages/similarSinger/similarSinger.js
import request from "../../../utils/request";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    similarList: [],            // 相似歌手列表
    singerDetail: {},           // 歌手详情描述
    isOpen: false,              // 歌手介绍是否打开，默认关闭
    similarListIsOpen: [],      // 整个列表设置为false,只要有一个打开就设置为true
    otherSingerDetail: [],      // 其他所有歌手的详情
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let aid = options.aid;
    this.getSimilarSinger(aid)
    this.getSingerDesc(aid);
  },

  // 获取歌手描述
  async getSingerDesc(aid) {
    let singerDetail = await request('/artists/detail',{id: aid});
    this.setData({
      singerDetail
    })
  },

  // 获取相似歌手
  async getSimilarSinger(aid) {
    let similarList = await request('/simi/artist',{id: aid})
    this.setData({
      similarList: similarList.artists
    })
    similarList = this.data.similarList;
    let similarListIsOpen = this.data.similarListIsOpen;
    // 定义一个收集所有歌手信息的列表
    let otherSingerDetail = [];
    for (let i = 0; i < similarList.length; i++) {
      similarListIsOpen[i] = false;
      let singerDetail = await request('/artists/detail',{id: similarList[i].id});
      otherSingerDetail.push(singerDetail.artist)
    }
    this.setData({
      similarListIsOpen,
      otherSingerDetail
    })
  },

  // 打开介绍
  openIntroduce() {
    let isOpen = !this.data.isOpen;
    this.setData({
      isOpen
    })
  },

  // 打开其他歌手的介绍
  openSearchSingerIntro(event) {
    // 得到点击的是哪一个元素的下标
    let index = event.currentTarget.dataset.index;
    let similarListIsOpen = this.data.similarListIsOpen;
    // 取反
    similarListIsOpen[index] = !similarListIsOpen[index];
    this.setData({
      similarListIsOpen
    })
  },

  // 前往歌手页面
  toSingerPage(event) {
    wx.navigateTo({
      url: '/songPackage/pages/singerPage/singerPage?sid=' + event.currentTarget.dataset.id
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