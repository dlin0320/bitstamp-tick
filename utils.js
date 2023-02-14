export const BITSTAMP_ALERT = "bitstamp streaming";
export const SUBSCRIPTION_LIMIT_WARNING = "subscription limit reached, please unsubscribe first";
export const subscribeMessage = (pair) => `${pair} subscribed`;
export const unsubscribeMessage = (pair) => `${pair} unsubscribed`;
export const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));