import { expect } from "chai";
import WebSocket from "ws";
import { waitForSocketState } from "../socket.js";
import { BITSTAMP_ALERT, SUBSCRIPTION_LIMIT_WARNING, subscribeMessage, unsubscribeMessage, areSetsEqual } from "../utils.js";

describe("rate limit", async () => {
	const url = "http://localhost:8080/data";

	afterEach(async () => {
		await fetch(`${url}/reset`, { method: "POST" });
	});

	it("ip limit", async () => {
		for (let i = 1; i <= 11; i++) {
			const response = await fetch(`${url}/${i}`);
			if (i === 11) {
				const data = await response.json();
				expect(response.status).to.equal(429)
				expect(data.ip).to.equal(11);
				expect(data.id).to.equal(1);
			}
			else { 
				expect(response.status).to.equal(200)
			};
		};
	}).timeout(10000);

	it("id limit", async () => {
		for (let i = 1; i <= 6; i++) {
			const response = await fetch(`${url}/1`);
			if (i === 6) {
				const data = await response.json();
				expect(response.status).to.equal(429);
				expect(data.ip).to.equal(6);
				expect(data.id).to.equal(6);	
			}
			else {
				expect(response.status).to.equal(200);
			};
		};
	}).timeout(10000);
});

describe("websocket", async () => {
	const url = "ws://localhost:8080";
	let ws;

	beforeEach(async () => {
		ws = new WebSocket(url);
		await waitForSocketState(ws);
	});

	it("subscribe, unsubscribe", async () => {
		const flow = [];
		const pair = "btcusd";
		ws.on("message", (_message) => {
			const message = _message.toString();
			if (message === BITSTAMP_ALERT) {
				ws.send(JSON.stringify({
					event: "subscribe",
					pairs: [pair]
				}));
				flow.push(message);
			}
			else if (message === subscribeMessage(pair)) {
				ws.send(JSON.stringify({
					event: "unsubscribe",
					pairs: [pair]
				}));
				flow.push(message);
			}
			else if (message === unsubscribeMessage(pair)) {
				ws.close();
				flow.push(message);
			};
		});
		await waitForSocketState(ws, 3);
		expect(flow[0]).to.equal(BITSTAMP_ALERT);
		expect(flow[1]).to.equal(subscribeMessage(pair));
		expect(flow[2]).to.equal(unsubscribeMessage(pair));
	}).timeout(10000);

	it("subscription limit", async () => {
		const flow = [];
		const subscriptions = [];
		const pairs = new Set([
			"btcusd", "btceur", "btcgbp", "btcpax", "gbpusd", 
			"gbpeur", "eurusd", "xrpusd", "xrpeur", "xrpbtc"
		]);
		ws.on("message", (_message) => {
			const message = _message.toString()
			if (message === BITSTAMP_ALERT) {
				ws.send(JSON.stringify({
					event: "subscribe",
					pairs: Array.from(pairs)
				}));
				flow.push(message);
			}
			else if (message.includes("subscribed")) {
				const subscription = message.replace(" subscribed", "");
				subscriptions.push(subscription);
				if (subscriptions.length === 10) {
					ws.send(JSON.stringify({
						event: "subscribe",
						pairs: ["xrpgbp"]
					}));
				};
			}
			else if (message === SUBSCRIPTION_LIMIT_WARNING) {
				flow.push(message);
				ws.close();
			};
		});
		await waitForSocketState(ws, 3);
		expect(flow[0]).to.equal(BITSTAMP_ALERT);
		expect(flow[1]).to.equal(SUBSCRIPTION_LIMIT_WARNING);
		expect(areSetsEqual(new Set(subscriptions), pairs)).to.be.true;
	}).timeout(10000);
});