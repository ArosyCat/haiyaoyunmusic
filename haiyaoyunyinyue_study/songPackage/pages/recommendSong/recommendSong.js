import PubSub from 'pubsub-js'
import request from "../../../utils/request";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',                        // 天
    month: '',                      // 月
    recommendList: [],              // 推荐列表数据
    index: 0,                       // 点击音乐的下标
    // isRecommend: true
    isMultipleModel: false,         // 标识是否为多选模式
    currentMusicId: 0,             // 标识当前音乐id
    selectedIndexList: [],          // 定义一个已经选择的音乐列表的下标集合 （里面是布尔值：true标识已选，false标识未选）
    multipleMusicIdList: [],        // 存放多选模式下选择的音乐id
    song: {},                       // 当前选择的歌曲
    isClose: true,                   // 用来判断当前弹框是否关闭，默认是hidden=true，就是隐藏
    similarSinger: [],              // 相似歌手列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          // 跳转至登录界面
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
    }
    // 更新日期的状态
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1
    })

    // 获取用户每日推荐的数据
    this.getRecommendList();

    this.handlePubSubFun()
  },

  handlePubSubFun() {
    // 取消订阅
    PubSub.unsubscribe('switchType');
    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,{type,playModel}) => {
      // console.log(msg,{type,playModel});

      let {recommendList,index} = this.data;
      if (playModel === 0) {
        if (type === 'pre') {   // 上一首
          (index === 0) && (index = recommendList.length)
          index -= 1;
        } else {                // 下一首
          (index === recommendList.length - 1) && (index = -1)
          index += 1;
        }
      }
      // playModel=2 -> 随机播放模式
      else if (playModel === 2) {
        console.log(playModel)
        let randomIndex = Math.floor(Math.random()*32);
        if (randomIndex === index) {
          randomIndex = Math.floor(Math.random()*32);
        } else {
          index = randomIndex;
        }
        // console.log(randomIndex)
      }

      // 更新下标
      this.setData({
        index
      })

      let musicId = recommendList[index].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId',musicId)
    });
  },

  // 获取用户每日推荐的数据
  async getRecommendList() {
    let recommendListData = await request('/recommend/songs')
    this.setData({
      recommendList: recommendListData.recommend
    })

    let selectedIndexList = this.data.selectedIndexList;
    // 先将selectedIndexList列表中所有值取false
    for (let i = 0; i < this.data.recommendList.length; i++) {
      selectedIndexList.push(false);
    }
    this.setData({
      selectedIndexList
    })

  },

  // 跳转至songDetail页面
  toSongDetail(event) {
    let {song, index} = event.currentTarget.dataset;
    wx.setStorageSync('song',song)
    this.setData({
      index
    })
    let currentTime = wx.getStorageSync('currentTime');
    let currentWidth = wx.getStorageSync('currentWidth');
    // 路由跳转传参：query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.id
          + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
    })
  },

  /* 点击播放全部 */
  // 其实就是选第一首进行播放
  playAll() {
    // 订阅recommendList列表
    this.handlePubSubFun();
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + this.data.recommendList[0].id
    })

  },

  // 多选功能
  multipleChoice() {
    let isMultipleModel = !this.data.isMultipleModel;
    this.setData({
      isMultipleModel
    })
  },

  // 播放已选功能
  async toPlayMultipleChoice() {
    let selectedIndexList = this.data.selectedIndexList;
    let multipleMusicIdList = this.data.multipleMusicIdList;
    // 遍历selectedIndexList
    for (let i = 0; i < selectedIndexList.length; i++) {
      // 如果为true，得到下标
      if (selectedIndexList[i]) {
        let musicId = this.data.recommendList[i].id;
        // 将音乐Id push进集合，取出时pop，pop到列表为空时播放结束
        multipleMusicIdList.push(musicId);
        // 还要记得将selectedIndexList[i]下标改为false，因为已经放进播放列表了
        selectedIndexList[i] = false;
        this.setData({
          multipleMusicIdList,
          selectedIndexList
        })
      }
    }

    // 将isMultipleModel模式解除
    this.setData({
      isMultipleModel: false
    })

    // 在Pubsub订阅机制那边将列表换为multipleMusicIdList
    // 取消订阅
    PubSub.unsubscribe('switchType');
    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,{type,playModel}) => {
      // console.log(msg,{type,playModel});

      let {multipleMusicIdList,index} = this.data;
      if (playModel === 0) {
        if (type === 'pre') {   // 上一首
          (index === 0) && (index = multipleMusicIdList.length)
          index -= 1;
        } else {                // 下一首
          (index === multipleMusicIdList.length - 1) && (index = -1)
          index += 1;
        }
      }
      // playModel=2 -> 随机播放模式
      else if (playModel === 2) {
        console.log(playModel)
        let randomIndex = Math.floor(Math.random()*multipleMusicIdList.length);
        if (randomIndex === index) {
          randomIndex = Math.floor(Math.random()*multipleMusicIdList.length);
        } else {
          index = randomIndex;
        }
        // console.log(randomIndex)
      }
      // 更新下标
      this.setData({
        index
      })
      let musicId = multipleMusicIdList[index];
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId',musicId)
    });

    // 使用第一个音乐链接获得第一首音乐的详情信息，用于跳转到播放页
    let song = await request('/song/detail',{ids: this.data.multipleMusicIdList[0]})
    wx.setStorageSync('song',song.songs[0])
    // 前往播放
    let currentTime = wx.getStorageSync('currentTime');
    let currentWidth = wx.getStorageSync('currentWidth');
    // 路由跳转传参：query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.songs[0].id
          + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
    })
  },

  // 处理多选模式下选中或取消功能的函数
  handleChoice(event) {
    // 获取当前音乐下标
    let currentIndex = event.currentTarget.dataset.index;

    let selectedIndexList = this.data.selectedIndexList;

    // 获取当前音乐在selectedIndexList位置上的状态
    let status = selectedIndexList[currentIndex];
    // 将当前选择音乐在selectedIndexList列表中的状态取反
    selectedIndexList[currentIndex] = !status;
    // 取反后将整个列表在全局更新一下
    this.setData({
      selectedIndexList
    })
  },

  // 点击歌曲后面三点，展示更多功能
  toShowMoreFunction(event) {
    // 使用了catchTap阻止点击事件的冒泡行为
    // console.log("点击三点")
    // 让弹框显示
    this.setData({
      isClose: false,
      song: event.currentTarget.dataset.song
    })
  },

  // 关闭弹框
  toClose() {
    this.setData({
      isClose: true
    })
  },

  // 点击搜索
  toSearch(event) {
    wx.navigateTo({
      url: '/pages/searchList/searchList?keywords=' + event.currentTarget.dataset.value
    })
  },

  // 点击查找与当前歌手风格相似的歌手 /simi/artist?id=6452
  async toSearchSimilarSinger(event) {
    // console.log(event.currentTarget.dataset.value)
    // let similarSinger = await request('/simi/artist',{id: singerId})
    // this.setData({
    //   similarSinger
    // })
    let aid = event.currentTarget.dataset.value;
    wx.navigateTo({
      url: '/songPackage/pages/similarSinger/similarSinger?aid=' + aid
    })
  },

  // 去相似歌曲的播放界面
  toPlaySimilarSong() {
    wx.navigateTo({
      url: '/songPackage/pages/similarSong/similarSong?musicId=' + this.data.song.id
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