const http = require("http");
const routers = require('./routes');

console.log(routers.someText);

const server = http.createServer(routers.handler);

server.listen(3000);
