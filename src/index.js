
import blockchain from './blockchain'

let testChain = new blockchain.Chain()
testChain.addBlock(new blockchain.Block(1, Date.now(), {"hello":"world2"}))
testChain.addBlock(new blockchain.Block(2, Date.now(), {"hello":"world3"}))

console.log("List Blocks:")
for (let block of testChain.chain) {
    console.log(JSON.stringify(block))
}

console.log("Chain is Valid:")
console.log(testChain.isChainValid())
