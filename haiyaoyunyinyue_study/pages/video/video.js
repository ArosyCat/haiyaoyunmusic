import request from "../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [],   // 导航标签数据
    navId: '',            // 导航的标识，用于区分点击
    videoList: [],        // 视频列表数据
    videoId: '',          // 视频id标识
    videoUpdateTime: [],  // 记录video播放的时长
    isTriggered: false,   // 标识下拉刷新是否被触发
    song: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取导航数据，在页面加载的时候
    this.getVideoGroupListData();
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0,14), // 0-13,一共14个
      navId: videoGroupListData.data[0].id
    })
    // 获取视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 获取视频列表数据
  async getVideoList(navId) {
    if (!navId) { // 判断navId为空串的情况
      return;
    }
    let videoListData = await request('/video/group',{id: navId});

    // 关闭"正在加载"消息提示框
    wx.hideLoading();

    let index = 0;
    let videoList = videoListData.datas.map(item => {
      item.id = index++;
      return item;
    })
    this.setData({
      videoList,   // 同名属性可以不写videoList: videoList
      isTriggered: false // 关闭下拉刷新
    })
    // console.log("videoList",this.data.videoList);
  },

  // 点击切换导航的回调
  changNav(event) {
    // 通过id向event传参的时候如果传的是number会自动转换成string
    let navId = event.currentTarget.id;
    this.setData({
      // 原Item中的每个Id都是Number类型的，
      // 但是获取过来的id变成string类型的，
      // wxml文件中{{navId === item.id}}类型不一致，无法比较，
      // 所以*1(或者>>>0)转换成number类型的再传回去就可以进行比较了
      navId: navId*1,
      videoList: []
    });

    // 显示正在加载
    wx.showLoading({
      title: '正在加载'
    })

    // 获取视频列表数据，在拿到navId之后，也就是navId的值不为空的时候
    // 动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId);
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
    let vid = event.currentTarget.id;

    // 关闭上一个播放的视频
    // this.vid !== vid && this.videoContext && this.videoContext.stop();
    // this.vid = vid;

    // 更新data中videoId的状态数据
    this.setData({
      videoId: vid,
    })

    // 创建控制video标签的实例对象
    this.videoContext = wx.createVideoContext(vid);

    // 判断当前视频之前是否播放过，或是否有播放记录
    // 如果有，跳转至指定的播放位置
    let {videoUpdateTime} = this.data;
    let videoItem = videoUpdateTime.find(item => item.vid === vid);
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
    // console.log(event);
    let videoTimeObj = {vid: event.currentTarget.id,currentTime: event.detail.currentTime};
    let {videoUpdateTime} = this.data;
    /*
    * 思路：判断记录播放时长的videoUpdateTime数组中是否有当前视频的播放记录
    *   1.如果有，在原有的播放记录中修改播放时间为当前播放时间
    *   2.如果没有，需要在数组中添加当前视频的播放对象
    *
    * */
    let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid);
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

  // 自定义下拉刷新的回调：scroll-view
  handleRefresher() {
    console.log('scroll-view 下拉刷新');
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 自定义上拉触底的回调
  async handleToLower() {
    // offset控制页数，取1-20的随机数
    let offset = Math.floor(Math.random() * 20 + 1);
    let newVideoListData = await request('/video/group', {
      id: this.data.navId,
      offset: offset
    })
    let videoList = this.data.videoList
    // 将视频最新的数据更新到原有视频列表数据中
    videoList.push(...newVideoListData.datas)
    this.setData({
      videoList
    })
  },

  /* 跳转到搜索歌曲页面 */
  toSearchSongs() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /* 跳转至首页 */
  toIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /* 跳转至播放歌曲页面 */
  toSongDetail() {
    // 先从Storage域中取出歌曲数据
    // 注意：这里不能在onLoad中取，因为onLoad只会加载一次，所以下次不会更新新的歌曲数据
    this.setData({
      song: wx.getStorageSync('song')
    })
    let musicId = this.data.song.id;
    let currentTime = wx.getStorageSync('currentTime');
    let currentWidth = wx.getStorageSync('currentWidth');
    if (musicId) {
      wx.navigateTo({
        // isIndex标识是从首页或视频页跳转过去的，保持正在播放或者停止的状态就可以了
        url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId + '&isIndex=' + this.data.isIndex
            + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
      })
    } else {
      wx.showToast({
        title: '目前还没有播放任何音乐',
        icon: 'none'
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
    console.log('页面的下拉刷新');
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('页面的上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
    // console.log(event)
    if (from === 'button') {
      console.log()
        let {videoList} = this.data;
        let target = videoList.find(item => item.data.vid === this.data.videoId);
        let imageUrl = target.data.coverUrl;
        let title = target.data.title;
        return {
          title,
          page: '/pages/video/video',
          imageUrl
        }

    } else {
        return {
            title: '来自menu的转发',
            page: '/pages/video/video',
            imageUrl
        }
    }
  }
})