// songPackage/pages/personalCollected/personalCollected.js
import request from "../../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userCollectedList: [],          // 用户收藏列表
    isOpenList: [],                 // 是否展开更多详情
    albumInfoList: [],                  // 专辑详情列表
    initHide: true,                 //
    currentAlbumId: 0,              // 当前专辑id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getUserCollectedList()
  },

  // 获取用户收藏列表
  async getUserCollectedList() {
    let userCollectedList = await request('/album/sublist')
    this.setData({
      userCollectedList: userCollectedList.data
    })
    userCollectedList = this.data.userCollectedList;
    let albumInfoList = this.data.albumInfoList;
    for (let i = 0; i < userCollectedList.length; i++) {
      // 获取音乐详情
      let albumInfo = await request('/album',{id: userCollectedList[i].id})
      albumInfoList[i] = albumInfo;
    }
    this.setData({
      albumInfoList,
    })

    let userCollectedListLength = userCollectedList.length;
    let isOpenList = this.data.isOpenList;
    for (let i = 0; i < userCollectedListLength; i++ ){
      isOpenList[i] = false
    }
    this.setData({
      isOpenList,
    })
  },

  // 下拉展示专辑详情
  showMore(event) {

    let currentAlbumId = event.currentTarget.dataset.id;

    let index = event.currentTarget.dataset.index;
    let isOpenList = this.data.isOpenList;
    isOpenList[index] = !isOpenList[index];
    this.setData({
      isOpenList,
      currentAlbumId
    })

    if(this.data.isOpenList[index]){
      this.setData({
        initHide: false,
      })
    } else {
      this.setData({
        initHide: true,
      })
    }
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