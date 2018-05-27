import SHA256 from "crypto-js/sha256";

class Block {
  constructor(index, timestamp, previousHash, data) {
    this.index = index;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.data = data;
    this.hash = this.calculateHash();
  }
  calculateHash() {
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
    this.chain = [this.createGenesisBlock()];
  }
  createGenesisBlock = () => new Block(0, Date.now(), "0", "Genesis Block");
  getLatestBlock = () => this.chain[this.chain.length - 1];
  addBlock(newBlock) {
    const block = newBlock;
    block.previousHash = this.getLatestBlock().hash;
    block.hash = block.calculateHash();
    this.chain.push(block);
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i += 1) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

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
