// pages/personalFM/personalFM.js
import request from "../../../utils/request";
import moment from "moment";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    personalFM: [],             // 获取到私人fm的信息
    index: 0,                   // 标识音乐的下标
    currentSong: {},            // 当前播放的歌曲信息
    musicId: '',                // 当前播放的歌曲id
    musicUrl: '',               // 当前播放的歌曲url
    lyric: [],                  // 歌词
    lyricTime: 0,               // 歌词对应的时间
    currentLyric: '',           // 当前歌词对象
    isPlay: false,              // 当前是否正在播放
    currentTime: '00:00',       // 进度条实时时间记录
    durationTime: '00:00',      // 总时长
    currentWidth: 0,            // 实时进度条长度
    isLike: false,              // 对该音乐的喜欢状态：false -> 不喜欢  true -> 喜欢
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getPersonalFMInfo(this.data.index)

    // 设置标题
    wx.setNavigationBarTitle({
      title: '私人FM'
    })

    // 获取全局音频管理器
    this.backgroundAudioManager = wx.getBackgroundAudioManager();

  },

  // 获取私人fm音乐列表
  async getPersonalFMInfo(index) {
    let personalFM = await request('/personal_fm')
    this.setData({
      personalFM: personalFM.data,
      currentSong: personalFM.data[index],
      musicId: personalFM.data[index].id,             // 用id获取歌曲url
    })

    let musicId = this.data.musicId;

    let durationTime = moment(this.data.currentSong.duration).format('mm:ss');
    // 将当前私人FM播放的歌曲信息存入本地
    wx.setStorageSync('FMSong',this.data.currentSong);

    // 传入musicId获取歌曲歌词
    this.getLyric(musicId);

    this.setData({
      currentLyric: wx.getStorageSync('song').id.toString() && musicId === wx.getStorageSync('FMSong').id.toString() ? wx.getStorageSync('currentLyric') : '',
      durationTime
    })

    // 传入musicId获取歌曲url
    this.getSongDetail(musicId,index)

  },

  // 通过musicId获取歌曲url
  async getSongDetail(musicId) {
    let musicUrl = await request('/song/url',{id: musicId})
    // console.log(musicUrl)
    this.setData({
      musicUrl: musicUrl.data[0].url
    })

    this.handleMusicPlay()

  },

  // 处理播放 / 暂停的函数
  handleMusicPlay() {
    this.setData({
      isPlay: !this.data.isPlay
    })
    // 判断当前是否正在播放
    if (this.data.isPlay) {
      // 调用该方法获得personalFM以及musicUrl
      // this.getPersonalFMInfo();

      // 获取musicUrl
      let musicUrl = this.data.musicUrl;
      let musicName = this.data.currentSong.name;

      this.backgroundAudioManager.src = musicUrl;
      this.backgroundAudioManager.title = musicName;

    } else {
      // 音乐暂停
      this.backgroundAudioManager.pause();
    }
  },

  // 获取歌词
  async getLyric(musicId) {
    let lyricData = await request("/lyric",{id: this.data.currentSong.id});
    // console.log(lyricData)
    let lyric = this.formatLyric(lyricData.lrc.lyric);
  },
  //传入初始歌词文本text
  formatLyric(text) {
    let result = [];
    let arr = text.split("\n"); //原歌词文本已经换好行了方便很多，我们直接通过换行符“\n”进行切割
    let row = arr.length; //获取歌词行数
    for (let i = 0; i < row; i++) {
      let temp_row = arr[i]; //现在每一行格式大概就是这样"[00:04.302][02:10.00]hello world";
      let temp_arr = temp_row.split("]");//我们可以通过“]”对时间和文本进行分离
      let text = temp_arr.pop(); //把歌词文本从数组中剔除出来，获取到歌词文本了！
      //再对剩下的歌词时间进行处理
      temp_arr.forEach(element => {
        let obj = {};
        let time_arr = element.substr(1, element.length - 1).split(":");//先把多余的“[”去掉，再分离出分、秒
        let s = parseInt(time_arr[0]) * 60 + Math.ceil(time_arr[1]); //把时间转换成与currentTime相同的类型，方便待会实现滚动效果
        obj.time = s;
        obj.text = text;
        result.push(obj); //每一行歌词对象存到组件的lyric歌词属性里
      });
    }
    result.sort(this.sortRule) //由于不同时间的相同歌词我们给排到一起了，所以这里要以时间顺序重新排列一下
    this.setData({
      lyric: result
    })
  },
  sortRule(a, b) { //设置一下排序规则
    return a.time - b.time;
  },
  //控制歌词播放
  getCurrentLyric(){
    let j;
    for(j=0; j<this.data.lyric.length-1; j++){
      if(this.data.lyricTime == this.data.lyric[j].time){
        this.setData({
          currentLyric : this.data.lyric[j].text
        })
        wx.setStorageSync('currentLyric',this.data.currentLyric);
      }
    }
  },

  // 处理喜欢某音乐的回调
  handleLikeMusic() {
    let musicId = this.data.musicId;

    // 真实情况是私人FM有可能随机到自己已经喜欢的歌曲，
    // 需要获取自己已经喜欢的歌曲列表，再将歌曲id判断是否在其中，
    // 在其中就将状态改为true，但是不发请求去喜欢该音乐，不再其中就正常执行，
    // 这里暂时就不考虑这个情况了
    // 只考虑点击爱心只有喜欢和不喜欢两个结果，所有直接取反。
    let isLike = !this.data.isLike;
    this.setData({
      isLike
    })
    this.likeMusic(musicId,isLike)
  },
  // 请求喜欢该音乐
  async likeMusic(musicId,isLike) {
    await request('/like',{id: musicId,like: isLike})
  },

  // 将音乐移除
  async handleRemove(preMusicId) {
      await request('/fm_trash',{id: preMusicId})
  },

  // 播放下一首
  handleSwitch() {
    // 得到原来的index
    let index = this.data.index;

    // 利用index得到原来的musicId
    let preMusicId = this.data.personalFM[index].id;        // 上一个musicId
    console.log(preMusicId)
    // 私人FM列表中每次只刷新三首音乐，所有只有0，1，超过1重置一下
    if (index === this.data.personalFM.length - 1) {
      this.setData({
        index: 0,
        isPlay: false
      })
    } else {
      index = index + 1;
      this.setData({
        index,
        isPlay: false
      })
    }
    // 获取音乐id，开始播放下一首
    this.getPersonalFMInfo(this.data.index)

    // 传入上一个musicId从私人FM中移除该音乐
    this.handleRemove(preMusicId)

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
    // 监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(() => {
      // console.log('总时长：',this.backgroundAudioManager.duration);
      // console.log('实时的时长：',this.backgroundAudioManager.currentTime);

      // 获取歌词对应时间
      let lyricTime = Math.ceil(this.backgroundAudioManager.currentTime);
      // 格式化实时的播放时间
      let currentTime = moment(this.backgroundAudioManager.currentTime*1000).format('mm:ss');
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration*550;
      this.setData({
        lyricTime,
        currentTime,
        currentWidth
      })

      this.getCurrentLyric();

      // 暂停时存储一下播放时间和进度条长度(播放就没必要存数据)
      wx.setStorageSync('currentTime',currentTime);
      wx.setStorageSync('currentWidth',currentWidth);

    })
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