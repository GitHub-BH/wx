var _host = 'https://live.tv189.com/portal_live/';

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
      wx.navigateTo({ url: '../live/index?roomId' });
    }
  })
}

function checkMsgCode(account, msgCode) {

  wx.request({
    url: _host + 'index.php?act=user&fun=checkMsgCode',
    data: {
      token: _token,
      account: account,
      msgCode: msgCode,
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.data.code == 0) {
        _page.setData({
          formVerify: '',
          submitEnable: true,
        });   
      } else {
        _page.setData({
          submitEnable: false,
        });  
        _page.setData({
          formVerify: '验证码错误',
        });
      }
    }
  })
}

function sendMsg(accountNo) {

  wx.request({
    url: _host + 'index.php?act=user&fun=sendMsg',
    data: {
      token: _token,
      account: accountNo,
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
      } else{
        _page.setData({
          formVerify:msg,
          btnContent: '获取失败,请重试',
          btnEnable: true,
        });
      }
    }
  })
} 
function sendMsgInterval(interval) {
  interval = parseInt(interval);
  var msgInterval = setInterval(function () {
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
      clearInterval(msgInterval);
    }
  }, 1000);
}
function getUserInfo(){
  var AppId = 'wx7be4a20c63f3d3d0';
  var AppSecret = '44863f6221caca16a37c5da887ccae6c';
  wx.getUserInfo({
    success: function (res) {
      console.log(res);
      var encryptedData = res.data.encryptedData;
    }
  })
}
Page({
  data:{
    btnContent:'点击获取验证码',
    btnEnable :true,
    formVerify: '',
    submitEnable : false,
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
    });
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success() {
              getUserInfo();
            }
          })
        } else if (res.authSetting['scope.userInfo']){
          getUserInfo();
        }
      }
    })
  },
  submit:function(e){
     var accountNo = e.detail.value.accountNo;
     var msgCode = e.detail.value.msgCode;
     msgLogin(accountNo, msgCode);
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
    var msgCode = e.detail.value;
    var accountNo = this.data.accountNo;
    checkMsgCode(accountNo,msgCode);
  },
  sendMsg:function(){
    _page.setData({
      formVerify:'',
    });
     var accountNo = this.data.accountNo;
     console.log(accountNo);
     sendMsg(accountNo);
  }
})