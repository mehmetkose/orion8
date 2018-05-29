import WebSocket from "ws";
import Log from "log";
import UrlParser from "url-parse";
import unique from "uniqid";

import blockchain from "./blockchain";

const log = new Log("info");

class ClientServer {
  constructor(blockchainInstance) {
    this.clients = {};
    this.tags = {};
    this.blockchain = blockchainInstance;
  }
  startServer(port) {
    const server = new WebSocket.Server({ port });
    server.on("connection", (ws, req) => this.initConnection(ws, req));
  }
  initConnection = (ws, req) => {
    const parameters = UrlParser(req.url, true);
    const identityAddress = parameters.query.token;
    ws.unique = unique();
    this.clients[ws.unique] = { ws, identityAddress };
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
  };
  initMessageHandler = ws => {
    ws.on("message", data => {
      try {
        const message = JSON.parse(data);
        log.info(`Received message: ${JSON.stringify(message)}`);
        switch (message.type) {
          case "get_blockchain":
            log.info("get_blockchain");
            this.ship(ws, this.responseChainMsg());
            break;
          case "add_feed":
            this.mineBlock(message.data);
            this.ship(ws, { type: "add_feed", data: "lorem" });
            break;
          default:
            log.info("PONG !");
            this.ship(ws, { type: "pong" });
            break;
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
    // this.clients.splice(this.clients.indexOf(ws), 1);
    delete this.clients[ws.unique];
  };
  mineBlock = message => {
    const newBlock = this.generateNextBlock(message);
    this.blockchain.addBlock(newBlock);
    // this.broadcast(this.responseLatestMsg());
    log.info("block added: ");
    log.info(JSON.stringify(newBlock));
    return newBlock;
  };
  generateNextBlock = blockData => {
    const previousBlock = this.blockchain.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = previousBlock.hash;
    return new blockchain.Block(index, timestamp, previousHash, blockData);
  };
  responseChainMsg = () => ({
    type: "get_blockchain",
    data: JSON.stringify(this.blockchain)
  });
  ship = (ws, message) => {
    ws.send(JSON.stringify(message));
  };
}
export default ClientServer;
