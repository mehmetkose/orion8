import PeerToPeerServer from "../src/p2p_server";
import blockchain from "../src/blockchain";

describe("Test Chain", () => {
  const testChain = new blockchain.Chain();
  const peerServer = new PeerToPeerServer(testChain);

  it("test chain defined", () => {
    expect(peerServer).toBeDefined();
  });
});
