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
var _app = getApp();
var _comment = {};



function getToken(){
  wx.getStorage({
    key: 'token_create_time',
    success: function(res) {
      var currentTime = new Date().getTime();
      if ((currentTime - res.data) > 86400000) {
          init();
          getRoomId();
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
        getRoomId();
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
      if(!res.data.info){
        wx.showToast({
          title: '无此直播间',
          icon: 'loading',
          duration: 2000,
        })
        setTimeout(function () {
          wx.navigateBack({
          });},2000);
        return;
      }
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
      getComment(1, 10);
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
      _player.pause();
      var playUrl = res.data.info.playUrl.play.src.hls;
      // _page.setData({
      //   //src:"http://live.tv189.com/portal_live/wap/test.mp4",
      //   src:playUrl,
      // }); 
      playerController("video",playUrl);
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
    url: 'wss://live.tv189.com/w_sub',
    data: {
      id: _liveId,
    },
    header: {
      'content-type': 'application/json'
    },
    //protocols: ['protocol1'],
    success:function(res){
          console.log(res.data);
          console.log('websocket connect successfully');
    },
  });
  wx.onSocketError(function (res) {
    console.log('WebSocket连接打开失败，请检查！')
  });
  wx.onSocketMessage(function (res) {
    var commend = res.data;
    var commend = JSON.parse(commend);
    // console.log(commend.type);
    // if(commend.type=='ping'){

    // }
    var cmd = commend.cmd;
    console.log(commend);
    var content = commend.content;
    content = JSON.parse(content);
    //console.log(content);
    runSocketCm(cmd,content);
    console.log('收到服务器内容：' + commend);
  });
  wx.onSocketClose(function (res) {
    console.log('WebSocket 已关闭！')
  });
  wx.onSocketOpen(function () {
    var login_data = '{"type":"login","liveId":"' + _liveId + '","admin":"' + _liveId + '"}';
    console.log("websocket握手成功，发送登录数据:" + login_data); 
    wx.sendSocketMessage({
      data: login_data,
    })
  });
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
        console.log('commend:'+commend);
        console.log(commend);
        for(var cmd in commend){ 
          var content = commend[cmd];
          //console.log(commend[cmd]);
          runSocketCm(cmd,content);
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

function runSocketCm(commend,content){
   switch(commend){
     case 'menuChange':
       var item_id = content.id;
       console.log('commend.id+' + item_id);
       //console.log('commend.id+' + item_id);
       _page.setData({
         isOnLoad: item_id,
       });
       break;
     case 'menuFlush': getAgendaList();
       break;
     case 'play': 
       console.log('play!');
       var type = content.type;
       if (type == 'start'){
         getLivePlayUrl(_liveId);
       }else if(type == 'stop'){
         _player.pause();
         var url = content.url;
         var type = content.source;
         console.log('type='+type);
         playerController(type,url);
       }
       break;
     case 'note':
       console.log('note:' + content.note);
      //  _player.sendDanmu({
      //    text: content.note,
      //    color: '#fff',
      //  })
      //  if(content.note){

      //  }else{
      //    _page.setData({
      //      danmuList:'',
      //    }); 
      //  }
     break;
   }
}

function addClass(obj, cls) {
  if (!this.hasClass(obj, cls)) {
    obj.className += " " + cls;
  }
}

function removeClass(obj, cls) {
  if (hasClass(obj, cls)) {
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    obj.className = obj.className.replace(reg, ' ');
  }
}
function playerController(type,url){
  _page.setData({
    playerType:type,
  });
  _page.setData({
    src:url,
  })
}

function getComment(page,size){
  wx.request({
    url: _host + 'index.php?act=Comment&fun=getCommentList',
    data: {
      token: _token,
      liveId:_liveId,
      page:page,
      size:size,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      var comment = res.data.info.data;
      _comment = Object.assign(_comment,comment);
      console.log(_comment);
      console.log("_comment________________");
      _page.setData({
        main_list_detail_comment:_comment,
      });
    }
  }) 
}


Page({
  data:{
    name: 'example',
    isTop:'../../img/icon01.png',
    playerType:'video',
    current_list_btn:'agenda',
  },
  onReady: function (e) {
    _page = this;
    _page.videoContext = wx.createVideoContext('main_video_player');
    _player = _page.videoContext;
    getToken();    
    //console.log('roomId=' +_roomId); 
  },
  bindAddTop: function (e){
    console.log('addTop!');
    addTop();
  },
  main_list_btn_agenda:function(){
    this.setData({
      current_list_btn:'agenda',
    })
  },
  main_list_btn_comment:function(){
    this.setData({
      current_list_btn: 'comment',
    })
  }
})