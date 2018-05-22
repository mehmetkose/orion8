
const WebSocket = require("ws")

class Server {
    constructor(blockchain) {
        this.peers = [];
        this.blockchain = blockchain;
    }
    startServer(port) {
        const server = new WebSocket.Server({port: port})
        server.on('connection', ws => initConnection(ws))
    }
    initConnection() {
        this.peers.push(ws)
        this.initMessageHandler(ws)
        this.initErrorHandler(ws)
        this.write(ws, {'type': MessageType.QUERY_LATEST})
    }
    initMessageHandler(ws) {
        ws.on('message', (data) => {
            var message = JSON.parse(data);
            console.log('Received message' + JSON.stringify(message));
            switch (message.type) {
                case MessageType.QUERY_LATEST:
                    write(ws, responseLatestMsg());
                    break;
                case MessageType.QUERY_ALL:
                    write(ws, responseChainMsg());
                    break;
                case MessageType.RESPONSE_BLOCKCHAIN:
                    handleBlockchainResponse(message);
                    break;
            }
        });
    }
    initErrorHandler(ws){
        var closeConnection = (ws) => {
            console.log('connection failed to peer: ' + ws.url);
            sockets.splice(sockets.indexOf(ws), 1);
        };
        ws.on('close', () => closeConnection(ws));
        ws.on('error', () => closeConnection(ws));
    }
    write(ws, message){
        ws.send(JSON.stringify(message))
    }
}
export default {Server}
