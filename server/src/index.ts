import { WebSocketServer, WebSocket } from "ws";

const PORT = 8080;

const server = new WebSocketServer({
  port: PORT,
});

server.on("connection", (socket: WebSocket) => {
  console.log("Client connected");

  socket.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to whiteboard server",
    })
  );

  socket.on("message", (message) => {
    console.log("Received:", message.toString());

    server.clients.forEach((client) => {
      if (
        client !== socket &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(message.toString());
      }
    });
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);