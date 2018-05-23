
import blockchain from './blockchain'
import server from './p2p.js'

const orion = new blockchain.Chain()
orion.addBlock(new blockchain.Block(1, Date.now(), {"hello":"world2"}))
orion.addBlock(new blockchain.Block(2, Date.now(), {"hello":"world3"}))

console.log("List Blocks:")
for (let block of orion.chain) {
    console.log(JSON.stringify(block))
}

console.log("Chain is Valid: " + orion.isChainValid())

var p2p_port = process.env.P2P_PORT || 38746;
const websocketServer = new server.Server(orion)
websocketServer.startServer(p2p_port);
console.log('listening websocket p2p port on: ' + p2p_port)