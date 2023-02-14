import WebSocket from "ws";
import NodeCache from "node-cache";

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
        let message = "";
        switch (event) {
          case "trade":
            message = JSON.stringify(this.#processData(data, channel));
            break;
          case "bts:subscription_succeeded":
            this.pairs.add(channel)
            message = `${channel.replace(CHANNEL_PREFIX, "")} subscribed`;
            break;
          case "bts:unsubscription_succeeded":
            this.pairs.delete(channel);
            message = `${channel.replace(CHANNEL_PREFIX, "")} unsubscribed`;
            break;
          default:
            message = JSON.stringify({ event, channel, data });
        };
        callback(message);
      });
    });
  };

  send(_event, _channel) {
    const channel = `${CHANNEL_PREFIX}${_channel}`;
    const event = `${EVENT_PREFIX}${_event}`
    const message = JSON.stringify({ event, data: { channel } });
    this.ws.send(message);
  };

  #processData(data, channel) {
    const { timestamp, price } = data;
    const key = `${channel}:${Math.floor(timestamp / 60)}`;
    const prices = this.cache.get(key);
    const time = new Date(timestamp * 1000).toLocaleTimeString();
    if (prices != undefined) {
      this.#OHLC(prices, price);
      this.cache.set(key, prices);
      return { 
        open: prices[0], 
        high: prices[1], 
        low: prices[2], 
        close: prices[3], 
        time
      };
    };
    this.cache.set(key, [price, price, price, price]);
    return { open: price, time };
  }

  #OHLC(prices, price) {
    if (prices[1] < price) prices[1] = price;
    if (prices[2] > price) prices[2] = price;
    prices[3] = price;
  }
};