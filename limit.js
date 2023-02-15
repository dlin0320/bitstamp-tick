import { rateLimit, MemoryStore } from "express-rate-limit";

export const store = new MemoryStore();

export const ipLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 10,
	store: store,
	requestPropertyName: "ipRateLimit",
	handler: (req, res, next) => {
		next();
	}
});
export const idLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 5,
	store: store,
	requestPropertyName: "idRateLimit",
	keyGenerator: (req, res) => {
		return req.query.user;
	},
	handler: (req, res, next) => {
		next();
	}
});