import WebSocket from "ws";
import NodeCache from "node-cache";
import { subscribeMessage, unsubscribeMessage } from "./utils.js";

const BITSTAMP_SERVER = "wss://ws.bitstamp.net";
const EVENT_PREFIX = "bts:";
const CHANNEL_PREFIX = "live_trades_";

export default class BitstampSocket {
  constructor(callback) {
    this.pairs = new Set();
    this.cache = new NodeCache({ stdTTL: 60 });
    this.ws = new WebSocket(BITSTAMP_SERVER);
    this.ws.on("open", () => {
      this.ws.on("error", (err) => {
        console.log(err);
      });
      this.ws.on("message", (_message) => {
        const { event, channel, data } = JSON.parse(_message.toString());
        const pair = channel.replace(CHANNEL_PREFIX, "");
        let message = "";
        switch (event) {
          case "trade":
            message = JSON.stringify(this.#processData(data, pair));
            break;
          case "bts:subscription_succeeded":
            this.pairs.add(pair)
            message = subscribeMessage(pair);
            break;
          case "bts:unsubscription_succeeded":
            this.pairs.delete(pair);
            message = unsubscribeMessage(pair);
            break;
          default:
            message = JSON.stringify({ event, channel, data });
        };
        callback(message);
      });
    });
  };

  subscribe(event, pairs) {
    for (const pair of pairs) {
      if (this.pairs.has(pair)) continue;
      else if (this.pairs.size === 10) return false;
      this.#send(event, pair);
    };
    return true;
  };

  unsubscribe(event, pairs) {
    for (const pair of pairs) {
      if (this.pairs.has(pair)) {
        this.#send(event, pair)
      };
    };
  };

  #send(event, pair) {
    this.ws.send(JSON.stringify({
      event: `${EVENT_PREFIX}${event}`,
      data: {
        channel: `${CHANNEL_PREFIX}${pair}`
      }
    }));
  };

  #processData(data, pair) {
    const { timestamp, price } = data;
    const key = `${pair}:${Math.floor(timestamp / 60)}`;
    const value = this.#OHLC(this.cache.get(key), price);
    this.cache.set(key, value);
    return {
      pair,
      price,
      time: new Date(timestamp * 1000).toLocaleTimeString(), 
      OHLC: {
        open: value[0],
        high: value[1],
        low: value[2],
        close: value[3]
      }
    };
  };

  #OHLC(ohlc, price) {
    if (ohlc == undefined) {
      return Array(4).fill(price);
    };
    const [, high, low, ] = ohlc;
    if (price > high) ohlc[1] = price;
    if (price < low) ohlc[2] = price;
    ohlc[3] = price;
    return ohlc;
  };
};

export const waitForSocketState = (socket, state=1) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 3);
  });
}