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
            server.database.SwitchUserOnlineStatus(connection.player.username, 0, results =>
            {
                console.log(results.valid + ': ' + results.reason);
            });
        });

        socket.on('createAccount', function(data) {
            server.database.CreateAccount(data.username, data.password, data.email, results => {
                //Results will return a true or false based on if the account already exists or not
                console.log(results.valid + ': ' + results.reason);
            });
        });
        socket.on('forgotPassword', function(data) {
            server.database.ForgotPassword(data.email, results => {
                console.log(results.valid + ': ' + results.reason);
            });
        });
        socket.on('resetPassword', function(data) {
            server.database.ChangePassword(data.username, data.currentPassword, data.newPassword, results => {
                console.log(results.valid + ': ' + results.reason);
            });
        });
        socket.on('signIn', function(data) {
            server.database.SignIn(data.username, data.password, results => {
                //Results will return a true or false based on if the account already exists or not
                console.log(results.valid + ': ' + results.reason);
                if (results.valid) {
                    //Store the username in the player object
                    server.database.GetUsername(data.username, results => {
                        connection.player.displayName = results;
                    });
                    connection.player.username = data.username;
                    server.database.SwitchUserOnlineStatus(data.username, 1, results =>
                    {
                        console.log(results.valid + ': ' + results.reason);
                    });
                    socket.emit('signIn');
                }
            });
        });
        socket.on('updateDisplayName', function(Data) {
            server.onUpdateDisplayName(connection, Data);
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
        //Friend----------------------------------------//
        socket.on("sendFriendRequest", function(data) {
            server.onSendFriendRequest(connection, data);
        });
        socket.on("checkFriendRequest", function() {
            server.onCheckFriendRequest(connection);
          });
        socket.on("acceptFriendRequest", function(data) {
            server.onAcceptFriendRequest(connection, data);
          });
        socket.on("unFriend", function(data) {
            server.onUnFriend(connection, data);
          });
        //-----------------------------------------------//
        socket.on("updateUserLeaderboard", function(data) {
            server.onUpdateUserLeaderboard(connection, data);
          });
        socket.on("showLeaderboard", function(data) {
            server.onShowLeaderboard(connection, data);
          });
        socket.on("sendMessage", function(data) {
            server.onSendMessage(connection, data);
        });
        socket.on('updatePosition', function(data){
                    player.position.x = data.position.x;
                    player.position.y = data.position.y;
                    player.position.z = data.position.z;
                    socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
          
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