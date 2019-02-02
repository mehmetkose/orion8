import SHA256 from "crypto-js/sha256";
import jsonfile from "jsonfile";
const axios = require('axios');

class Block {
  constructor(index, timestamp, previousHash, data) {
    this.index = index;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.data = data;
    this.hash = this.calculateHash();
  }
  calculateHash = () => {
    return SHA256(
      this.index +
      this.timestamp +
      this.previousHash +
      JSON.stringify(this.data)
    ).toString();
  }
}

class Chain {
  constructor() {
    this.fileName = "blockchain.db";
    this.setupDatabase();
  }
  setupDatabase = () => {
    jsonfile.readFile(this.fileName)
    .catch(_error => {
      let schema = {chain: [this.createGenesisBlock()]};
      axios.get("https://pulsar8.herokuapp.com/chain").then(response => {
        console.log("axios geldi")
        if(response && response.data) {
          console.log("iki geldi mi")
          schema = response.data
          console.log(schema)
        }
        console.log(schema)
        jsonfile.writeFile(this.fileName, schema, (err) => err && console.log(err));
      })
    })
  }
  createBlock = (index, timestamp, previousHash, data) => {
    return new Block(index, timestamp, previousHash, data);
  }
  createGenesisBlock = () => this.createBlock(0, Date.now(), "0", {type: "genesis", data: {}})
  addBlock = (newBlock) => {
    if (newBlock) {
      const database = this.getBlockChain();
      database.push(newBlock);
      jsonfile.writeFileSync(this.fileName, database);
      return true;
    }
    return false;
  }
  getLatestBlock = () => {
    let database = this.getBlockChain();
    return database.pop();
  }
  getBlockChain = () => {
    return jsonfile.readFileSync(this.fileName)
  }
  generateNextBlock = blockData => {
    const latest = this.getLatestBlock();
    const index = latest.index + 1;
    const timestamp = Date.now();
    const previousHash = latest.hash;
    return new Block(index, timestamp, previousHash, blockData);
  }
  isChainValid() {
    const database = this.getBlockChain();
    for (let i = 1; i < database.chain.length; i += 1) {
      const currentBlock = this.createBlock(
        database.chain[i].index,
        database.chain[i].timestamp,
        database.chain[i].previousHash,
        database.chain[i].data
      );
      const previousBlock = this.createBlock(
        database.chain[i - 1].index,
        database.chain[i - 1].timestamp,
        database.chain[i - 1].previousHash,
        database.chain[i - 1].data
      );
      if (previousBlock.index + 1 !== currentBlock.index) {
        return false;
      } else if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      } else if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

export default { Block, Chain };