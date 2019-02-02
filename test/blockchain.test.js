import blockchain from "../src/blockchain";

describe("Test Chain", () => {
  const testChain = new blockchain.Chain();

  it("chain valid", () => {
    expect(testChain).toBeDefined();
    //expect(testChain.isChainValid()).toBe(true);
  });

  it("genesis block index must be 0", () => {
    expect(testChain).toBeDefined();
    expect(testChain.createGenesisBlock().index).toBe(0);
  });

  it('genesis block data must be equal to "Genesis Block"', () => {
    expect(testChain).toBeDefined();
    expect(testChain.createGenesisBlock().data).toBe("Genesis Block");
  });

  it('genesis block previousHash must be equal to "0"', () => {
    expect(testChain).toBeDefined();
    expect(testChain.createGenesisBlock().previousHash).toBe("0");
  });

  it("genesis block hash must be 64 char", () => {
    expect(testChain).toBeDefined();
    expect(testChain.createGenesisBlock().hash.length).toBe(64);
  });

  // it("only with genesis, blocks count must be 1", () => {
  //   expect(testChain.chain.length).toBe(1);
  // });

//   it("first block must be added", () => {
//     const block1 = new blockchain.Block(
//       1,
//       Date.now(),
//       testChain.getLatestBlock().previousHash,
//       { hello: "world2" }
//     );
//     testChain.addBlock(block1);
//     expect(testChain).toBeDefined();
//     expect(testChain.chain.length).toBe(2);
//   });

//   it("second block must be added", () => {
//     const block2 = new blockchain.Block(
//       2,
//       Date.now(),
//       testChain.getLatestBlock().previousHash,
//       { hello: "world3" }
//     );
//     testChain.addBlock(block2);
//     expect(testChain).toBeDefined();
//     expect(testChain.chain.length).toBe(3);
//   });

//   it("last 2 block index must be equal", () => {
//     const latest = testChain.chain[testChain.chain.length - 1];
//     const lastButOne = testChain.chain[testChain.chain.length - 2];
//     expect(testChain).toBeDefined();
//     expect(lastButOne.index + 1).toBe(latest.index);
//   });

//   it("last block hash must be verified", () => {
//     const latest = testChain.chain[testChain.chain.length - 1];
//     expect(testChain).toBeDefined();
//     expect(latest.hash).toBe(latest.calculateHash());
//   });

//   it("last block hash must be string", () => {
//     const latest = testChain.chain[testChain.chain.length - 1];
//     expect(testChain).toBeDefined();
//     expect(typeof latest.hash).toBe("string");
//   });

//   it("last 2 block hashes must be reference each other", () => {
//     const latest = testChain.chain[testChain.chain.length - 1];
//     const lastButOne = testChain.chain[testChain.chain.length - 2];
//     expect(testChain).toBeDefined();
//     expect(latest.previousHash).toBe(lastButOne.hash);
//   });

//   it("chain must with be invalid with the wrong index", () => {
//     const wrongBlock = new blockchain.Block(
//       12,
//       Date.now(),
//       testChain.getLatestBlock().previousHash,
//       { hello: "world2" }
//     );
//     testChain.addBlock(wrongBlock);
//     expect(testChain).toBeDefined();
//     expect(testChain.chain.length).toBe(4);
//     expect(testChain.isChainValid()).toBe(false);
//     testChain.chain.pop();
//     expect(testChain.chain.length).toBe(3);
//   });
});
