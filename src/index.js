require('dotenv').config();
const asyncHandler = require('express-async-handler');

import express from "express";
import http from "http";
import cors from "cors";


import Blockchain from "./blockchain";
import ClientServer from "./client";

const orionChain = new Blockchain.Chain();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.get('/', asyncHandler(async (req, res, next) => res.json(orionChain.getLatestBlock())))
app.get('/chain', asyncHandler(async (req, res, next) => res.json(orionChain.getBlockChain())))
app.get('/health', asyncHandler(async (req, res, next) => res.json({valid: orionChain.isChainValid()})))

const port = process.env.PORT || 5000;
server.listen(port)

const clientWebsocketServer = new ClientServer(orionChain);
clientWebsocketServer.startServer(server);
console.log(`listening client ws server port on: ${port}`);