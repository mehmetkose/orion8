import WebSocket from "ws";
import Log from "log";

import blockchain from "./blockchain";

const messageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    MINE_BLOCK: 3,
    PONG: 4
  };

const log = new Log("info");

class PeerToPeerServer {
  constructor(blockchainInstance) {
    this.peers = [];
    this.blockchain = blockchainInstance;
  }
  startServer = port => {
    const server = new WebSocket.Server({ port });
    server.on("connection", ws => this.initConnection(ws));
  };
  initConnection = ws => {
    this.peers.push(ws);
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
    this.ship(ws, this.queryChainLengthMsg());
  };
  initMessageHandler = ws => {
    ws.on("message", data => {
      try {
        const message = JSON.parse(data);
        log.info(`Received message: ${JSON.stringify(message)}`);
        switch (message.type) {
          case messageType.QUERY_LATEST:
            log.info(messageType.QUERY_LATEST);
            this.ship(ws, this.responseLatestMsg());
            break;
          case messageType.QUERY_ALL:
            log.info(messageType.QUERY_ALL);
            this.ship(ws, this.responseChainMsg());
            break;
          case messageType.RESPONSE_BLOCKCHAIN:
            log.info(messageType.RESPONSE_BLOCKCHAIN);
            this.handleBlockchainResponse(message);
            break;
          case messageType.MINE_BLOCK:
            log.info(messageType.RESPONSE_BLOCKCHAIN);
            this.mineBlock(message);
            break;
          default:
            log.info("PONG geldi !");
            this.ship(ws, { type: messageType.PONG });
        }
      } catch (error) {
        log.info(error);
        log.info("parsing error");
      }
    });
  };
  initErrorHandler = ws => {
    ws.on("close", () => this.closeConnection(ws));
    ws.on("error", () => this.closeConnection(ws));
  };
  closeConnection = ws => {
    log.info(`connection failed to peer: ${ws.url}`);
    this.peers.splice(this.peers.indexOf(ws), 1);
  };
  queryChainLengthMsg = () => {
    const response = { type: messageType.QUERY_LATEST };
    return response;
  };
  queryAllMsg = () => {
    const response = { type: messageType.QUERY_ALL };
    return response;
  };
  responseChainMsg = () => {
    const response = {
      type: messageType.RESPONSE_BLOCKCHAIN,
      data: JSON.stringify(this.blockchain)
    };
    return response;
  };
  responseLatestMsg = () => {
    const response = {
      type: messageType.RESPONSE_BLOCKCHAIN,
      data: JSON.stringify([this.blockchain.getLatestBlock()])
    };
    return response;
  };
  ship = (ws, message) => {
    ws.send(JSON.stringify(message));
  };
  broadcast = message => this.peers.forEach(peer => this.ship(peer, message));
  handleBlockchainResponse = message => {
    const receivedBlocks = JSON.parse(message.data).sort(
      (b1, b2) => b1.index - b2.index
    );
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    const latestBlockHeld = this.blockchain.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
      log.info(
        `blockchain possibly behind. We got: ${latestBlockHeld.index} 
         Peer got: ${latestBlockReceived.index}`
      );
      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
        log.info("We can append the received block to our chain");
        this.blockchain.push(latestBlockReceived);
        this.broadcast(this.responseLatestMsg());
      } else if (receivedBlocks.length === 1) {
        log.info("We have to query the chain from our peer");
        this.broadcast(this.queryAllMsg());
      } else {
        log.info("Received blockchain is longer than current blockchain");
        this.replaceChain(receivedBlocks);
      }
    } else {
      log.info(
        "received blockchain is not longer than current blockchain. Do nothing"
      );
    }
  };
  mineBlock = message => {
    let messageObject;
    try {
      messageObject = JSON.parse(message);
    } catch (e) {
      return log.info("parsing error");
    }
    if (message !== null && typeof messageObject === "object") {
      const newBlock = this.generateNextBlock(messageObject);
      this.blockchain.addBlock(newBlock);
      this.broadcast(this.responseLatestMsg());
      log.info("block added: ");
      log.info(JSON.stringify(newBlock));
    }
    return messageObject;
  };
  generateNextBlock = blockData => {
    const previousBlock = this.blockchain.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = previousBlock.hash;
    return new blockchain.Block(index, timestamp, previousHash, blockData);
  };
}
export default PeerToPeerServer;
