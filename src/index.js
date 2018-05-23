
import blockchain from './blockchain'
import server from './p2p.js'

const testChain = new blockchain.Chain()
testChain.addBlock(new blockchain.Block(1, Date.now(), {"hello":"world2"}))
testChain.addBlock(new blockchain.Block(2, Date.now(), {"hello":"world3"}))

console.log("List Blocks:")
for (let block of testChain.chain) {
    console.log(JSON.stringify(block))
}

console.log("Chain is Valid: " + testChain.isChainValid())

var p2p_port = process.env.P2P_PORT || 38746;
const websocketServer = new server.Server(testChain)
websocketServer.startServer(p2p_port);
console.log('listening websocket p2p port on: ' + p2p_port)