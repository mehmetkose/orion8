import WebSocket from "ws";
import messageType from "./types";

import Log from "log";

const log = new Log("info");

class PeerToPeerServer {
  constructor(blockchainInstance) {
    this.peers = [];
    this.blockchain = blockchainInstance;
  }
  startServer(port) {
    const server = new WebSocket.Server({ port });
    server.on("connection", ws => this.initConnection(ws));
  }
  initConnection(ws) {
    this.peers.push(ws);
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
    this.write(ws, this.queryChainLengthMsg());
  }
  initMessageHandler(ws) {
    ws.on("message", data => {
      try {
        const message = JSON.parse(data);
        console.log(`Received message: ${JSON.stringify(message)}`);
      } catch (error) {
        console.log(error);
        console.log("parsing error");
      }
      switch (message.type) {
        case messageType.QUERY_LATEST:
          console.log(messageType.QUERY_LATEST);
          this.write(ws, this.responseLatestMsg());
          break;
        case messageType.QUERY_ALL:
          console.log(messageType.QUERY_ALL);
          this.write(ws, this.responseChainMsg());
          break;
        case messageType.RESPONSE_BLOCKCHAIN:
          console.log(messageType.RESPONSE_BLOCKCHAIN);
          this.handleBlockchainResponse(message);
          break;
        case messageType.MINE_BLOCK:
          console.log(messageType.RESPONSE_BLOCKCHAIN);
          this.mineBlock(message);
          break;
        default:
          console.log("PONG geldi !");
          this.write(ws, { type: messageType.PONG });
      }
    });
  }
  initErrorHandler(ws) {
    ws.on("close", () => this.closeConnection(ws));
    ws.on("error", () => this.closeConnection(ws));
  }
  closeConnection(ws) {
    console.log(`connection failed to peer: ${ws.url}`);
    this.peers.splice(this.peers.indexOf(ws), 1);
  }
  queryChainLengthMsg() {
    return { type: messageType.QUERY_LATEST };
  }
  queryAllMsg() {
    return { type: messageType.QUERY_ALL };
  }
  responseChainMsg() {
    return {
      type: messageType.RESPONSE_BLOCKCHAIN,
      data: JSON.stringify(this.blockchain)
    };
  }
  responseLatestMsg() {
    return {
      type: messageType.RESPONSE_BLOCKCHAIN,
      data: JSON.stringify([this.blockchain.getLatestBlock()])
    };
  }
  write(ws, message) {
    ws.send(JSON.stringify(message));
  }
  broadcast(message) {
    return this.peers.forEach(peer => this.write(peer, message));
  }
  handleBlockchainResponse(message) {
    const receivedBlocks = JSON.parse(message.data).sort(
      (b1, b2) => b1.index - b2.index
    );
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    const latestBlockHeld = this.blockchain.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log(
        `blockchain possibly behind. We got: ${latestBlockHeld.index} 
         Peer got: ${latestBlockReceived.index}`
      );
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
      console.log(
        "received blockchain is not longer than current blockchain. Do nothing"
      );
    }
  }
  mineBlock(message) {
    let messageObject;
    try {
      messageObject = JSON.parse(message);
    } catch (e) {
      return console.error(e);
    }
    if (message !== null && typeof messageObject === "object") {
      const newBlock = this.generateNextBlock(messageObject);
      this.blockchain.addBlock(newBlock);
      this.broadcast(this.responseLatestMsg());
      console.log("block added: ");
      console.log(JSON.stringify(newBlock));
    }
    return messageObject;
  }
  generateNextBlock(blockData) {
    const previousBlock = this.blockchain.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = previousBlock.hash;
    return new blockchain.Block(index, timestamp, previousHash, blockData);
  }
}
export default PeerToPeerServer;
