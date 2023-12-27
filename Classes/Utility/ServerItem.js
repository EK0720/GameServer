let shortID = require('shortid')
let Vector3 = require('../Vector3')

module.exports = class ServerItem {
    constructor() {
        this.username = "ServerItem";
        this.id = shortID.generate();
        this.position = new Vector3();
    }
}