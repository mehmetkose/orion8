import WebSocket from 'ws'
import blockchain from './blockchain'

var MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  MINE_BLOCK: 3
};

class Server {
  constructor(blockchain) {
    this.peers = [];
    this.blockchain = blockchain;
  }
  startServer(port) {
    const server = new WebSocket.Server({ port: port })
    server.on('connection', ws => this.initConnection(ws))
  }
  initConnection(ws) {
    this.peers.push(ws)
    this.initMessageHandler(ws)
    this.initErrorHandler(ws)
    this.write(ws, { 'type': MessageType.QUERY_LATEST })
  }
  initMessageHandler(ws) {
    ws.on('message', (data) => {
      try {
        let message = JSON.parse(data);
        console.log('Received message: ' + JSON.stringify(message));
        switch (message.type) {
          case MessageType.QUERY_LATEST:
            this.write(ws, this.responseLatestMsg());
            break;
          case MessageType.QUERY_ALL:
            this.write(ws, this.responseChainMsg());
            break;
          case MessageType.RESPONSE_BLOCKCHAIN:
            this.handleBlockchainResponse(message);
            break;
          case MessageType.MINE_BLOCK:
            this.mineBlock(message);
            break;

        }
      } catch (error) {
        console.log(error)
        console.log("parsing error")
      }

    });
  }
  initErrorHandler(ws) {
    var closeConnection = (ws) => {
      console.log('connection failed to peer: ' + ws.url);
      this.peers.splice(this.peers.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
  }

  getLatestBlock() {
    return this.blockchain[this.blockchain.length - 1]
  }
  queryChainLengthMsg() {
    return { 'type': MessageType.QUERY_LATEST }
  }
  queryAllMsg() {
    return { 'type': MessageType.QUERY_ALL }
  }
  responseChainMsg() {
    return { 'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(this.blockchain) }
  }
  responseLatestMsg() {
    return {
      'type': MessageType.RESPONSE_BLOCKCHAIN,
      'data': JSON.stringify([this.getLatestBlock()])
    }
  }
  write(ws, message) {
    ws.send(JSON.stringify(message))
  }
  broadcast(message) {
    return this.peers.forEach(peer => self.write(peer, message))
  }
  handleBlockchainResponse(message) {
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = this.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
        console.log("We can append the received block to our chain");
        this.blockchain.push(latestBlockReceived);
        this.broadcast(this.responseLatestMsg());
      } else if (receivedBlocks.length === 1) {
        console.log("We have to query the chain from our peer");
        this.broadcast(this.queryAllMsg());
      } else {
        console.log("Received blockchain is longer than current blockchain");
        this.replaceChain(receivedBlocks);
      }
    } else {
      console.log('received blockchain is not longer than current blockchain. Do nothing');
    }
  }
  mineBlock(message) {
    var newBlock = this.generateNextBlock(JSON.parse(message.data));
    this.blockchain.addBlock(newBlock);
    this.broadcast(this.responseLatestMsg());
    console.log("block added: " + JSON.stringify(newBlock));
  }
  generateNextBlock(blockData) {
    const previousBlock = this.blockchain.getLatestBlock();
    return new blockchain.Block(
      previousBlock.index + 1, 
      Date.now(), 
      previousBlock.hash, 
      blockData);
  }
}
export default { Server };
