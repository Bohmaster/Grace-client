var app = angular.module('real-time', ['lbServices', 'ui.router', 'ngToast']);

var API_URL = 'https://connections-si.com:3003/api/';

app.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state({
      name: 'app',
      url: '/app',
      abstract: true,
      templateUrl: 'views/base.html',
      controller: 'MainController'
    })
    .state({
      name: 'app.home',
      url: '/home',
      templateUrl: 'views/home.html',
      controller: 'HomeController'
    })
    .state({
      name: 'app.courses',
      url: '/courses',
      templateUrl: 'views/courses.html',
      controller: 'CoursesController'
    })
    .state({
      name: 'app.rooms',
      url: '/:courseName',
      templateUrl: 'views/room.html',
      controller: 'RoomController',
      params: {
        courseName: null
      }
    });

  $urlRouterProvider.otherwise('/app/home');
});

app.run(function ($rootScope) {
  console.log('App running');

  $rootScope.socket = socket = io.connect('https://connections-si.com:3003');

  socket.on('connect', function () {
    console.log('Socket connected to server');
  })

})

app.controller('MainController', function ($rootScope, $scope, $http, Course) {
  $scope.courses = [];
  $scope.message = '';
  $scope.messages = [];

  $scope.enterRoom = function (course) {
    // $http.post(API_URL + 'Courses/handleRoom', {
    //     courseId: courseId
    // }).
    // success(function(response) {
    //     console.log(response);
    // })

    console.log('Executing');

    $rootScope.socket.emit('join:room', {
      room: course.name,
      username: 'John Doe'
    });

  }

  $scope.sendMessage = function () {
    $rootScope.socket.emit('message', $scope.message);

  }

  $rootScope.socket.on('room:message', function (data, room) {
    console.log('Message received', data, room);
    $scope.$apply(function () {
      $scope.messages.push(data);
    })
  })

  getCourses();

  function getCourses() {
    Course.find(function (courses) {
      console.log(courses);
      $scope.courses = courses;
    });
  }


})

app.controller('HomeController', function ($rootScope, $scope) {

});

app.controller('CoursesController', function ($rootScope, $scope, $state, Course) {
  $scope.courses = [];

  $scope.goToRoom = function (course) {

    $state.go('app.rooms', {
      courseId: course.id,
      courseName: course.name
    })
  }

  getCourses();

  function getCourses() {
    Course.find(function (courses) {
      console.log(courses);

      $scope.courses = courses;
    });
  }
});

