var _host = 'http://live.tv189.com/portal_live/';

var _token = '';
var _page = '';


function msgLogin(accountNo, msgCode) {

  wx.request({
    url: _host + 'index.php?act=user&fun=msgLogin',
    data: {
      token: _token,
      accountNo: accountNo,
      msgCode: msgCode,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      
    }
  })
}

function sendMsg(accountNo) {

  wx.request({
    url: _host + 'index.php?act=user&fun=sendMsg',
    data: {
      token: _token,
      accountNo: accountNo,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      var code = res.data.code;
      var msg = res.data.msg;
      if(code=='0'){
         sendMsgInterval(60);
      } else if (code == 999999) {
        sendMsgInterval(msg);
      } else {
        _page.setData({
          btnContent: '获取失败,请重试',
          btnEnable: true,
        });
      }
    }
  })
} 
function sendMsgInterval(interval) {
  interval = parseInt(interval);
  setInterval(function () {
    _page.setData({
      btnContent:interval+'秒后可重试',
      btnEnable:false,
    });
    interval--;
    if (interval==0){
      _page.setData({
        btnContent: '点击获取验证码' ,
        btnEnable: true,
      });
    }
  }, 1000);
}
Page({
  data:{
    btnContent:'点击获取验证码',
    btnEnable :true,
  },
  onReady:function(){
    _page = this;
    wx.getStorage({
      key: 'token',
      success: function (res) {
        if (res.data) {
          _token = res.data;
        }
      },
    })
  },
  submit:function(e){
     accountNo = e.detail.value.accountNo;
     msgCode = e.detail.value.msgCode;
     //msgLogin(accountNo, msgCode);
  },
  accountNo:function(e){
    console.log(e.detail.value);
    this.setData({
      accountNo:e.detail.value,
    });
  },
  msgCode:function(e){
    this.setData({
      msgCode: e.detail.value,
    });
  },
  sendMsg:function(){
     var accountNo = this.data.accountNo;
     console.log(accountNo);
     sendMsg(accountNo);
  }
})