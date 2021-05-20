const express = require('express');
const app = express();
const port = 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;
const _dburl = "mongodb://localhost:27017/";

app.get('/', function (req, res) {
  res.send('<h1>Welcome Realtime Server</h1>');
});

MongoClient.connect(_dburl + 'nodejsChat', function (err, db) {
  db.close();
});

MongoClient.connect(_dburl, function (err, db) {
  if (err) console.error(err);
  var dbo = db.db("nodejsChat");
  dbo.createCollection("users", function (err, res) { });
  dbo.createCollection("groups", function (err, res) { });
  dbo.createCollection("messages", function (err, res) { });
  db.close();

});

var Db = {

  KulliniciEkle: async function (usr) {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    await dbo.collection("users").insertOne(usr);
    db.close();
  },
  KullaniciOku: async function () {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    const result = await (dbo.collection("users").find({}).toArray());
    db.close();
    return result;
  },
  GrupEkle: async function (grp) {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    await dbo.collection("groups").insertOne(grp);
    db.close();
  }, 
  MesajEkle: async function (msg) {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    await dbo.collection("messages").insertOne(msg);
    db.close();
  },
  GurupOku: async function () {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    const result = await(dbo.collection("groups").find({}).toArray());
    db.close();
    return result;
  },
  MesajOku: async function (filterObj) {
    const db = await MongoClient.connect(_dburl);
    const dbo = db.db("nodejsChat");
    const result = await(dbo.collection("messages").find(filterObj).toArray());
    db.close();
    return result;
  }
}

let onlineUsers = [];
let groups = [];

startUp();


async function startUp() {
  onlineUsers = await Db.KullaniciOku();
  groups = await Db.GurupOku();
  console.log(onlineUsers);
  console.log(groups);
  onlineUsers.forEach((usr) => {
    usr.socket = { 'logout': true };
  });
}



var userList = function () {
  var resp = [];

  onlineUsers.filter(x => !(x.socket.logout)).forEach((usr) => {
    resp.push({ 'name': usr.username, 'type': 'user' });
  });

  onlineUsers.filter(x => (x.socket.logout)).forEach((usr) => {
    resp.push({ 'name': usr.username, 'type': 'offline' });
  });

  groups.forEach((grp) => {
    resp.push({ 'name': grp.name, 'type': 'group' });
  });

  resp.push({ 'name': 'everyone', 'type': 'broadcast' });
  return resp;
}

io.on('connection', function (socket) {
  //console.log(['user connected', socket]);
  socket.on('disconnect', function () {
    socket.logout = true;
    socket.broadcast.emit('command', { 'resp': userList(), 'type': 'userlist' });
    //console.log(['disconnected', socket]);
  });


  socket.on('message', function (obj) {
    // io.emit('message', obj);

    if (obj.to == "everyone") {
      socket.broadcast.emit('message', (obj));

    } else {
      Db.MesajEkle(obj);
      onlineUsers.forEach((usr, index) => {
        if (usr.username == obj.to) {
          try {
            usr.socket.emit('message', obj);
          } catch {
          }
        }
      });

      groups.forEach((grp, index) => {
        if (grp.name == obj.to) {
          try {

            var targets = onlineUsers.filter(usr => grp.users.includes(usr.username));

            targets.forEach((usr) => {
              usr.socket.emit('message', obj);
              const dbMsg = Object.assign({}, obj);
              dbMsg.to = usr.username;
              Db.MesajEkle(dbMsg);
            });

          } catch {
            console.log(['error', index, obj, grp]);
          }
        }
      });

    }

    console.log(obj);



  });



  socket.on('command', async function (obj) {
    if (obj.message == "writeUser") {
      var selectedUser = onlineUsers.filter(usr => usr.username == obj.user);
      if (selectedUser.length != 0) {
        selectedUser[0].socket = socket;
      } else {
        Db.KulliniciEkle({ 'username': obj.user, 'createdate': new Date() });
        onlineUsers.push({ 'username': obj.user, socket: socket });
      }

      socket.broadcast.emit('command', { 'resp': userList(), 'type': 'userlist' });
      socket.emit('command', { 'resp': userList(), 'type': 'userlist' });
      var messages = await Db.MesajOku({ 'to': obj.user });
      console.log(['mesaj bu', messages]);
      if (messages)
        messages.forEach(msg => {
          socket.emit('message', msg);
        });

    }

    if (obj.message == "createGroup") {
      if (groups.filter(grp => grp.name == obj.group.name).length != 0) return;
      groups.push(obj.group);
      Db.GrupEkle(obj.group);
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