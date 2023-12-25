let io = require('socket.io')(process.env.PORT || 52300);
let Server = require('./Classes/Server')

console.log('Server has started');

if (process.env.PORT == undefined) {
    console.log('Local Server');
} else {
    console.log('Hosted Server');
}

let server = new Server(process.env.PORT == undefined);

setInterval(() => {
    server.onUpdate();
}, 100, 0);

io.on('connection', function(socket) {
    let connection = server.onConnected(socket);
    connection.registerLoggedInEvents();
    connection.socket.emit('register', {'id': connection.player.id});
});



// // Web Manager
// const express = require("express");
// const cors = require("cors");
// const app = express();
// const userRouter = require("./Classes/Api/User.Router");

// app.use(express.json());

// app.use(cors());

// app.use("/api", userRouter);

// app.listen(9000, () => {
//   console.log("Server Manager Working");
// });