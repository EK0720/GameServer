var shortID = require('shortid');
var Vector3 = require('./Vector3.js');

module.exports = class Player {
    constructor(){
        this.username = 'Default_Player';
        this.displayName = null;
        this.id = shortID.generate();
        this.lobby = 0;
        this.position = new Vector3();
        this.rotation = new Number (0);
        this.characterId = 0;
        this.playerPoint = 0;
        this.isEliminated = false;
    }
    displayerPlayerInformation(){
        let player = this;
        return '(' + player.username + ':' + player.id + ')';   
    }
}