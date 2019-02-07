import WebSocket from "ws";
import UrlParser from "url-parse";
import { decodeToken, TokenVerifier } from "jsontokens";

class ClientServer {
  constructor(blockchainInstance) {
    this.blockchain = blockchainInstance;
    // [tag] = ['client id 1', 'client id 2']
    this.subscriptions = new Map();
    // [client id] = {client}
    this.clients = new Map();
  }
  startServer(server) {
    const wss = new WebSocket.Server({ 'server': server });
    wss.on("connection", (ws, req) => this.initConnection(ws, req));
  }
  initConnection = (ws, req) => {
    const parameters = UrlParser(req.url, true);
    const decodedToken = decodeToken(parameters.query.token);
    
    if (decodedToken) {
      const publicKey = decodedToken.payload.iss;
      const pieces = publicKey.split(":");
      if (pieces.length > 1) {
        const client = {
          // id: req.headers['sec-websocket-key'],
          id: pieces[pieces.length - 1],
          blockstack: pieces[pieces.length - 1],
          isAuthenticated: true,
          protocolVersion: 1,
          connection: ws
        };
        if (!this.subscriptions.has(client.id)) {
          this.subscriptions.set(client.id, new Set());
        }
        this.subscriptions.get(client.id).add(client.id);
        this.clients.set(client.id, client);

        this.initMessageHandler(ws, client);
        this.initErrorHandler(ws, client);
      }
      else {
        throw new Error("Code smells. We want public key with the :");
      }
    }
  };
  unique = x => [...new Set(x)];
  initMessageHandler = (ws, client) => {
    ws.on("message", data => {
      try {
        const message = JSON.parse(data);
        // console.log(`Received message: ${JSON.stringify(message)}`);
        switch (message.type) {
          case "get_blockchain": {
            ws.send(JSON.stringify(this.responseChainMsg()));
            break;
          }
          case "init_pub_sub": {
            if (!this.clients.has(client.id)) {
              this.clients.set(client.id, client);
            }
            const messageTags = message.data && this.unique(message.data.tags);
            messageTags && messageTags.map(tagRaw => {
                if (typeof tagRaw === "string"){
                  const tag = tagRaw && tagRaw.toLowerCase().trim();
                  if (!this.subscriptions.has(tag)) {
                    this.subscriptions.set(tag, new Set());
                  }
                  this.subscriptions.get(tag).add(client.id);
                }
            });
            break;
          }
          case "add_feed": {
            // 'created' attribute is huge important. don't remove. never ever.
            // that's how we call file name like `${block.created}.json`
            const feed = {
              type: "feed",
              username: message.data.username,
              identity: client.blockstack,
              tags: this.unique(message.data.tags).map(tag => tag.toLowerCase()),
              created: message.data.created
            };
            feed.tags.map(tagRaw => {
                const tag = tagRaw.toLowerCase().trim();
                // set the tag if not.
                if (!this.subscriptions.has(tag)) {
                  this.subscriptions.set(tag, new Set());
                }
                // follow the tags if not.
                this.subscriptions.get(tag).add(feed.identity);
                // push the data to followers of the feed.
                // collapse id's to avoid of sending multiple.
                this.subscriptions.get(tag).forEach(clientId => {
                  const subscription = this.clients.get(clientId);
                  if (subscription) {
                    this.ship(subscription.connection, {
                      type: "feed_load_promise",
                      data: feed
                    });
                  }
                  else {
                    console.log("code smells");
                  }
                });
            });

            const feedKey = `${feed.created}-${feed.identity}`;
            if (!this.subscriptions.has(feedKey)) {
              this.subscriptions.set(feedKey, new Set());
            }
            this.subscriptions.get(feedKey).add(client.id);

            this.mineBlock(feed);
            break;
          }
          case "add_comment": {
            const comment = {
              type: "comment",
              feedId: message.data.feedId,
              username: message.data.username,
              identity: client.blockstack,
              text: message.data.text,
              created: message.data.created
            };
            const subscribeList = this.subscriptions.get(comment.feedId);
            if (subscribeList) {
              subscribeList.forEach(clientId => {
                const subscription = this.clients.get(clientId);
                this.ship(subscription.connection, {
                  type: "comment_load_promise",
                  data: comment
                });
              });
            } else {
              console.log("console.log(subscribeList)");
              console.log(subscribeList);
            }
            // clients following now the feed id's also
            // we need to push parent feed subscribers,
            this.mineBlock(comment);
            break;
          }
          case "follow_tag": {
            const tag = message.data.name.toLowerCase().trim();
            if (!this.subscriptions.has(tag)) {
              this.subscriptions.set(tag, new Set());
            }
            // o etiketleri takip etmiyorsa subscribe et.
            this.subscriptions.get(tag).add(client.id);
            break;
          }
          case "load_feeds": {
            const sentFeedIDs = [];
            const askedTags = message.data.tags;
            const chain = this.blockchain.getBlockChain();
            chain && chain.map(block => {
              if (block.data.hasOwnProperty("tags") && block.index !== 0) {
                block.data.tags.map(blockTag => {
                  askedTags.map(askedTag => {
                    if (blockTag == askedTag) {
                      const feed = {
                        username: block.data.username,
                        identity: block.data.identity,
                        tags: this.unique(block.data.tags),
                        created: block.data.created
                      };
                      this.ship(this.clients.get(client.id).connection, {
                        type: "feed_load_promise",
                        data: feed
                      });
                      const feedID = `${feed.created}-${feed.identity}`;
                      sentFeedIDs.push(feedID);
                    }
                  });
                });
              }
            });
            // TODO: gönderilen feedlerin idlerini bir yere topla,
            // chain'i tekrar tarayıp onların datalarını pass et.
            const sentComment = [];
            const subscription = this.clients.get(client.id);
            chain && chain.map(block => {
              sentFeedIDs.map(sentFeedId => {
                if (block.data.type == "comment" && block.data.feedId == sentFeedId) {
                  const commentID = `${block.data.feedId}-${block.data.created}`;
                  if (!sentComment.includes(commentID)){
                    sentComment.push(commentID);
                    this.ship(subscription.connection, {
                      type: "comment_load_promise",
                      data: block.data
                    });
                  }
                }
              })
            });
            
            break;
          }
          default:
            this.ship(ws, { type: "pong" });
            break;
        }
      } catch (error) {
        console.log(error);
        console.log("parsing error");
      }
    });
  };
  mineBlock = block => {
    let blockIsMined = false;
    do {
      const nextBlock = this.blockchain.generateNextBlock(block);
      // console.log("mineBlock in nextBlock", nextBlock, "\n****");
      blockIsMined = this.blockchain.addBlock(nextBlock);
      if (blockIsMined) {
        break;
      }
    } while (true);
  };
  initErrorHandler = (ws, client) => {
    ws.on("close", () => this.closeConnection(ws, client));
    ws.on("error", () => this.closeConnection(ws, client));
  };
  closeConnection = (ws, client) => {
    this.clients.delete(client.id);
    // todo: döngüyle tüm subscriptionstan client idyi sil.
  };
  responseChainMsg = () => ({
    type: "get_blockchain",
    data: JSON.stringify(this.blockchain.getBlockChain())
  });
  ship = (ws, message) => {
    ws.send(JSON.stringify(message));
  };
}
export default ClientServer;
