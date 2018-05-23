
import blockchain from './blockchain'
import server from './p2p.js'

const orionChain = new blockchain.Chain()
orionChain.addBlock(new blockchain.Block(1, Date.now(), { "hello": "world2" }))
orionChain.addBlock(new blockchain.Block(2, Date.now(), { "hello": "world3" }))

var program = require('commander');
var colors = require('colors');

program
  .option('run', 'run the server')
  .option('-p --port [port]', 'websocket server port', 38746)
  .version('0.1.0')
  .parse(process.argv);

if(program.run){
  console.log("List Blocks:")
  for (let block of orionChain.chain) {
    console.log(JSON.stringify(block))
  }
  console.log("Chain is Valid: " + orionChain.isChainValid())

  const websocketServer = new server.Server(orionChain)
  websocketServer.startServer(program.port);
  console.log('listening websocket p2p port on: ' + program.port)
}

if (!process.argv.slice(2).length) {
  program.outputHelp( (txt) => colors.red(txt) );
}
 