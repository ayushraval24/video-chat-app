// HOME Page

const newMeeting = document.getElementById("new-meeting");
const meetingCode = document.getElementById("meeting-code");
const meetingJoin = document.getElementById("meeting-join");

// HOME Page END

// path of the root file of server
const socket = io("/");

// since we are connecting to our own server, we need to pass some parameters
// undefined is id which will be created by our own server

var peer = new Peer({
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  pingInterval: 5000,
});
// var peer = new Peer({
//   host: "/",
//   port: 8001,
// });

const videoGrid = document.getElementById("video-grid");
const video = document.createElement("video");
video.style.maxHeight = "300px";
video.className = "col";
video.style.marginBottom = "12px";

const send_message = document.getElementById("send");
let text = document.querySelector("#chat_message");
let messages = document.querySelector(".messages");

send_message.addEventListener("click", () => {
  if (text.value.length !== 0) {
    socket.emit("createMessage", text.value);
    text.value = "";
  }
});

// no need to listen our own video
video.muted = true;

const peers = {};
let myUserId;

// this media will go to other users
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(video, stream);

    // listening to call
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      video.style.maxHeight = "300px";
      video.className = "col";
      video.style.marginBottom = "12px";

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      myUserId = userId;
      console.log("Connected both");
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    console.log("User ", userId, " disconnected");
    console.log("Peers id: ", peers);
  }
});

socket.on("createMessage", (userName, message) => {
  const newMessage = document.createElement("p");
  const messageHtml = `<p class="text-white"> ${
    userName == myUserId ? "Me" : userName
  } : ${message}</p>`;
  newMessage.innerHTML = messageHtml;
  messages.appendChild(newMessage);
});

// we want to run this code as soon as user connects with peer server and return id
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);

  let username = prompt("Enter your name: ");
  socket.emit("get-username", username);
});

const connectToNewUser = (userId, stream) => {
  // calling user and sending stream - which is sending our audio and video
  const call = peer.call(userId, stream);

  const video = document.createElement("video");

  video.style.maxHeight = "300px";
  video.className = "col";
  video.style.marginBottom = "12px";
  console.log("CALL: ", call);

  // video - audio stream sent from other peer
  call.on("stream", (userVideoStream) => {
    console.log("Add");
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

// when it loads stream and video is loaded on the page - we want to play the video
const addVideoStream = (video, stream) => {
  console.log("INSIDE: ", video);
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

// Steps
// 1. create a video stream and add it to the video element
// 2. call user-connected event and send our video stream to that user
// 3. call a certain user with userid using call function of peer object - and pass our video stream
// 4. take video stream coming from other user using call.on('stream') function
// 5. add other user's stream to our video element
// 6. remove video if someone leaves the call useing close() functionx
// 7. listen for other users perspective using on('call')
