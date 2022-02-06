// pages/mv/mv.js
import request from "../../utils/request";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    latestMVList: [],         // 最新MV排行榜前30的视频列表
    latestMVListLength: 0,    //
    mvInfoList: [],           // 存放所有mv的详细信息
    videoId: '',              // 视频id标识
    videoIdNum: 0,            // num类型的videoId
    videoUpdateTime: [],      // 记录video播放的时长
    urlDetail: '',            // 记录mv播放地址
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取排行前30的mv，主要是为了获取每个mvid
    this.getLatestMV()


  },

  // 获取最新MV视频
  async getLatestMV() {
    let latestMVList = await request('/top/mv')
    this.setData({
      latestMVList: latestMVList.data,
      latestMVListLength: latestMVList.data.length
    })
    let latestMVListLength = this.data.latestMVListLength
    let mvInfoList = this.data.mvInfoList
    for (let i = 0; i < latestMVListLength; i++) {
      let mvDetailList = await request('/mv/detail',{mvid: latestMVList.data[i].id})
      mvInfoList.push(mvDetailList.data.brs[720])
      this.setData({
        mvInfoList
      })
    }
  },

  // 获取每个mv的地址
  async getMVUrlDetail(vid) {
    let mvDetail = await request('/mv/detail',{mvid: vid})
    // 获取到每个mv的url
    let urlDetail = mvDetail.data
    let mvInfoList = this.data.mvInfoList;
    mvInfoList.push(urlDetail)
  },

  getMVUrlList() {
    let latestMVList = this.data.latestMVList


  },

  // 点击播放/继续播放的回调
  handlePlay(event) {
    /*
    * 解决多个视频同时播放的问题
    *   ①播放1->播放2->停止1
    *   ②播放->停止->继续播放
    * 需求：
    *   1.在点击播放的事件中需要找到上一个播放的视频
    *   2.在播放新的视频之前关闭上一个正在播放的视频
    * 关键：
    *   1.如何找到上一个视频的实例对象
    *   2.如何确认点击播放的视频和正在播放的视频不是同一个视频
    * 单例模式：
    *   1.需要创建多个对象的场景下，通过一个变量接收，始终保持只有一个对象
    *   2.节省内容空间
    * */
    // 获取每个视频的唯一标识
    let vid = event.currentTarget.id;             // string类型
    // 关闭上一个播放的视频
    // this.vid !== vid && this.videoContext && this.videoContext.stop();
    // this.vid = vid;

    // 更新data中videoId的状态数据
    this.setData({
      videoId: vid,
      videoIdNum: parseInt(vid)
    })

    // 创建控制video标签的实例对象
    this.videoContext = wx.createVideoContext(vid);
    // 判断当前视频之前是否播放过，或是否有播放记录
    // 如果有，跳转至指定的播放位置
    let {videoUpdateTime} = this.data;
    let videoItem = videoUpdateTime.find(item => item.videoId === vid);
    if (videoItem) {  // 有播放记录
      // VideoContext.seek(number position)
      // 跳转到指定位置的方法，传入秒数
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play();
    // this.videoContext.stop();
  },

  // 监听视频播放进度的回调
  handleTimeUpdate(event) {
    let videoTimeObj = {videoId: event.currentTarget.id,currentTime: event.detail.currentTime};

    let {videoUpdateTime} = this.data;

    /*
    * 思路：判断记录播放时长的videoUpdateTime数组中是否有当前视频的播放记录
    *   1.如果有，在原有的播放记录中修改播放时间为当前播放时间
    *   2.如果没有，需要在数组中添加当前视频的播放对象
    *
    * */
    let videoItem = videoUpdateTime.find(item => item.videoId === videoTimeObj.videoId);

    if (videoItem) {  // 之前有
      videoItem.currentTime = event.detail.currentTime;
    } else {   // 之前没有
      videoUpdateTime.push(videoTimeObj);
    }
    // 更新videoUpdateTime的状态
    this.setData({
      videoUpdateTime
    })
  },

  // 视频播放结束调用的回调
  handleEnded(event) {
    // 移除记录播放时长数组中当前视频的对象
    let {videoUpdateTime} = this.data;
    // findIndex()方法是找到数组某个元素对应的下标
    // splice(index,deleteCount):第一个参数就是要删除的某个数组的下标
    videoUpdateTime.splice(videoUpdateTime.findIndex(item => item.vid === event.currentTarget.id),1);
    this.setData({
      videoUpdateTime
    })
  },

  // 点击跳转到MV评论区
  toShowMVComment(event) {
    wx.navigateTo({
      url: '/pages/mvComment/mvComment?id=' + event.currentTarget.dataset.id
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