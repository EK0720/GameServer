module.exports = class GameLobbySettings {
    constructor(gameMode, maxPlayers, minPlayers, levelData) {
        this.gameMode = gameMode;
        this.maxPlayers = maxPlayers;
        this.minPlayers = minPlayers;
        this.levelData = levelData;
    }
}