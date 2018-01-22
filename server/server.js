var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    //app.start();
    app.io = require('socket.io')(app.start());

    app.io.on('connection', function(socket) {
      console.log('Connected to socket');

      socket.on('join:room', function(data) {
        console.log(data);

        socket.room = data.room;
        socket.username = data.username;
        socket.join(data.room);

        var allConnectedClients = Object.keys(app.io.sockets.in(data.room).connected);// This will return the array of SockeId of all the connected clients
        var users = [];

        console.log(allConnectedClients);
        
        for (socketId in allConnectedClients) {
          var user = app.io.sockets.connected[allConnectedClients[socketId]]
          users.push(user.username)
        }

        console.log(users);

        app.io.sockets.in(socket.room).emit('user:joined', socket.room, socket.username, users);

      })

      socket.on('message', function(data) {
        console.log(data, socket.room);

        app.io.sockets.in(socket.room).emit('room:message', data, socket.room, socket.username);        
      })
      
      socket.on('disconnect', function() {
        console.log('Socket disconnected');
      })
    })
});
