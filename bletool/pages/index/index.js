//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    available: false,
    discovering: false, 
    msg: "",
    devices: "",
    deviceId: "", 
    connectedName: "",
    connected: false,
    services: "",
    characteristics: "",
    serviceId: "",
    characteristicId: "",
    inputValue: "",
    items: [
      { value: 'HEX', display: "十六进制", checked: false },
      { value: 'RN',  display: "\\r\\n",  checked: true  },
    ]
  },

  onLoad: function () {
    console.log("index on load!")
    if (wx.openBluetoothAdapter) {
      this.openBluetooth()
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请升级到最新版本后重试。',
      })
    }
  },

  onPullDownRefresh: function () {
    var that = this
    console.log("index on pull down refresh!")
    if (that.data.connected) {
      that.clearMsg()
    }
    else if (that.data.available) {
      that.discoveryChange()
    }
    else {
      that.openBluetooth()
    }
  },

  //初始化小程序蓝牙模块
  openBluetooth: function () {
    var that = this;
    wx.openBluetoothAdapter({
      success: function(res) {
        that.setData({
          msg:"初始化蓝牙成功：" + JSON.stringify(res),
          available:true,
        })
        //监听蓝牙适配器状态变化事件
        wx.onBluetoothAdapterStateChange(function(res){
          that.setData({
            available: res.available,
            discovering: res.discovering,
          })
        })
      },
      fail: function(res) {
        console.log("openBluetooth", res)
        that.setData({
          msg: "初始化蓝牙失败：\r\n" + JSON.stringify(res.errMsg),
        })
        wx.showModal({
          title: '初始化蓝牙失败',
          content: '请打开系统蓝牙',
          success: function(res) {
            if(res.confirm) {
              console.log(wx.canIUse('openBluetoothAdapter'))
            }
          }
        })
      },
    })
  },

  //关闭蓝牙模块，使其进入未初始化状态
  closeBluetooth: function () {
    var that = this;
    wx.closeBluetoothAdapter({
      success: function (res) {
        that.setData({
          msg: "关闭蓝牙成功：" + JSON.stringify(res),
          available: false,
        })
      },
      fail: function (res) {
        that.setData({
          msg: "关闭蓝牙失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },

  //打开或关闭蓝牙模块
  bluetoothChange: function () {
    var that = this;
    if (that.data.available) {
      that.closeBluetooth()
    }
    else  {
      that.openBluetooth()
    }
  },

  //获取本机蓝牙适配器状态
  getBluetoothState: function () {
    var that = this;
    wx.getBluetoothAdapterState({
      success: function (res) {
        that.setData({
          msg: "蓝牙状态: \r\n" + JSON.stringify(res.errMsg),
          available: res.available,
          discovering: res.discovering,
        })
      },
      fail: function (res) {
        that.setData({
          msg: "获取蓝牙状态失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },

  //开始搜寻附近的蓝牙外围设备
  startDiscovery: function () {
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      interval: 1000,
      success: function (res) {
        that.setData({
          msg: "搜索设备：\r\n" + JSON.stringify(res),
          devices:"",
        })
        //监听寻找到新设备的事件
        wx.onBluetoothDeviceFound(function (res) {
          console.log('new device list has founded')
          var d = [];
          if (that.data.devices.length > 0) {
            d = d.concat(that.data.devices);
          }
          d = d.concat(res.devices);
          that.setData({
            devices: d,
          })
        })
        //20秒后停止搜寻附近的蓝牙外围设备
        setTimeout(function () {
          console.log("setTimeout: 20000 stopDiscovery");
          that.stopDiscovery()
        }, 20000);
      },
      fail: function (res) {
        that.setData({
          msg: "搜索设备失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },  

  //停止搜寻附近的蓝牙外围设备
  stopDiscovery: function () {
    var that = this;
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        that.setData({
          msg: "停止搜索:\r\n" + JSON.stringify(res.errMsg),
        })
      },
      fail: function (res) {
        that.setData({
          msg: "停止搜索失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },  

  //开始或停止搜寻附近的蓝牙外围设备
  discoveryChange: function () {
    var that = this;
    if (that.data.discovering) {
      that.stopDiscovery();
    }
    else {
      that.startDiscovery();
    }
  },

  //获取在小程序蓝牙模块生效期间所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备
  getDevices: function () {
    var that = this;
    wx.getBluetoothDevices({
      success: function (res) {
        //获取处于已连接状态的设备
        wx.getConnectedBluetoothDevices({
          success: function (res) {
            if (res.devices != null ) {
              console.log("getConnectedBluetoothDevices",JSON.stringify(res.devices));
            }
          }
        })
        that.setData({
          msg: "获取设备成功",
          devices: res.devices,
        })
      },
      fail: function (res) {
        that.setData({
          msg: "获取设备失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  }, 

  //连接低功耗蓝牙设备
  createConnection: function (deviceId) {
    var that = this;
    console.log("createConnection:", deviceId)
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        that.setData({
          deviceId: deviceId,
          connected: true,
          msg: "已连接设备：" + deviceId,
          devices: "",
        })
        //监听低功耗蓝牙连接状态的改变事件，包括开发者主动连接或断开连接，设备丢失，连接异常断开等等
        wx.onBLEConnectionStateChange(function (res) {
          // 该方法回调中可以用于处理连接意外断开等异常情况
          console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
          that.setData({
            connected: res.connected,
          })
        })
        //延时查找所有 service（服务）和 所有 characteristic（特征值） 启用 notify 功能
        setTimeout(function () {
          console.log("setTimeout: 3000 getServicesAndCharacteristics");
          that.getServicesAndCharacteristics(deviceId)
        }, 3000);
      },
      fail: function (res) {
        that.setData({
          msg: "连接失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },

  //连接所选择的低功耗蓝牙设备
  connectTo: function (e) {
    var that = this;
    for (var i = 0; i < that.data.devices.length; i++) {
      if (that.data.devices[i].deviceId == e.currentTarget.id){
        that.setData({
          connectedName: that.data.devices[i].name.length > 0 ? that.data.devices[i].name : that.data.devices[i].localName.length > 0 ? "N/A " + that.data.devices[i].localName : "N/A"
        })
      }
    }
    that.createConnection(e.currentTarget.id);
  },  

  //断开与低功耗蓝牙设备的连接
  closeConnection: function () {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        that.setData({
          msg: "已断开连接：" + that.data.deviceId,
          devices: "",
          services: "",
          characteristics: "",
        })
      },
      fail: function (res) {
        console.log("断开连接失败：", res.errMsg);
        that.setData({
          msg: "断开连接失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },

  //连接或断开所选择的低功耗蓝牙设备
  connectionChange: function () {
    var that = this;
    if (that.data.connected) {
      that.closeConnection();
    }
    else {
      that.createConnection(that.data.deviceId);
    }
  },

  //获取蓝牙设备所有 service（服务）
  getServices: function () {
    var that = this;
    wx.getBLEDeviceServices({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log('device services:', JSON.stringify(res.services));
        that.setData({
          services: res.services,
          msg: "获取服务成功",
          devices: "",
        })
      },
      fail: function (res) {
        that.setData({
          msg: "获取服务失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },  

  //获取蓝牙设备某个服务中的所有 characteristic（特征值）
  getCharacteristics: function () {
    var that = this;
    var msgstr = "获取特征值成功";
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.serviceId,
      success: function (res) {
        console.log("getCharacteristics ： 获取特征值：")
        for (var j = 0; j < res.characteristics.length; j++) {
          console.log("uuid", res.characteristics[j].uuid);
          console.log("characteristics", res.characteristics[j].properties);
        }
        that.setData({
          characteristics: res.characteristics,
        })
      },
      fail: function (res) {
        msgstr = "获取特征值失败:\r\n" + JSON.stringify(res.errMsg)
      },
      complete: function () {
        that.setData({
          msg: msgstr,
        })
      },
    })
  },  

  //获取蓝牙设备所有 service（服务）和 所有 characteristic（特征值） 启用 notify 功能
  getServicesAndCharacteristics: function (deviceId) {
    var that = this;
    console.log('getServicesAndCharacteristics: deviceId: ', deviceId);
    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: function (res0) {

        console.log('getServicesAndCharacteristics:', JSON.stringify(res0.services));
        for (var i = 0; i < res0.services.length; i++) {
          var serviceIndex = 0;
          wx.getBLEDeviceCharacteristics({
            deviceId: deviceId,
            serviceId: res0.services[i].uuid,
            success: function (res1) {
              var characteristicIndex = 0;
              console.log("getServicesAndCharacteristics", JSON.stringify(res1.characteristics))
              for (var j = 0; j < res1.characteristics.length; j++) {
                if (res1.characteristics[j].properties.notify) {
                  wx.notifyBLECharacteristicValueChange({
                    state: true,
                    deviceId: deviceId, 
                    serviceId: res0.services[serviceIndex].uuid,
                    characteristicId: res1.characteristics[j].uuid,
                    success: function (res2) {
                      console.log("getServicesAndCharacteristics", JSON.stringify(res2.errMsg))
                      that.setData({
                        msg: that.data.msg + "\r\n 启用notify成功:" + res1.characteristics[characteristicIndex].uuid,
                      })
                      wx.onBLECharacteristicValueChange(function (characteristic) {
                        var hexstr = that.abc2hex(characteristic.value)
                        //let hex = Array.prototype.map.call(new Uint8Array(characteristic.value),
                        // x => ('00' + x.toString(16)).slice(-2)).join('');
                        console.log("收到数据：", hexstr)
                        var valueUint8Array = new Uint8Array(characteristic.value);
                        var valueString = String.fromCharCode.apply(null, valueUint8Array);
                        console.log('valueUint8Array', valueUint8Array);
                        console.log('valueString', valueString);
                        if (valueString[valueString.length - 1] == '\r' || valueString[valueString.length - 2] == '\r') {
                          valueString = valueString.substring(0, valueString.length - 2) + '\\r\\n';
                        }
                        if (that.data.items[0].checked) {
                          valueString = hexstr
                        }
                        that.setData({
                          msg: that.data.msg + "\r\n 收到数据：" + valueString,
                        })
                      })
                    },
                    fail: function (res) {
                      console.log("getServicesAndCharacteristics ： 启用notify失败", JSON.stringify(res.errMsg))
                    },
                    complete: function (res) {
                      console.log("getServicesAndCharacteristics ： 启用notify complete", )
                      characteristicIndex++;
                    },
                  })
                }
                if (res1.characteristics[j].properties.write) {
                  console.log(res0.services[serviceIndex].uuid.substring(4, 8) )
                  if (res0.services[serviceIndex].uuid.substring(4,8) == "190A") {
                    that.setData({
                      serviceId: res0.services[serviceIndex].uuid,
                      characteristicId: res1.characteristics[j].uuid,
                    })
                  }
                }
              }
            },
            fail: function (res) {
              console.log("getServicesAndCharacteristics ： 获取特征值失败", JSON.stringify(res.errMsg))
            },
            complete: function (res) {
              console.log("getServicesAndCharacteristics ： 获取特征值 complete", )
              serviceIndex++;
            },
          })
        }
      },
      fail: function (res) {
        console.log("getServicesAndCharacteristics ： 获取服务失败", JSON.stringify(res.errMsg))
      },
      complete: function (res) {
        console.log("getServicesAndCharacteristics ： 获取服务 complete",)
      },
    })
  },

  //读取低功耗蓝牙设备的特征值的二进制数据值
  readValue: function () {
    var that = this;
    //读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持read才可以成功调用，具体参照 characteristic 的 properties 属性
    wx.readBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取  
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取  
      serviceId: that.data.serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取  
      characteristicId: that.data.characteristicId,
      success: function (res) {
        //read接口读取到的信息需要在onBLECharacteristicValueChange方法注册的回调中获取。
        console.log('读取数据成功：', res.errMsg);
      },
      fail: function (res) {
        console.log("读取数据失败：", res.errMsg);
        that.setData({
          msg: "读取数据失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },  

  //向低功耗蓝牙设备特征值中写入二进制数据
  writeValue: function () {
    var that = this
    var HEX = that.data.items[0].checked
    var NR = that.data.items[1].checked
    console.log('inputValue:' , that.data.inputValue)
    var bufferSize = HEX ? that.data.inputValue.length / 2 : that.data.inputValue.length
    var buffer = new ArrayBuffer(NR ? bufferSize + 2 : bufferSize)
    var dataView = new DataView(buffer) 

    for (var i = 0; i < bufferSize; i++) {
      if (HEX) {
        var hex = that.data.inputValue.substring(i*2,i*2+2)
        console.log('hex:', hex)
        dataView.setUint8(i, parseInt(hex, 16))
      }
      else {
        dataView.setUint8(i, that.data.inputValue.charCodeAt(i));
      }
    }
    if (NR) {
      dataView.setUint8(bufferSize, 0x0d);//CR (carriage return)回车键 \r
      dataView.setUint8(bufferSize + 1, 0x0a);//LF (NL line feed, new line)换行键 \n
    }
    console.log('buffer', that.abc2hex(buffer))

    var bufferUint8Array = new Uint8Array(buffer)
    var bufferString = String.fromCharCode.apply(null, bufferUint8Array)
    if (NR) {
      bufferString = bufferString.substring(0, bufferString.length - 2) + '\\r\\n'
    }
    console.log('bufferUint8Array', bufferUint8Array);
    console.log('bufferString', bufferString);

    if (HEX) {
      bufferString = that.abc2hex(buffer)
    }
    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: that.data.characteristicId,
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success: function (res) {
        console.log("writeValue ： 发送成功", res.errMsg)
        that.setData({
          msg: that.data.msg + "\r\n 发送成功：" + bufferString,
        })
      },
      fail: function (res) {
        console.log("writeValue ： 发送失败", res.errMsg)
        that.setData({
          msg: that.data.msg + "\r\n 发送失败：" + bufferString,
        })
      },
    })
  },  

  //启用低功耗蓝牙设备特征值变化时的 notify 功能  
  notifyEnable: function () {
    var that = this; 
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能  
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接 
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取  
      serviceId: that.data.serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取  
      characteristicId: that.data.characteristicId,
      success: function (res) {
        that.setData({
          msg: "启用notify成功",
        })
        //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
        wx.onBLECharacteristicValueChange(function (characteristic) {
          var hexstr = that.abc2hex(characteristic.value)
          //let hex = Array.prototype.map.call(new Uint8Array(characteristic.value),
          // x => ('00' + x.toString(16)).slice(-2)).join('');
          console.log("收到数据：",hexstr)
          var valueUint8Array = new Uint8Array(characteristic.value);
          var valueString = String.fromCharCode.apply(null, valueUint8Array);
          console.log('valueUint8Array', valueUint8Array);
          console.log('valueString', valueString);
          if (valueString[valueString.length - 1] == '\r' || valueString[valueString.length - 2] == '\r') {
            valueString = valueString.substring(0, valueString.length - 2) + '\\r\\n';
          }
          if (that.data.items[0].checked) {
            valueString = hexstr
          }
          that.setData({
            msg: that.data.msg + "\r\n 收到数据：" + valueString,
          })
        })
      },
      fail: function (res) {
        that.setData({
          msg: "启用notify失败：\r\n" + JSON.stringify(res.errMsg),
        })
      },
    })
  },  


  //选择服务  
  selectService: function (e) {
    var that = this;
    that.setData({
      msg: "已选择服务：\r\n" + e.currentTarget.id,
      serviceId: e.currentTarget.id,
      services: "",
      characteristics: "",
    })
  },

  //选择服务特征值  
  selectCharacteristic: function (e) {
    var that = this;
    that.setData({
      msg: "已选择服务特征值：\r\n" + e.currentTarget.id,
      characteristicId: e.currentTarget.id,
      services: "",
      characteristics: "",
    })
  },  

  //监听input表单  
  inputTextchange: function (e) {
    var that = this
    var HEX = that.data.items[0].checked
    if(HEX) {
      if (e.detail.value.length > 0) {
        var reg = /^[0-9a-fA-F]+$/;   
        if (e.detail.value.match(reg)) {
          that.setData({
            inputValue: e.detail.value
          })
        }
        else {
          that.setData({
            inputValue: e.detail.value.substring(0, e.detail.value.length -1)
          })
        }
      }
    }
    else {
      that.setData({
        inputValue: e.detail.value
      })
    }
  },  

 //监听checkbox表单
  checkboxChange: function (e) {
    var that = this
    var HEX_old = that.data.items[0].checked
    var checkbox = that.data.items
    for (let i = 0; i < checkbox.length; i++) {
      checkbox[i].checked = false
      for (let j = 0; j < e.detail.value.length; j++) {
        if (checkbox[i].value == e.detail.value[j]) {
          checkbox[i].checked = true
        }
      }
    }
    console.log("checkboxChange: ", checkbox)
    that.setData({
      items: checkbox
    })

    var HEX = that.data.items[0].checked
    if (HEX != HEX_old && that.data.inputValue.length > 0) {
      var inputValue = that.data.inputValue
      if (HEX_old) {
        console.log('inputValue:0x', inputValue)
      }
      else {
        console.log('inputValue:', inputValue)
      }

      if (HEX_old) {
        if (inputValue.length%2 == 1) {
          inputValue = inputValue + "0"
        }
      }

      var bufferSize = HEX_old ? inputValue.length / 2 : inputValue.length
      var buffer = new ArrayBuffer(bufferSize)
      var dataView = new DataView(buffer)

      for (var i = 0; i < bufferSize; i++) {
        if (HEX_old) {
          var hex = inputValue.substring(i * 2, i * 2 + 2)
          dataView.setUint8(i, parseInt(hex, 16))
        }
        else {
          dataView.setUint8(i, inputValue.charCodeAt(i));
        }
      }
      var buffer2Hex = that.abc2hex(buffer)
      console.log('buffer2Hex', buffer2Hex)

      var bufferUint8Array = new Uint8Array(buffer)
      var bufferString = String.fromCharCode.apply(null, bufferUint8Array)

      console.log('bufferUint8Array', bufferUint8Array);
      console.log('bufferString', bufferString);

      if (HEX) {
        bufferString = buffer2Hex
      }
      that.setData({
        inputValue: bufferString
      })

    }
  },

  //清除屏幕
  clearMsg: function() {
    var that = this;
    that.setData({
      msg: "",
      devices: "",
      services: "",
      characteristics: "",
    })
  },  

  //ArrayBuffer转16进度字符串示例
  abc2hex: function (buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },

})
