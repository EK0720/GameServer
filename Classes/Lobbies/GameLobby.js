let LobbyBase = require('./LobbyBase')
let GameLobbySettings = require('./GameLobbySettings')
let Connection = require('../Connection')
let LobbyState = require('../Utility/LobbyState')
let Vector3 = require('../Vector3')
let ServerItem = require('../Utility/ServerItem')

module.exports = class GameLobbby extends LobbyBase {
    constructor(settings = GameLobbySettings) {
        super();
        this.settings = settings;
        this.lobbyState = new LobbyState();
        this.playersCompletedRound = [];
        this.playerEliminated = [];
        this.endGameLobby = function() {};
    }

    onUpdate() {
        super.onUpdate();

        let lobby = this;
        let serverItems = lobby.serverItems; 
        // lobby.updateDeadPlayers();

        //Clos lobby because no one is here
        if (lobby.connections.length == 0) {
            lobby.endGameLobby();
        }
    }

    canEnterLobby(connection = Connection) {
        let lobby = this;
        let maxPlayerCount = lobby.settings.maxPlayers;
        let currentPlayerCount = lobby.connections.length;

        if(currentPlayerCount + 1 > maxPlayerCount) {
            return false;
        }

        return true;
    }

    onEnterLobby(connection = Connection) {
        let lobby = this;
        let socket = connection.socket;

        super.onEnterLobby(connection);
        lobby.onLoadIdPlayerInLobby();
        //lobby.addPlayer(connection);

            // if (lobby.connections.length == lobby.settings.maxPlayers &&   lobby.lobbyState.currentState == lobby.lobbyState.GAME) {
            //     console.log('We have enough players we can start the game');
            //     lobby.onSpawnAllPlayersIntoGame();
            //     //lobby.onSpawnAIIntoGame();
            //     let returnData = {
            //         state: lobby.lobbyState.currentState
            //     };
            // socket.emit('loadGame');
            // socket.emit('lobbyUpdate', returnData);
            // socket.broadcast.to(lobby.id).emit('lobbyUpdate', returnData);
            // }

        // let returnData = {
        //     state: lobby.lobbyState.currentState
        // };

        // socket.emit('loadGame');
        // socket.emit('lobbyUpdate', returnData);
        // socket.broadcast.to(lobby.id).emit('lobbyUpdate', returnData);

        //Handle spawning any server spawned objects here
        //Example: loot, perhaps flying bullets etc
    }
    onStartLobby(connection = Connection) {
        let lobby = this;
        let socket = connection.socket;
        console.log('We will start the game');
        lobby.lobbyState.currentState = lobby.lobbyState.GAME;
        let returnData = {
            state: lobby.lobbyState.currentState
        };
        socket.emit('loadGame');
        socket.broadcast.to(lobby.id).emit('loadGame');
        lobby.onSpawnAllPlayersIntoGame();

        socket.emit('lobbyUpdate', returnData);
        socket.broadcast.to(lobby.id).emit('lobbyUpdate', returnData);
    }
    onLeaveLobby(connection = Connection) {
        let lobby = this;

        super.onLeaveLobby(connection);

        lobby.removePlayer(connection);

        //Handle unspawning any server spawned objects here
        //Example: loot, perhaps flying bullets etc
        // lobby.onUnspawnAllAIInGame(connection);

        //Determine if we have enough players to continue the game or not
        if (lobby.connections.length < lobby.settings.minPlayers) {
            lobby.connections.forEach(connection => {
                if (connection != undefined) {
                    connection.socket.emit('unloadGame');
                    connection.server.onSwitchLobby(connection, connection.server.generalServerID);
                }
            });
        }
    }

    onLoadIdPlayerInLobby() {
        let lobby = this;
        let connections = lobby.connections;

        connections.forEach(connection => {
            let socket = connection.socket;
            var returnData = {
                id: connection.player.id,
                characterId: connection.player.characterId,
                playername: connection.player.displayName
            }
            console.log(returnData);
            socket.emit('loadPlayerInfo', returnData);
            socket.broadcast.to(lobby.id).emit('loadPlayerInfo', returnData);
        });
    }

    onSpawnAllPlayersIntoGame() {
        let lobby = this;
        let connections = lobby.connections;

        connections.forEach(connection => {
            lobby.addPlayer(connection);
        });
    }
  
    addPlayer(connection = Connection) {
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;

        let randomPosition = lobby.getRandomSpawn();
        connection.player.position = new Vector3(randomPosition.x, randomPosition.y, randomPosition.z);

        var returnData = {
            id: connection.player.id,
            position: connection.player.position,
            characterId: connection.player.characterId,
            playername: connection.player.displayName
        }
        if (lobby.settings.gameMode =="FruitMemory") {
            lobby.playGameFruit(connection);
        }
        else  lobby.playTagGame(connection);
        socket.emit('spawn', returnData); //tell myself I have spawned
        socket.broadcast.to(lobby.id).emit('spawn', returnData); // Tell others
   
        //Tell myself about everyone else already in the lobby
        connections.forEach(c => {
            if(c.player.id != connection.player.id) {
                socket.emit('spawn', {
                    id: c.player.id,
                    position: c.player.position
                });
                socket.broadcast.to(lobby.id).emit('spawn',{
                    id: c.player.id,
                    position: c.player.position
                });
            }
        });
    }
    playGameFruit(connection = Connection) {
        let lobby = this;
        let socket = connection.socket;
        const fruits = ["Apple", "Lemon", "Grape", "Orange"];
        let roundNumber = 1;
        function sendNextRound() {
          if (roundNumber > 5) {
            lobby.lobbyState.currentState = "Lobby";
            return;
          }
          lobby.playersCompletedRound = [];
          const shuffledFruits = [];
      
          for (let i = 0; i < 16; i++) {
            const fruitIndex = Math.floor(Math.random() * 4);
            shuffledFruits.push(fruits[fruitIndex]);
          }
      
          const requiredFruit = shuffledFruits[Math.floor(Math.random() * 16)];
      
          const data = {
            round: roundNumber,
            fruits: shuffledFruits,
            requiredFruit: requiredFruit,
          };      
          // Gửi round hiện tại đến tất cả người chơi
          socket.emit("showFruits", data);
          socket.broadcast.to(lobby.id).emit("showFruits", data);
        }
        // Khởi động trò chơi bằng việc gửi round đầu tiên
        sendNextRound();
      
        // Xử lý sự kiện từ front end khi người chơi hoàn thành round
        socket.on("roundCompleted", (data) => {
          if (lobby.lobbyState.currentState == lobby.lobbyState.GAME) {
          const point = data.point;
          lobby.playersCompletedRound.push(connection.player.id);
          connection.player.playerPoint += point;
          connection.player.isEliminated = data.isEliminated;

          console.log(lobby.playersCompletedRound);
          if(lobby.playersCompletedRound.length === lobby.connections.length) {
          // Tính điểm tổng của người chơi
            // Xếp hạng người chơi dựa trên điểm số
            const rankings = lobby.connections.sort((a, b) => b.player.playerPoint - a.player.playerPoint).map((connection) =>`${connection.player.id} - ${connection.player.isEliminated}`);
      
            const roundResult = {
              round: roundNumber,
              isEliminated: connection.player.isEliminated,
              points: lobby.connections.reduce((points, connection) => {
                points[connection.player.displayName] = connection.player.playerPoint;
                return points;
              }, {}),
              rankings: rankings,
            };
      
            // Gửi kết quả round cho bên front end
            socket.emit("roundResult", roundResult);
            socket.broadcast.to(lobby.id).emit("roundResult", roundResult);
            roundNumber++;
      
            // Gửi round tiếp theo sau một khoảng thời gian
            setTimeout(() => {
              sendNextRound();
            }, 100); // Thời gian chờ giữa các round (ví dụ: 2 giây)
        }
    }
        });
    }

    playTagGame(connection = Connection) {
        let lobby = this;
        let socket = connection.socket;
        let connections = lobby.connections;
        lobby.playersCompletedRound.push(connection.player.id);
        if(lobby.playersCompletedRound.length == lobby.connections.length) {
        let chaserPlayer = lobby.connections[Math.floor(Math.random() * lobby.connections.length)];
        socket.emit("getChaserPlayer",  chaserPlayer.player.id);
        socket.broadcast.to(lobby.id).emit("getChaserPlayer",  chaserPlayer.player.id);
        console.log( chaserPlayer.player.id + "ID đầu");
        }
        socket.on("isEliminated", (data) => {
          if (lobby.lobbyState.currentState == lobby.lobbyState.GAME) {
            // lobby.playersCompletedRound.push(connection.player.id);
            // if(data.isEliminated) {
            //     lobby.playerEliminated.push(connection.player.id);
            //     connection.player.isEliminated = data.isEliminated;
            // }
            if(data.id!=null) {
                lobby.playerEliminated.push(data.id);
                connections.forEach(c => {
                    if(c.player.id == data.id) {
                        c.player.isEliminated = true;
                    }
                });
            }
            
            console.log(lobby.playerEliminated);
            // if (lobby.playersCompletedRound.length === lobby.connections.length) {
              const rankings = lobby.connections.sort((a, b) =>
                lobby.playerEliminated.indexOf(a.player.id) - lobby.playerEliminated.indexOf(b.player.id)
              ).map((connection) => `${connection.player.id} - ${connection.player.isEliminated}`);
      
              const roundResult = {
                isEliminated: connection.player.isEliminated,
                rankings: rankings,
              };
                const survivePlayer = lobby.connections.filter(connection => !lobby.playerEliminated.some(eliminatedPlayer => eliminatedPlayer === connection.player.id));
                if(survivePlayer.length > 0){
                const newChaserPlayer = survivePlayer[Math.floor(Math.random() * survivePlayer.length)];
                // console.log(survivePlayer);
                // console.log("Tôi dai dột" + newChaserPlayer);
                const newChaserPlayerid = newChaserPlayer.player.id;
                console.log("Tôi dai dột" + newChaserPlayerid);
                socket.emit("getChaserPlayer", newChaserPlayerid);
                socket.broadcast.to(lobby.id).emit("getChaserPlayer", newChaserPlayerid);
                }
              // Gửi kết quả round cho bên front end
              socket.emit("roundResult", roundResult);
              socket.broadcast.to(lobby.id).emit("roundResult", roundResult);
            //   lobby.playersCompletedRound = [];
            // }
          }
        });
      }
    removePlayer(connection = Connection) {
        let lobby = this;

        connection.socket.broadcast.to(lobby.id).emit('disconnected', {
            id: connection.player.id
        });
    }

    getRandomSpawn() {
        let lobby = this;
        let index = lobby.getRndInteger(0, lobby.settings.levelData.freeForAllSpawn.length);

        return {
            x: lobby.settings.levelData.freeForAllSpawn[index].position.x,
            y: 1,
            z: lobby.settings.levelData.freeForAllSpawn[index].position.z,
        }
    }

    //Includes Min, Exlcudes Max
    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}