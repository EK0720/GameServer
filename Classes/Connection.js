const FruitData = require("./FruitData");

module.exports = class Connection {
    constructor() {
        this.socket;
        this.player;
        this.server;
        this.lobby;
    }
    createEvents() {
        let connection = this;
        let socket = connection.socket;
        let server = connection.server;
        let player = connection.player;

        socket.on('disconnect', function() {
            server.onDisconnected(connection);
        });

        socket.on('createAccount', function(data) {
            server.database.CreateAccount(data.username, data.password, results => {
                //Results will return a true or false based on if the account already exists or not
                console.log(results.valid + ': ' + results.reason);
            });
        });

        socket.on('signIn', function(data) {
            server.database.SignIn(data.username, data.password, results => {
                //Results will return a true or false based on if the account already exists or not
                console.log(results.valid + ': ' + results.reason);
                if (results.valid) {
                    //Store the username in the player object
                    socket.emit('signIn');
                }
            });
        });
        socket.on('loadLobby', function() {
            server.onLoadLobby(connection);
        });
        socket.on('createNewLobby', function(Data) {
            server.onCreateNewLobby(connection, Data);
        });
        socket.on('joinLobby', function(Data) {
            server.onJoinLobby(connection, Data);
        });
        socket.on('startGame', function() {
            server.onStartGame(connection);
        });
        // socket.on('joinGame', function() {
        //     server.onAttemptToJoinGame(connection);
        // });
        // socket.on('collisionDestroy', function(data){
        //     connection.lobby.OnCollisionDestroy(connection, data);
        // });
        socket.on('updatePosition', function(data){
                    player.position.x = data.position.x;
                    player.position.y = data.position.y;
                    player.position.z = data.position.z;
                    socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
          
        });
        socket.on("updateFruitMemoryPoint", function(data) {
          const fruitMemoryGameData = new FruitData();
          fruitMemoryGameData.point = data.point;
          console.log(data.point);
        });
        socket.on('updateRotation', function(data){
            player.rotation = data.rotation;
            socket.broadcast.to(connection.lobby.id).emit('updateRotation', player);
            // console.log(data);

        });
        socket.on('quitGame', function(data) {
            server.onSwitchLobby(connection, server.generalServerID);
        });

    }
}