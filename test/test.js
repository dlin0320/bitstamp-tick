import { expect } from "chai";

const SERVER_URL = "http://localhost:8080/data/";

describe("rate limit", async () => {
	afterEach(async () => {
		await fetch(`${SERVER_URL}reset`, { method: "POST" });
	});
	it("ip limit", async () => {
		for (let i = 1; i <= 11; i++) {
			const response = await fetch(`${SERVER_URL}${i}`);
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
			const response = await fetch(`${SERVER_URL}1`);
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