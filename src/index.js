var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const env = process.env.NODE_ENV || "development";

let clients = {};
let activityLog = [];

function updateActivityLog(activity) {
  activityLog.unshift(activity);
  if (activityLog.length > 19) {
    activityLog = activityLog.slice(0, 19);
  }
  console.log(activityLog)
}

function getClients() {
  return Object.keys(clients).map((id) => clients[id]);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/ui/index.html");
});

io.on("connection", (socket) => {
  updateActivityLog({ type: "connect", client: socket.client.id });
  io.emit("activityLogUpdate", activityLog);
  clients[socket.client.id] = {};
  clients[socket.client.id].name = socket.client.id; // Default name
  io.to(socket.client.id).emit("clientId", socket.client.id);
  io.emit("clientsUpdate", getClients());

  socket.on("colorChange", (client, newColor) => {
    updateActivityLog({ type: "colorChange", client, newColor });
    io.emit("activityLogUpdate", activityLog);
  });
  socket.on("nameChange", (oldName, newName) => {
    updateActivityLog({ type: "nameChange", oldName, newName });
    io.emit("activityLogUpdate", activityLog);
  });

  socket.on("clientUpdate", ({ name, color, x, y }) => {
    clients[socket.client.id] = { name, color, x, y };
    io.emit("clientsUpdate", getClients());
    console.log(getClients());
  });

  socket.on("disconnect", () => {
    updateActivityLog({
      type: "disconnect",
      client: clients[socket.client.id].name,
    });
    io.emit("activityLogUpdate", activityLog);
    delete clients[socket.client.id];
    io.emit("clientsUpdate", getClients());
  });
});

console.log(process.env.NODE_ENV);

http.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});
