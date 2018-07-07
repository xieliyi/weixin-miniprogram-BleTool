//app.js
App({
  onLaunch: function () {
    // Do something when launch.
    console.log("app on launch")
  },

  onShow: function () {
    // Do something when show.
    console.log("app on show!")
  },

  onHide: function () {
    // Do something when hide.
    console.log("app on hide!")
  },

  onError: function (msg) {
    // Do something when error.
    console.log("app on error!")
    console.log(msg)
  },

  onPageNotFound: function () {
    // Do something when page not found.
    console.log("app on page not found!")
  },

})