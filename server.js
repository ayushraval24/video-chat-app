// peerjs --port 8001
const { render } = require("ejs");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const PORT = process.env.PORT || 8000;
const { v4: uuidv4 } = require("uuid");

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/meeting", (req, res, next) => {
  res.redirect(`/${uuidv4()}`);
});

app.get(`/:roomid`, (req, res, next) => {
  res.render("room", { roomId: req.params.roomid });
});

app.get("/", (req, res, next) => {
  res.render("home");
});

io.on("connection", (socket) => {
  socket.on("join-room", function (roomId, userId) {
    // to join the socket of user to room
    let username;
    socket.join(roomId);

    // perform action to room and broadcast - inform everyone else the person who is joining
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("get-username", (userName) => {
      username = userName;
    });

    socket.on("createMessage", (message) => {
      // socket.emit("message", message);
      io.in(roomId).emit("createMessage", username, message);
      // socket.to(roomId).emit("createMessage", userId, message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

http.listen(PORT, () => {
  console.log("Server running on port ", PORT);
});

// console.log("Room: ", roomId);
// console.log("User: ", userId);
// console.log("All users: ", io.sockets.adapter.rooms);
// console.log("All users in room: ", io.sockets.adapter.rooms[roomId]);
