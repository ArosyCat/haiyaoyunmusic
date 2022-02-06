// pages/searchList/searchList.js
import request from "../../utils/request";
import PubSub from "pubsub-js";
import moment from "moment";
const appInstance = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        keyword: '',          // 搜索关键字
        searchList: [],       // 搜索结果集合
        currentSong: {},      // 当前正在播放的歌曲信息，用来和song区分开来
        song: {},             // 存放音乐信息
        musicId: '',          // 歌曲ID
        index: 0,             // 音乐下标
        isPlay: false,         // 标识当前播放状态：播放还是停止
        currentTime: '00:00',
        currentWidth: 0,
        playModel: 0,           // 暂时设置默认0
        musicLink: '',           // 音乐链接
        isClose: true,                   // 用来判断当前弹框是否关闭，默认是hidden=true，就是隐藏
        similarSinger: [],              // 相似歌手列表
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

        // 拿到关键词
        this.setData({
            keyword: options.keywords
        })
        // 获取搜索列表
        this.getSearchList(this.data.keyword);

        // 如果Storage有音乐信息则获取
        this.setData({
            currentSong: wx.getStorageSync('song')
        })

        // 用来给播放界面传输上一首或者下一首的音乐id
        // 取消订阅
        PubSub.unsubscribe('switchType');
        // 订阅来自songDetail页面发布的消息
        PubSub.subscribe('switchType',(msg,{type,playModel}) => {
            // console.log(msg,{type,playModel});
            let {searchList,index} = this.data;
            if (playModel === 0) {
                if (type === 'pre') {   // 上一首
                    (index === 0) && (index = searchList.length)
                    index -= 1;
                } else {                // 下一首
                    (index === searchList.length - 1) && (index = -1)
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
            let musicId = searchList[index].id;
            // 将musicId回传给songDetail页面
            PubSub.publish('musicId',musicId)
            // console.log(musicId)
        });

        // 设置界面名称
        wx.setNavigationBarTitle({
            title: '搜索音乐'
        })

        // 创建控制音乐播放的实例对象
        this.backgroundAudioManager = wx.getBackgroundAudioManager();

        // 设置音频监听器的链接
        let musicLink = wx.getStorageSync('musicLink')
        this.setData({
            musicLink,
            musicId: this.data.currentSong.id
        })
        // this.backgroundAudioManager.src = musicLink
    },

    /* 发请求获取搜索歌曲列表 */
    async getSearchList(event) {
        let result = await request("/search", {keywords: event})
        // console.log(result.result)
        this.setData({
            searchList: result.result.songs
        })
    },

    /* 点击播放音乐（跳转到播放音乐界面播放） */
    async toPlayMusic(event) {
        let searchListIndex = parseInt(event.currentTarget.id);
        let musicId = this.data.searchList[searchListIndex].id;

        /* 要获取音乐的封面图 */
        let songData = await request('/song/detail',{ids: musicId});

        /* 将获取到的音乐信息设置给全局 */
        this.setData({
            currentSong: songData.songs[0],
            // 更新下标
            index: searchListIndex,
        })

        // console.log(this.data.song)

        let currentTime = wx.getStorageSync('currentTime');
        let currentWidth = wx.getStorageSync('currentWidth');
        // 路由跳转传参：query参数
        wx.navigateTo({
            // 不能直接将song对象作为参数传递，长度过长会被自动截取掉
            // url: '/pages/songDetail/songDetail?song=' + JSON.stringify(song)
            url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId
                + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
        })
    },

    /* 搜索结果列表头部搜索框 */
    toSearchSongs() {
      wx.navigateBack()
    },

    // 修改播放状态的功能函数
    changePlayState(isPlay) {
        // 修改音乐是否播放的状态
        this.setData({
            isPlay
        })
        wx.setStorageSync('isPlay',isPlay)
        // 修改全局音乐播放的状态
        appInstance.globalData.isMusicPlay = isPlay;
    },

    /* 点击切歌的回调 */
    handleSwitch(event) {

        // 获取切歌的类型
        let type = event.currentTarget.id;
        // 获取搜索的音乐列表
        let searchList = this.data.searchList;
        // 获取当前列表下标指在哪个位置
        let index = this.data.index;
        if (type === 'pre') {               // 上一首
            if (index !== 0) {
                index--;
            } else {
                index = searchList.length - 1;
            }
        } else if (type === 'next') {       // 下一首
            if (index === searchList.length - 1) {
                index = 0;
            } else {
                index++;
            }
        }
        // 更新下标
        this.setData({
            index
        })

        // 关闭当前播放的音乐
        this.backgroundAudioManager.stop();

        let playModel = this.data.playModel;        // 0
        // playModel=0 -> 列表播放 || playModel=2 -> 随机播放
        if (playModel === 0 || playModel === 2) {
            // 清除音乐链接
            this.setData({
                musicLink: ''
            })
            // 获取音乐id
            let musicId = searchList[index].id;

            // 获取音乐详情信息
            this.getMusicInfo(musicId);
            // 切歌后自动播放当前的音乐
            this.setData({
                musicId,
                isPlay: false
            })
            this.handlePlay();
            // this.musicControl(this.data.isPlay,musicId,this.data.musicLink)
        }
        // playModel=1 -> 单曲循环
        else if (playModel === 1) {
            this.setData({
                isPlay: false
            })
            this.handlePlay();
        }
    },

    /* 点击播放 / 暂停音乐（当前搜索页面底部的播放器进行播放） */
    handlePlay() {
        let isPlay = !this.data.isPlay
        this.setData({
            isPlay
        })

        // 获取音乐id
        let musicId = this.data.musicId ? this.data.musicId : this.data.currentSong.id;         // 这里有Id
        // 获取音乐链接
        let musicLink = this.data.musicLink;
        if (isPlay) {
            this.musicControl(musicId,musicLink)
        } else {
            this.backgroundAudioManager.pause();
            appInstance.globalData.isMusicPlay = false;
        }

    },

    /* 获取音乐详情 */
    async getMusicInfo(musicId) {
        // 获取音乐详情的接口
        let songData = await request('/song/detail',{ids: musicId});

        // songData.song[0].dt   单位ms
        // let durationTime = moment(songData.songs[0].dt).format('mm:ss');

        // 更新全局 song 信息
        this.setData({
            currentSong: songData.songs[0],
        })

        // 将歌曲详情存入Storage
        wx.setStorageSync('song',this.data.currentSong);

    },

    // 控制音乐播放 / 暂停的功能函数
    async musicControl(musicId,musicLink) {
        if (!musicLink) {
            // 获取音乐播放链接
            let musicLinkData = await request('/song/url',{id: musicId});
            musicLink = musicLinkData.data[0].url;
            // 更新Storage中的musicLink
            wx.setStorageSync('musicLink',musicLink);
            // 更新全局变量musicLink
            this.setData({
                musicLink
            })
        }
        appInstance.globalData.isMusicPlay = true;

        wx.setStorageSync('musicLink',this.data.musicLink)

        // TODO  musicLink没有设置进去？
        // 当设置了新的 src 时，会自动开始播放
        this.backgroundAudioManager.src = this.data.musicLink;   // 这里放音乐链接
        this.backgroundAudioManager.title = this.data.currentSong.name;

        // this.backgroundAudioManager.title = this.data.song.name;
    },

    /* 跳转至播放歌曲页面 */
    toSongDetail() {
        // 从Storage域中取出歌曲数据
        let currentSong = wx.getStorageSync('song');
        this.setData({
            currentSong
        })
        // 获取音乐Id
        let musicId = this.data.currentSong.id;
        // 取出音乐已经播放的时长
        let currentTime = wx.getStorageSync('currentTime');
        // 取出音乐已经播放过的进度条长度
        let currentWidth = wx.getStorageSync('currentWidth');

        if (musicId) {
            wx.navigateTo({
                url: '/songPackage/pages/songDetail/songDetail?musicId=' + musicId
                    + '&currentTime=' + currentTime + '&currentWidth=' + currentWidth
            })
        } else {
            wx.showToast({
                title: '目前还没有播放任何音乐',
                icon: 'none'
            })
        }
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
        this.setData({
            isPlay: wx.getStorageSync('isPlay'),
            currentSong: wx.getStorageSync('song')
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