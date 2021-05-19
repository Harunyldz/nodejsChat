const express = require('express');
const app = express();
const port = 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.send('<h1>Welcome Realtime Server</h1>');
});

var onlineUsers = [];

io.on('connection', function (socket) {
  //console.log(['user connected', socket]);

  

  socket.on('message', function (obj) {
    // io.emit('message', obj);
    
    socket.broadcast.emit('message', (obj));
    console.log(obj);
    console.log(obj.username + ':' + obj.content);
  });

  socket.on('command', function (obj) {


    if(obj.message == "writeUser"){
      onlineUsers.push({'username': obj.user, socket: socket});
    }

    if(obj.message == "getUsers"){
      var resp = [];

      onlineUsers.forEach((usr)=>{
          resp.push(usr.username);
      });


      socket.emit('command', resp );

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