// pages/search/search.js
import request from "../../utils/request";
let isSend = false;     // 在函数节流使用
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '',      // placeholder的内容
    hotList: [],                 // 热搜榜数据
    searchContent: '',           // 用户输入的表单项数据
    searchList: [],              // 关键字模糊匹配的数据
    historyList: [],             // 搜索历史记录
    isStartSearch: false,        // 是否开始搜索（是否点击了搜索按钮）
    isSoftSearch: true,          // 标识是否是由软键盘（即手机键盘上的确定键），默认为true，为false表示点击“搜索”按钮的
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取初始化数据
    this.getInitData();

    // 获取历史记录
    this.getSearchHistory();
  },

  // 获取初始化的数据
  async getInitData() {
    let placeholderData = await request('/search/default');
    let hotListData = await request('/search/hot/detail');
    this.setData({
      placeholderContent: placeholderData.data.showKeyword,
      hotList: hotListData.data
    })
  },

  // 获取本地历史记录的功能函数
  getSearchHistory() {
    // 从StorageSync中读取出来
    let historyList = wx.getStorageSync('searchHistory');
    if (historyList) {
      this.setData({
        historyList
      })
    }
  },

  // 表单项内容发生改变的回调
  // bindinput可以实时监控表单项内容
  handleInputChange(event) {
    // console.log(event);
    // 更新searchContent的状态数据
    this.setData({
      searchContent: event.detail.value.trim()
    })
    if (isSend) {
      return;
    }
    isSend = true;
    this.getSearchList();
    // 函数节流
    // 每隔1000ms让它发一次请求
    setTimeout( () => {
      isSend = false;
    },300)

  },

  // 获取搜索数据的功能函数
  async getSearchList() {
    if (!this.data.searchContent) {
      this.setData({
        searchList: []
      })
      return;
    }
    let {searchContent,historyList} = this.data;
    // 发请求获取关键字模糊匹配数据
    let searchListData = await request('/search',{keywords: searchContent, limit: 10})
    this.setData({
      searchList: searchListData.result.songs,
    })

  },

  // 清空搜索内容
  clearSearchContent() {
    console.log('clear')
    this.setData({
      searchContent: '',
      searchList: []
    })
  },

  // 清除搜索历史记录
  deleteSearchHistory() {
    wx.showModal({
      content: '确认删除吗？',
      success: (res) => {
        // console.log(res);
        if (res.confirm) {
          // 清空data中的historyList
          this.setData({
            historyList: []
          })
          // 移除本地的历史记录缓存
          wx.removeStorageSync('searchHistory');
        }
      }
    })
  },

  // 软键盘点击搜索
  startSearch(event) {
    // console.log(event)

    /*
    * 在这里设置只有点击了搜索才将数据设置进搜索记录中
    * */
    let {searchContent,historyList} = this.data;
    // 等于-1：说明之前没有，加入历史记录，如果已经存在，就不加进去了
    if (historyList.indexOf(searchContent) !== -1) {
      // 如果历史记录列表中已经存在，
      // 则需要将用户重新搜索后的词更新在历史记录的最前面
      // 先将历史列表中原有的记录删除
      historyList.splice(historyList.indexOf(searchContent),1);
    }
    // 将搜索的关键字添加到搜索历史记录中
    // unshift()：每次搜索后都把最新的放在前面
    historyList.unshift(searchContent);
    this.setData({
      historyList
    })
    // 把搜索后的历史记录存到本地
    wx.setStorageSync('searchHistory',historyList);

    // 如果是软键盘输入则获取关键词则是 event.detail.value
    if (this.data.isSoftSearch) {
      wx.navigateTo({
        url: '/pages/searchList/searchList?keywords=' + event.detail.value
      })

    }
    // 如果是通过界面“搜索”按钮则是 event
    else {
      wx.navigateTo({
        url: '/pages/searchList/searchList?keywords=' + event,
        success: result => {
          // 发送结束后还要将标识重置以便下次继续判断
          this.setData({
            isSoftSearch: true
          })
        }
      })
    }

  },

  // 点击按键“搜索”
  toSearch(event) {
    console.log(event)
    if (event.currentTarget.dataset.name === '取消') {
      wx.navigateBack();
    } else {
      this.setData({
        isSoftSearch: false,
        searchContent: event.currentTarget.id
      })
      this.startSearch(event.currentTarget.id);
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