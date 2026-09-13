import { WebSocketServer, WebSocket } from "ws";

const PORT = 8080;

const server = new WebSocketServer({
  port: PORT,
});

const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(socket: WebSocket, roomId: string) {
  let room = rooms.get(roomId);

  if (!room) {
    room = new Set<WebSocket>();
    rooms.set(roomId, room);
  }

  room.add(socket);
}

function leaveRoom(socket: WebSocket, roomId: string) {
  const room = rooms.get(roomId);

  if (!room) return;

  room.delete(socket);

  if (room.size === 0) {
    rooms.delete(roomId);
  }
}

function broadcastToRoom(
  roomId: string,
  sender: WebSocket,
  message: string
) {
  const room = rooms.get(roomId);

  if (!room) return;

  room.forEach((client) => {
    if (
      client !== sender &&
      client.readyState === WebSocket.OPEN
    ) {
      client.send(message);
    }
  });
}

function broadcastPresence(roomId: string) {
  const room = rooms.get(roomId);

  if (!room) return;

  const message = JSON.stringify({
    type: "presence",
    count: room.size,
  });

  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.on("connection", (socket: WebSocket) => {
  console.log("Client connected");

  let currentRoom = "default";

  joinRoom(socket, currentRoom);

  socket.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to whiteboard server",
      roomId: currentRoom,
    })
  );

  broadcastPresence(currentRoom);

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "join-room") {
        const previousRoom = currentRoom;

        leaveRoom(socket, previousRoom);
        broadcastPresence(previousRoom);

        currentRoom = data.roomId || "default";

        joinRoom(socket, currentRoom);

        socket.send(
          JSON.stringify({
            type: "room-joined",
            roomId: currentRoom,
          })
        );

        broadcastPresence(currentRoom);

        console.log(
          `Client joined room: ${currentRoom}`
        );

        return;
      }

      broadcastToRoom(
        currentRoom,
        socket,
        message.toString()
      );
    } catch (error) {
      console.error("Invalid message:", error);
    }
  });

  socket.on("close", () => {
    leaveRoom(socket, currentRoom);
    broadcastPresence(currentRoom);

    console.log(
      `Client disconnected from room: ${currentRoom}`
    );
  });
});

console.log(
  `WebSocket server running on ws://localhost:${PORT}`
);