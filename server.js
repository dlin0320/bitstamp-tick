import express, { json } from "express";
import { createServer } from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { ipLimiter, idLimiter, store } from "./limit.js";

const FETCH_URL = "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty";
const PORT = 8080;
const app = express();
const server = createServer(app);
app.use(cors());
app.use(json());
app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.get("/data/:user", idLimiter, ipLimiter, (req, res) => {
  const ip = req.ipRateLimit;
  const id = req.idRateLimit;
  if (ip.current > ip.limit || id.current > id.limit) {
    return res.status(429).send({ ip: ip.current, id: id.current });
  };
  fetch(FETCH_URL).then((response) => {
    if (response.status == 200) {
      return response.json();
    }
    else throw Error("fetch error");
  }).then((data) => {
    res.send(data);
  }).catch((err) => {
    console.log(err);
    res.sendStatus(500)
  });
});

app.post("/data/reset", async (req, res) => {
  await store.resetAll();
  res.sendStatus(200);
});

server.listen(PORT, () => {
  console.log(`server listening on port: ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", ws => {
  console.log("user connected")
})