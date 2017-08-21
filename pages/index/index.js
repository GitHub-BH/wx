var _host = 'http://live.tv189.com/portal_live/';

var _token = '';
var _roomId='';



Page({
  bindButtonTap: function () {
    this.setData({
      focus: true
    })
  },
  roomId:function(e){
    _roomId = e.detail.value;
    wx.setStorage({
      key: 'current_roomId',
      data: _roomId,
    })
  },
  enterRoom: function (e) {
    //console.log(_roomId);
     wx.navigateTo({url:'../live/index?roomId'});
  },
})