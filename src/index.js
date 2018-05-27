import program from "commander";
import colors from "colors";
import Log from "log";

import blockchain from "./blockchain";
// import PeerToPeerServer from "./p2p_server";
import ClientServer from "./client_server";

const log = new Log("info");

program.option("run", "run the server");
program.option("-c --client_port [client_port]", "ws server port", 38746); // FUPIO
program.option("-p --p2p_port [p2p_port]", "p2p server port", 24246); // CHAIN
program.version("0.1.0");
program.parse(process.argv);

if (program.run) {
  const orionChain = new blockchain.Chain();

  // const p2pWebsocketServer = new PeerToPeerServer(orionChain);
  // p2pWebsocketServer.startServer(program.p2p_port);
  // log.info(`listening websocket p2p port on: ${program.p2p_port}`);

  const clientWebsocketServer = new ClientServer(orionChain);
  clientWebsocketServer.startServer(program.client_port);
  log.info(`listening client ws server port on: ${program.client_port}`);
} else if (!process.argv.slice(2).length) {
  program.outputHelp(txt => colors.red(txt));
}
