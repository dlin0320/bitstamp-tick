# Nodejs Websocket Server

run all tests with:
### `make tests`

start server with:
### `make server`

fetch api exposed at http://localhost/8080/data?user=id

websocket server at [ws://localhost/8080](ws://localhost/8080)

example websocket message
```json
{
	"event": "subscribe",
	"pairs": ["btcusd", "ethusd", "ltcusd"]
}

{
	"event": "unsubscribe",
	"pairs": ["btcusd", "ethusd"]
}
```