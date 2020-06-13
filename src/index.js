var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

let clients = {};

function getClients() {
  return Object.keys(clients).map((id) => clients[id]);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/ui/index.html");
});

io.on("connection", (socket) => {
  socket.broadcast.emit("clientConnected"); // Others will get info
  clients[socket.client.id] = {};
  clients[socket.client.id].name = socket.client.id; // Default name
  io.to(socket.client.id).emit("clientId", socket.client.id);
  io.emit("clientsUpdate", getClients());

  socket.on("clientUpdate", ({ name, color, x, y }) => {
    clients[socket.client.id] = { name, color, x, y };
    io.emit("clientsUpdate", getClients());
    console.log(getClients());
  });

  socket.on("disconnect", () => {
    delete clients[socket.client.id];
    socket.broadcast.emit("user disconnected");
    io.emit("clientsUpdate", getClients());
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
