var app = angular.module('real-time', ['lbServices', 'ui.router', 'ngToast']);

var API_URL = 'http://localhost:3000/api/';

app.config(function($stateProvider, $urlRouterProvider) {
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
            url: '/:courseId/room',
            templateUrl: 'views/room.html',
            controller: 'RoomController',
            params: {
                courseName: null
            }
        });

    $urlRouterProvider.otherwise('/app/home');    
});

app.run(function($rootScope) {
    console.log('App running');

    $rootScope.socket = socket = io.connect('http://localhost:3000');

    socket.on('connect', function() {
        console.log('Socket connected to server');
    })
 
})

app.controller('MainController', function($rootScope, $scope, $http, Course) {
    $scope.courses = [];
    $scope.message = '';
    $scope.messages = [];

    $scope.enterRoom = function(course) {
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

    $scope.sendMessage = function() {
        $rootScope.socket.emit('message', $scope.message);
        
    }

    $rootScope.socket.on('room:message', function(data, room) {
            console.log('Message received', data, room);
            $scope.$apply(function() {
                $scope.messages.push(data);
            })
        })

    getCourses();

    function getCourses() {
        Course.find(function(courses) {
            console.log(courses);

            $scope.courses = courses;
        });
    }

    
})

app.controller('HomeController', function($rootScope, $scope) {

});

app.controller('CoursesController', function($rootScope, $scope, $state, Course) {
    $scope.courses = [];
    
    $scope.goToRoom = function(course) {        

        $state.go('app.rooms', {courseId: course.id, courseName: course.name})
    }

    getCourses();

    function getCourses() {
        Course.find(function(courses) {
            console.log(courses);

            $scope.courses = courses;
        });
    }
});

app.controller('RoomController', function($rootScope, $scope, $stateParams, ngToast, Course) {
    console.log($stateParams);

    $scope.course = {};
    $scope.users  = [];
    $scope.messages = [];
    $scope.teacher  = [];   

    Course.find({
        fiter: {
            where: {
                id: $stateParams.courseId
            }
        }
    }, function(courses) {
        $scope.course = courses[0];
        console.log($scope.course);

        $rootScope.socket.emit('join:room', {
            room: $scope.course.name,
            username: prompt('What is your name?')
        });
    });

    $scope.voicePlease = function(url) {
        window.open(url, 'Voice', 'height=400,width=700"');
    };

    // SOCKET

    var messageSound = new Audio('message.mp3');

    $scope.sendMessage = function() {
        $rootScope.socket.emit('message', $scope.message);        
    }

    $scope.teacherTalks = function() {
        $scope.teacher.push($scope.teacherField)
    }

    $rootScope.socket.on('room:message', function(data, room, user) {
            console.log('Message received', data, room, user);

            messageSound.play();

            $scope.$apply(function() {
                $scope.messages.push(user + ': ' + data);
            });
        })

    $rootScope.socket.on('user:joined', function(room, user, clients) {
        console.log('User has joined', room, user, clients);

        $scope.$apply(function() {
            $scope.users = clients;
            ngToast.create('Ha ingresado un usuario!');
        });
        
    })


});