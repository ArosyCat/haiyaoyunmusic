// pages/mySongList/mySongList.js
import request from "../../utils/request";
import PubSub from "pubsub-js";
let startY = 0;  //手指起始的坐标
let moveY = 0;  //手指移动的坐标
let moveDistance = 0;  //手指移动的距离
let preDistance = 0;    // 用来记录上一次的移动距离
let realDistance = 0;   // 用来记录实际应该移动的距离
let startNum = 11;    // 从第11首开始加载
let loadNum = 20;    // 每次触底加载20首
let count = 0;        // 上拉触底的次数

Page({

  /**
   * 页面的初始数据
   */
  data: {
    mySongList: {},                 // 我的歌单
    mySongListLength: 0,            //
    likeList: [],                   // 我喜欢的音乐列表
    firstPicUrl: '',                // 第一首歌的封面作为我喜欢的封面
    index: 0,                       // 点击音乐的下标
    song: {},                       // 记录歌曲信息
    isPlay: false,                  // 播放
    musicLink: '',                  // 记录音乐播放的链接
    isMultipleModel: false,         // 标识是否为多选模式
    currentMusicId: 0,              // 标识当前音乐id
    selectedIndexList: [],          // 定义一个已经选择的音乐列表的下标集合 （里面是布尔值：true标识已选，false标识未选）
    multipleMusicIdList: [],        // 存放多选模式下选择的音乐id
    isClose: true,                  // 用来判断当前弹框是否关闭，默认是hidden=true，就是隐藏
    similarSinger: [],              // 相似歌手列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.setData({
      song: wx.getStorageSync('song'),
    })

    wx.setNavigationBarTitle({
      title: '我的音乐'
    })

    // 获取所有音乐id列表
    this.getMySongList()

    // 订阅songDetail消息
    this.handlePubSubFun()

    // 获取全局音频管理器
    this.backgroundAudioManager = wx.getBackgroundAudioManager();


  },

  /* 获取我喜欢的音乐列表 */
  async getMySongList() {
    let userInfo = wx.getStorageSync('userInfo');
    let userId = userInfo.userId;
    // 获取我喜欢的所有音乐id
    let mySongList = await request('/likelist',{uid: userId})

    this.setData({
      mySongList,
      mySongListLength: mySongList.ids.length
    })
    this.getMusicDetailByForeach(0,10)
  },


  /* 循环获取音乐详情 */
  async getMusicDetailByForeach(startNum,loadNum) {
    let likeList = this.data.likeList;
    let musicId = 0;
    let likeSong = {};
    // 循环遍历喜欢的音乐id
    for (let i = startNum; i < loadNum; i++) {
      musicId = this.data.mySongList.ids[i];
      likeSong = await request('/song/detail',{ids: musicId})
      if (i === 0) {
        this.setData({
          firstPicUrl: likeSong.songs[0].al.picUrl
        })
      }
      likeList.push(likeSong.songs)
    }

    // 遍历完重新赋值回去
    this.setData({
      likeList
    })
  },

  /*个人主页的三个手指触发事件*/
  handleTouchStart(event){
    startY = event.touches[0].clientY;
  },
  handleTouchMove(event){
    moveY = event.touches[0].clientY;
    moveDistance = startY - moveY;

    if (moveDistance <= 0){
      // 移动距离大于（即不能往下滑动）等于0则不移动
      return ;
    }
    if (moveDistance >= 200){
      moveDistance = 200;
    }
    // TODO    就在手指滑动的位置定格，滑上也好滑下也好，手指停在哪，就在哪里定格
    if (moveDistance > preDistance) {
      realDistance = moveDistance - preDistance
      preDistance = moveDistance;

    }
    this.setData({
      coverTransform: `translateY(-${realDistance}rpx)`
    })
  },

  // 跳转至songDetail页面
  toSongDetail(event) {
    // console.log("mySongList-toSongDetail-song[0]",event.currentTarget.dataset.song[0])
    let {song, index} = event.currentTarget.dataset;
    // console.log(song)
    // console.log("mySongList-toSongDetail-song.id",song.id)

    wx.setStorageSync('song',song)
    this.setData({
      index,
      song: song
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

  // 控制底部播放器  播放 / 暂停按钮功能
  handlePlay() {
    let isPlay = !this.data.isPlay
    this.setData({
      isPlay
    })

    let musicName = this.data.song.name
    let musicLink = wx.getStorageSync('musicLink')

    // 播放
    if (isPlay) {
      this.backgroundAudioManager.src = musicLink
      this.backgroundAudioManager.title = musicName
    } else {
      // 暂停
      this.backgroundAudioManager.pause()
    }
  },

  // 控制底部播放器  上一首 / 下一首按钮功能
  handleSwitch(event) {
    let type = event.currentTarget.id;    // 获得播放类型(上、下一首)
    let index = this.data.index;          // 获得当前播放的index
    if (type === 'pre') {
      if (index === 0) {
        index = this.data.likeList.length - 1;
      } else {
        index = index - 1;
      }
    } else if (type === 'next') {
      if (index === this.data.likeList.length - 1) {
        index = 0;
      } else {
        index = index + 1;
      }
    }
    // 获取音乐信息
    let song = this.data.likeList[index][0];
    // 更新全局变量
    this.setData({
      isPlay: false,
      song,               // 全局歌曲更新了不要忘记本地内存也要更新一下
      index
    })
    wx.setStorageSync('song',this.data.song);
    // 获取音乐的播放链接
    this.getMusicLink(song.id);

  },

  // 获取音乐url的回调函数
  async getMusicLink(id) {
    let musicLink = await request('/song/url',{id: id});
    this.setData({
      musicLink: musicLink.data[0].url
    })
    wx.setStorageSync('musicLink',this.data.musicLink)
    // 开始播放
    this.handlePlay();
  },

  /* 点击播放全部 */
  // 其实就是选第一首进行播放
  playAll() {
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
      // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
      url: '/songPackage/pages/songDetail/songDetail?musicId=' + this.data.recommendList[0].id
    })
  },

  /* 用来处理消息订阅的函数 */
  handlePubSubFun() {
    // 取消订阅
    PubSub.unsubscribe('switchType');
    // 订阅来自songDetail页面发布的消息
    PubSub.subscribe('switchType',(msg,{type,playModel}) => {
      console.log(msg,{type,playModel});
      let likeList = this.data.likeList
      let index = this.data.index;
      if (playModel === 0) {
        if (type === 'pre') {   // 上一首
          (index === 0) && (index = likeList.length)
          index -= 1;
        } else {                // 下一首
          (index === likeList.length - 1) && (index = -1)
          index += 1;
        }
      }
      // playModel=2 -> 随机播放模式
      else if (playModel === 2) {
        // console.log(playModel)
        let randomIndex = Math.floor(Math.random()*likeList.length);
        if (randomIndex === index) {
          randomIndex = Math.floor(Math.random()*likeList.length);
        } else {
          index = randomIndex;
        }
        // console.log(randomIndex)
      }
      // 更新下标
      this.setData({
        index
      })
      // console.log(tracks)
      let musicId = likeList[index][0].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('musicId',musicId)
      // console.log("传入songDetail页面的musicId是：",musicId)
    });
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
        let musicId = this.data.likeList[i][0].id;
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

    console.log("pop()",this.data.multipleMusicIdList.pop())

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
    // 完成渲染就加载其他剩余的音乐
    this.getMusicDetailByForeach(startNum,this.data.mySongListLength)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      isPlay: wx.getStorageSync('isPlay')
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // TODO 在这里写了取消订阅生效了
    // 取消订阅
    // console.log("取消订阅生效了")
    // PubSub.unsubscribe('switchType');
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

    // console.log("上拉触底")
    // 在上拉触底时继续加载我的音乐直至我的音乐全部加载
    count = count + 1;
    if (startNum + loadNum >= this.data.mySongListLength) {
      loadNum = this.data.mySongListLength - startNum
      this.getMusicDetailByForeach(startNum,this.data.mySongListLength)
    } else {
      this.getMusicDetailByForeach(startNum,loadNum*count);
      startNum = startNum + loadNum;
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})