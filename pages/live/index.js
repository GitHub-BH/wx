var _host = 'https://live.tv189.com/portal_live/';

var _token = '';
var _roomId = '';
var _roomInfo = '';
var _page = '';
var _liveId = '';
var _merCode = '';
var _isTop = '';
var _userInfo='';
var _player = '';


function getToken(){
  wx.getStorage({
    key: 'token_create_time',
    success: function(res) {
      var currentTime = new Date().getTime();
      if ((currentTime - res.data) > 86400000) {
          init();
      }else{
        wx.getStorage({
          key: 'token',
          success: function (res) {
            if (res.data) {
              _token = res.data;
              getRoomId();
            }
          },
        })
      }
    },
    fail: function () {
      if (_token == '') {
        init();
      }
    },
  })

}
function init(){
  wx.request({
    type: "post",
    dataType: "json",
    url: _host + 'index.php?act=init&fun=init',
    success: function (res) {
      console.log('getToken!');
      _token = res.data.info.token;
      var time = new Date().getTime();
      wx.setStorage({
        key: "token",
        data: _token,
      })
      wx.setStorage({
        key: "token_create_time",
        data: time,
      })
    }
  }) 
}

function getRoomDetail(){
  wx.request({
    url: _host +'index.php?act=live&fun=roomDetail',
    data: {
      token: _token,
      roomId: _roomId,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log(res.data);
      _roomInfo = res;
      _liveId = res.data.info.liveId;
      _merCode = res.data.info.merCode;
      _page.setData({
        title:res.data.info.liveName,
        subtitle: res.data.info.merName,
      });
      checkTop();
      //getLivePlayUrl(_merCode,_liveId);
      getAgendaList(_merCode);
      //queryUserInfo()
      getHistoryCm();
      webSocket('');
    }
  })
}

function getRoomId(){
  wx.getStorage({
    key: 'current_roomId',
    success: function (res) {
      _roomId = res.data;
      getRoomDetail();
    },
  })
}

function getLivePlayUrl(liveId){
  wx.request({
    url: _host + 'index.php?act=live&fun=getLivePlayUrl',
    data: {
      token: _token,
      liveId: liveId,
      merCode:_merCode,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log(res.data);
      var playUrl = res.data.info.playUrl.play.src.hls;
      _page.videoContext = wx.createVideoContext('main_video_player');
      _player = _page.videoContext;
      _page.setData({
        src:"http://live.tv189.com/portal_live/wap/test.mp4",
        //src:playUrl,
      }); 
      _page.videoContext.play();
    }
  })  
}

function checkTop(){
  wx.request({
    url: _host + 'index.php?act=live&fun=isTop',
    data: {
      token: _token,
      liveId: _liveId,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log(res.data);
      var isTop = res.data.info;
      _isTop=isTop;
      if(isTop == 1){
        _page.setData({
          isTop:'../../img/top.png',
        })
      } else if(isTop == 0){
        _page.setData({
          isTop: '../../img/icon01.png',
        }) 
      }
    }
  })  
}

function addTop(){
  if(_isTop==1){
    return;
  }
  wx.request({
    url: _host + 'index.php?act=live&fun=addTop',
    data: {
      token: _token,
      liveId: _liveId,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      checkTop();
    }
  })  
}

function getAgendaList() {
  wx.request({
    url: _host + 'index.php?act=live&fun=agendaList',
    data: {
      token: _token,
      roomId: _roomId,
      merCode: _merCode,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
        var info = res.data.info;
        var main_list_detail_agenda='';
        var isDual = 1;
        _page.setData({
          main_list_detail_agenda: info,
        })
    }
  })
}

function webSocket(uid){
  wx.connectSocket({
    url: 'ws://live.tv189.com/w_sub',
    data: {
      id: _liveId,
      uid: uid,
    },
    header: {
      'content-type': 'application/json'
    },
    //protocols: ['protocol1'],
    method: "GET",
    success:function(){
          console.log('websocket connect successfully');
          wx.onSocketMessage(function (res) {
            var commend = res.data;
            // var content = JSON.stringify(res.data);
             console.log('收到服务器内容：' + commend);
          })
    },
  })
}

function getHistoryCm(){
  wx.request({
    url: _host + 'index.php?act=live&fun=getHistoryCm',
    data: {
      token: _token,
      liveId: _liveId,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
        var commend = res.data.info;
        console.log(commend);
        for(var cmd in commend){
          runSocketCm(cmd);
        }       
    }
  })  
}

function queryUserInfo(){
  wx.request({
    url: _host + 'index.php?act=user&fun=queryUserInfo',
    data: {
      token: _token,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
       _userInfo = res.data.info;
    }
  })
}

function runSocketCm(commend){
   switch(commend){
     case 'menuChange':
       break;
     case 'menuFlush': getAgendaList();
       break;
     case 'play': 
       console.log('play!');
       getLivePlayUrl(_liveId);
       break;
   }
}


Page({
  data:{
    isTop:'../../img/icon01.png',
  },
  onReady: function (e) {
    _page = this;
    getToken();    
    //console.log('roomId=' +_roomId); 
  },
  bindAddTop: function (e){
    console.log('addTop!');
    addTop();
  },
})