import WebSocket from "ws";
import Log from "log";

const log = new Log("info");

class ClientServer {
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
  }
  initMessageHandler(ws) {
    ws.on("message", data => {
      try {
        const message = JSON.parse(data);
        log.info(`Received message: ${JSON.stringify(message)}`);
        switch (message.type) {
          case "get_blockchain":
            log.info("get_blockchain");
            this.ship(ws, this.responseChainMsg());
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
  }
  initErrorHandler(ws) {
    ws.on("close", () => this.closeConnection(ws));
    ws.on("error", () => this.closeConnection(ws));
  }
  closeConnection(ws) {
    this.peers.splice(this.peers.indexOf(ws), 1);
  }
  responseChainMsg() {
    return {
      type: "get_blockchain",
      data: JSON.stringify(this.blockchain)
    };
  }
  ship = (ws, message) => {
    ws.send(JSON.stringify(message));
  };
}
export default ClientServer;