app.controller('RoomController', function ($rootScope, $http, $scope, $stateParams, ngToast, Course) {
  console.log($stateParams);

  var room = null;

  $scope.course = {};
  $scope.users = [];
  $scope.messages = [];
  $scope.teacher = [];

  Course.find({
    fiter: {
      where: {
        id: $stateParams.courseId
      }
    }
  }, function (courses) {
    $scope.course = courses[0];
    room = $scope.course;

    webrtc.on('readyToCall', function () {
      console.log('readyToCall', room) // you can name it anything
      if (room && room.active) {
        console.log('active!!!');
        webrtc.joinRoom(room.name);
      } else {
        console.log('not active')
      }
    });

    $rootScope.socket.emit('join:room', {
      room: $scope.course.name,
      username: prompt('What is your name?')
    });
  });

  $scope.voicePlease = function (url) {
    window.open(url, 'Voice', 'height=400,width=700"');
  };

  // SOCKET

  var messageSound = new Audio('message.mp3');

  $scope.sendMessage = function () {
    $rootScope.socket.emit('message', $scope.message);
  }

  $scope.teacherTalks = function () {
    $scope.teacher.push($scope.teacherField)
  }

  $rootScope.socket.on('room:message', function (data, room, user) {
    console.log('Message received', data, room, user);

    messageSound.play();

    $scope.$apply(function () {
      $scope.messages.push(user + ': ' + data);
    });
  })

  $rootScope.socket.on('user:joined', function (room, user, clients) {
    console.log('User has joined', room, user, clients);

    $scope.$apply(function () {
      $scope.users = clients;
      ngToast.create('Ha ingresado un usuario!');
    });

  })

  $scope.activateCourse = function() {
    $http.put(
      'https://connections-si.com:3003/api/Courses/' + $scope.course.id, {
        active: true
      }
    ).then(function(data) {
      console.log(data);
      $scope.course.active = true;
    })
  }


  ///

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
 } 

  // create our webrtc connection
  var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'localVideo',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: '',
    // immediately ask for camera access
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,
    url: 'https://connections-si.com:8888/',
    media: {
      audio: true,
      video: false
    },
    receiveMedia: {
      offerToReceiveVideo: 0,
      offerToReceiveAudio: 1
    }
  });
  setTimeout(function () {
    console.log(webrtc, $scope.course);
  }, 5000);
  // when it's ready, join if we got a room from the URL

  function showVolume(el, volume) {
    if (!el) return;
    if (volume < -45) { // vary between -45 and -20
      el.style.height = '0px';
    } else if (volume > -20) {
      el.style.height = '100%';
    } else {
      el.style.height = '' + Math.floor((volume + 100) * 100 / 25 - 220) + '%';
    }
  }
  webrtc.on('channelMessage', function (peer, label, data) {
    if (data.type == 'volume') {
      showVolume(document.getElementById('volume_' + peer.id), data.volume);
    }
  });
  // webrtc.on('videoAdded', function (video, peer) {
  //   console.log('video added', peer);
  //   var remotes = document.getElementById('remotes');
  //   if (remotes) {
  //     var d = document.createElement('div');
  //     d.className = 'videoContainer';
  //     d.id = 'container_' + webrtc.getDomId(peer);
  //     d.appendChild(video);
  //     var vol = document.createElement('div');
  //     vol.id = 'volume_' + peer.id;
  //     vol.className = 'volume_bar';
  //     video.onclick = function () {
  //       video.style.width = video.videoWidth + 'px';
  //       video.style.height = video.videoHeight + 'px';
  //     };
  //     d.appendChild(vol);
  //     remotes.appendChild(d);
  //   }
  // });
  webrtc.on('videoRemoved', function (video, peer) {
    var remotes = document.getElementById('remotes');
    var el = document.getElementById('container_' + webrtc.getDomId(peer));
    if (remotes && el) {
      remotes.removeChild(el);
    }
  });
  webrtc.on('volumeChange', function (volume, treshold) {
    //console.log('own volume', volume);
    showVolume(document.getElementById('localVolume'), volume);
  });

  // Since we use this twice we put it here
  function setRoom(name) {
      console.log(location)
      console.log('readyToCall')
      $('form').remove();
      $('h1').text(name);
      $('#subTitle').text('Link to join: ' + location.href);
      $('body').addClass('active');
  }

  if (room) {
    setRoom(room);
  } else {
    $('#activar').click(function () {
      var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
      webrtc.createRoom(val, function (err, name) {
        console.log(' create room cb', arguments);
        if (!err) {
          setRoom(name);
        } else {
          console.log(err);
        }
      });
      return false;
    });
  }

  var button = $('#screenShareButton'),
    setButton = function (bool) {
      button.text(bool ? 'Compartir' : 'Dejar de compartir');
    };
  webrtc.on('localScreenStopped', function () {
    console.log('MERCA');
    setButton(true);
  });

  setButton(true);

  button.click(function () {
    console.log('CLICKED')
    if (webrtc.getLocalScreen()) {
      console.log('ASD')
      webrtc.stopScreenShare();
      setButton(true);
    } else {
      webrtc.shareScreen(function (err) {
        if (err) {
          console.log(err);
          setButton(true);
        } else {
          console.log('sabe')
          setButton(false);
        }
      });

    }
  });

});
