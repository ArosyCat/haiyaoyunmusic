// pages/playlist/playlist.js
import request from '../../../utils/request'
import PubSub from 'pubsub-js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listId: '',         // 歌单id
    playlist: [],       // 歌曲对象
    listImg: '',        // 歌单图片
    discribe: '',       // 歌单描述
    index: 0,           // 下标
    isCollect: false,   // 是否收藏该歌单
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取歌单id
    let listId = options.id;
    // 由于点击哪个歌单就是哪个歌单跳转进来的，不会发生变化了，
    // 所以listId可以在onLoad中先设置值
    this.setData({
      listId
    })

    // 获取歌单歌曲
    this.getplaylist(listId);

    let flag = wx.getStorageSync('flag');

      // 取消订阅
      PubSub.unsubscribe('switchType');
      // 订阅来自songDetail页面发布的消息
      PubSub.subscribe('switchType',(msg,{type,playModel}) => {
        // console.log(msg,{type,playModel});
        // 解构
        let {playlist,index} = this.data;
        // console.log(this.data)
        if (playModel === 0) {
          if (type === 'pre') {   // 上一首
            (index === 0) && (index = playlist.length)
            index -= 1;
          } else {                // 下一首
            (index === playlist.length - 1) && (index = -1)
            index += 1;
          }
        }

        // playModel=2 -> 随机播放模式
        else if (playModel === 2) {
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

        let musicId = playlist[index].id;
        // 将musicId回传给songDetail页面
        PubSub.publish('musicId',musicId)
      });
  },

  //获取歌单所对应的歌曲
  async getplaylist(listId){
    let playlistData = await request("/playlist/detail",{id: listId});
    // console.log(playlistData)
    this.setData({
      playlist: playlistData.playlist.tracks,
      listImg: playlistData.playlist.coverImgUrl,
      discribe: playlistData.playlist.name
    })
  },

  // 跳转至songDetail页面
  toSongDetail(event) {
    let {song, index} = event.currentTarget.dataset;
    this.setData({
      index
    })

    // 路由跳转传参：query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + song.id
    })
  },

  // 收藏该歌单 /playlist/subscribe?t=1&id=106697785   (1 = 收藏；2 = 取消收藏)
  async handleCollect() {
    // 这里应该是先去找出所有用户已经收藏的歌单列表，
    // 再逐一判断listId是否已经存在，如果存在isCollect应该为true
    // 这里就不判断简单的执行一下就可以了
    let isCollect = !this.data.isCollect
    this.setData({
      isCollect
    })
    if (isCollect) {
      await request('/playlist/subscribe',{t: 1,id: this.data.listId})
    } else {
      await request('/playlist/subscribe',{t: 2,id: this.data.listId})
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