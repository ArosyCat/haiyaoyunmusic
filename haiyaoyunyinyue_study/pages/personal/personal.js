import request from "../../utils/request";

let startY = 0;  //手指起始的坐标
let moveY = 0;  //手指移动的坐标
let moveDistance = 0;  //手指移动的距离
Page({

  /**
   * 页面的初始数据
   * coverTransform: 'translateY(0)'：让下半部分随着手指滑动而移动
   */
  data: {
    coverTransform: 'translateY(0)',
    coverTransition: '',
    userInfo: {},   // 用来存储用户信息
    recentPlayList: [],  //用户播放记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 读取用户的基本信息
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo){
      // 更新userInfo的状态
      this.setData({
        userInfo: JSON.parse(userInfo)
      })

      // 获取用户播放记录
      this.getUserRecentPlayList(this.data.userInfo.userId)

    }
  },

  // 获取用户播放记录的功能函数
  async getUserRecentPlayList(userId){
    let recentPlayListData = await request('/user/record',{uid: userId, type: 1})
    console.log(recentPlayListData)

    // 手动给播放历史的每一个Item增加一个值key
    let index = 0;
    let recentPlayList = recentPlayListData.weekData.splice(0,20).map(item => {
      item.id = index++;
      return item;
    })
    this.setData({
      recentPlayList
    })
  },

  /*个人主页的三个手指触发事件*/
  handleTouchStart(event){
    // 刚来手指点击时就将过度效果去掉(置为0)
    // 动态更新coverTransform的状态值
    this.setData({
      coverTransition: ''
    })
    // 获取手指起始坐标
    startY = event.touches[0].clientY;
  },
  handleTouchMove(event){
    moveY = event.touches[0].clientY;
    moveDistance = moveY - startY;
    if (moveDistance <= 0){
      // 移动距离小于（即不能往上滑动）等于0则不移动
      return ;
    }
    if (moveDistance >= 100){
      moveDistance = 100;
    }
    // 动态更新coverTransform的状态值
    this.setData({
      // 使用模板字符串
      coverTransform: `translateY(${moveDistance}rpx)`
    })
  },
  handleTouchEnd(){
    // 手指松开后：
    // 动态更新coverTransform的状态值
    this.setData({
      // 使用模板字符串
      coverTransform: `translateY(0rpx)`,
      coverTransition: 'transform 0.5s linear'
    })
  },

  // 跳转至登录login页面的回调
  toLogin(){
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 跳转至我的歌单界面
  toShowPersonalSongList() {
    wx.navigateTo({
      url: '/songPackage/pages/personalPlayList/personalPlayList?uid=' + this.data.userInfo.userId
    })
  },

  // 跳转至歌曲播放界面
  toPlayRecentSong(event) {

    let song = event.currentTarget.dataset;
    wx.setStorageSync('song',song)
    let currentTime = wx.getStorageSync('currentTime');
    let currentWidth = wx.getStorageSync('currentWidth');

    // 路由跳转传参：query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.song.id
          + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
    })

  },

  // 点击“我的电台”
  toShowPersonalRadio() {
    wx.navigateTo({
      url: '/songPackage/pages/personalRadio/personalRadio?uid=' + this.data.userInfo.userId
    })
  },

  // 点击“我的收藏”
  toShowPersonalCollected() {
    wx.navigateTo({
      url: '/songPackage/pages/personalCollected/personalCollected'
    })
  },

  // 点击“个人主页”
  toPersonalIndex() {
    let userId = this.data.userInfo.userId
    wx.navigateTo({
      url: '/pages/personalIndex/personalIndex?userId=' + userId
    })

  },

  // 暂时用来点击前往其他需要频繁跨页面进入的页面，方便调试
  toSimilarSinger() {
    wx.navigateTo({
      url: '/songPackage/pages/similarSong/similarSong'
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