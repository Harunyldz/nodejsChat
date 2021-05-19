const express = require('express');
const app = express();
const port = 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.send('<h1>Welcome Realtime Server</h1>');
});

var onlineUsers = [];

var userList = function(){
  var resp = [];

  onlineUsers.forEach((usr) => {
    resp.push(usr.username);
  });

  resp.push("everyone");

  return resp;
}

io.on('connection', function (socket) {
  //console.log(['user connected', socket]);
  socket.on('disconnect', function () {
    //console.log(['disconnected', socket]);
  });


  socket.on('message', function (obj) {
    // io.emit('message', obj);

    if (obj.to == "everyone") {
      socket.broadcast.emit('message', (obj));

    } else {
      var errors = [];
      onlineUsers.forEach((usr, index) => {
        if (usr.username == obj.to) {
          try {
            usr.socket.emit('message', obj);
          } catch {
            errors.push(index);
          }
        }
      });


      var newOnlineUsers = [];
      onlineUsers.forEach((usr, index) => {
        if (!errors.includes(index))
          newOnlineUsers.push(usr);
      });

      onlineUsers = newOnlineUsers;
    }

    console.log(obj);
  });

  socket.on('command', function (obj) {


    if (obj.message == "writeUser") {
      onlineUsers.push({ 'username': obj.user, socket: socket });
      socket.broadcast.emit('command', { 'resp': userList(), 'type': 'userlist' });
      socket.emit('command', { 'resp': userList(), 'type': 'userlist' });
    }

    if (obj.message == "getUsers") {
      socket.emit('command', { 'resp': userList(), 'type': 'userlist' });
    }

    // io.emit('message', obj);

    //socket.broadcast.emit('message', (obj));
    console.log(obj);
  });


});

app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '\\node_modules\\socket.io-client\\dist\\'));

http.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});