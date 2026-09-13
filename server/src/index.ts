import { randomUUID } from "node:crypto";

import {
  WebSocketServer,
  WebSocket,
} from "ws";

const PORT = Number(process.env.PORT) || 8080;

const server = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
});

interface ClientInfo {
  socket: WebSocket;
  userId: string;
  userName: string;
}

const rooms = new Map<
  string,
  Map<WebSocket, ClientInfo>
>();

function getRoom(roomId: string) {
  return rooms.get(roomId);
}

function joinRoom(
  client: ClientInfo,
  roomId: string
) {
  let room = rooms.get(roomId);

  if (!room) {
    room = new Map();
    rooms.set(roomId, room);
  }

  room.set(
    client.socket,
    client
  );
}

function leaveRoom(
  socket: WebSocket,
  roomId: string | null
) {
  if (!roomId) {
    return;
  }

  const room = rooms.get(roomId);

  if (!room) {
    return;
  }

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
  const room = getRoom(roomId);

  if (!room) {
    return;
  }

  room.forEach((client) => {
    if (
      client.socket !== sender &&
      client.socket.readyState ===
        WebSocket.OPEN
    ) {
      client.socket.send(message);
    }
  });
}

function sendUserList(
  roomId: string,
  socket: WebSocket
) {
  const room = getRoom(roomId);

  if (!room) {
    return;
  }

  const users = Array.from(
    room.values()
  ).map((client) => ({
    userId: client.userId,
    userName: client.userName,
  }));

  socket.send(
    JSON.stringify({
      type: "user-list",
      users,
    })
  );
}

function broadcastUserList(
  roomId: string
) {
  const room = getRoom(roomId);

  if (!room) {
    return;
  }

  const users = Array.from(
    room.values()
  ).map((client) => ({
    userId: client.userId,
    userName: client.userName,
  }));

  const message =
    JSON.stringify({
      type: "user-list",
      users,
    });

  room.forEach((client) => {
    if (
      client.socket.readyState ===
      WebSocket.OPEN
    ) {
      client.socket.send(message);
    }
  });
}

function broadcastPresence(
  roomId: string
) {
  const room = getRoom(roomId);

  if (!room) {
    return;
  }

  const message =
    JSON.stringify({
      type: "presence",
      count: room.size,
    });

  room.forEach((client) => {
    if (
      client.socket.readyState ===
      WebSocket.OPEN
    ) {
      client.socket.send(message);
    }
  });
}

function broadcastUserEvent(
  roomId: string,
  sender: WebSocket,
  type:
    | "user-joined"
    | "user-left",
  userId: string,
  userName: string
) {
  const room = getRoom(roomId);

  if (!room) {
    return;
  }

  const message =
    JSON.stringify({
      type,
      userId,
      userName,
    });

  room.forEach((client) => {
    if (
      client.socket !== sender &&
      client.socket.readyState ===
        WebSocket.OPEN
    ) {
      client.socket.send(message);
    }
  });
}

server.on(
  "connection",
  (socket: WebSocket) => {
    console.log(
      "Client connected"
    );

    let currentRoom:
      | string
      | null = null;

    const userId =
      randomUUID();

    let userName =
      "Anonymous";

    socket.send(
      JSON.stringify({
        type: "connection",
        message:
          "Connected to whiteboard server",
        userId,
      })
    );

    socket.on(
      "message",
      (message) => {
        try {
          const data =
            JSON.parse(
              message.toString()
            );

          if (
            data.type ===
            "join-room"
          ) {
            const newRoom =
              typeof data.roomId ===
              "string"
                ? data.roomId.trim()
                : "";

            if (!newRoom) {
              return;
            }

            const newUserName =
              typeof data.userName ===
              "string"
                ? data.userName.trim()
                : "";

            if (newUserName) {
              userName =
                newUserName;
            }

            const previousRoom =
              currentRoom;

            if (
              previousRoom ===
              newRoom
            ) {
              socket.send(
                JSON.stringify({
                  type:
                    "room-joined",
                  roomId:
                    newRoom,
                  userId,
                  userName,
                })
              );

              sendUserList(
                newRoom,
                socket
              );

              broadcastPresence(
                newRoom
              );

              return;
            }

            if (previousRoom) {
              broadcastUserEvent(
                previousRoom,
                socket,
                "user-left",
                userId,
                userName
              );

              leaveRoom(
                socket,
                previousRoom
              );

              broadcastPresence(
                previousRoom
              );

              broadcastUserList(
                previousRoom
              );
            }

            currentRoom =
              newRoom;

            const client: ClientInfo =
              {
                socket,
                userId,
                userName,
              };

            joinRoom(
              client,
              newRoom
            );

            socket.send(
              JSON.stringify({
                type:
                  "room-joined",
                roomId:
                  newRoom,
                userId,
                userName,
              })
            );

            broadcastUserEvent(
              newRoom,
              socket,
              "user-joined",
              userId,
              userName
            );

            broadcastPresence(
              newRoom
            );

            broadcastUserList(
              newRoom
            );

            sendUserList(
              newRoom,
              socket
            );

            console.log(
              `${userName} joined room: ${newRoom}`
            );

            return;
          }

          if (!currentRoom) {
            return;
          }

          if (
            data.type ===
            "cursor"
          ) {
            broadcastToRoom(
              currentRoom,
              socket,
              JSON.stringify({
                type: "cursor",
                userId,
                userName,
                x: data.x,
                y: data.y,
              })
            );

            return;
          }

          if (
            data.type ===
              "undo" ||
            data.type ===
              "redo"
          ) {
            broadcastToRoom(
              currentRoom,
              socket,
              JSON.stringify({
                type: data.type,
                userId,
                userName,
              })
            );

            return;
          }

          broadcastToRoom(
            currentRoom,
            socket,
            message.toString()
          );
        } catch (error) {
          console.error(
            "Invalid message:",
            error
          );
        }
      }
    );

    socket.on(
      "close",
      () => {
        if (currentRoom) {
          const room =
            currentRoom;

          broadcastUserEvent(
            room,
            socket,
            "user-left",
            userId,
            userName
          );

          leaveRoom(
            socket,
            room
          );

          broadcastPresence(
            room
          );

          broadcastUserList(
            room
          );

          console.log(
            `${userName} disconnected from room: ${room}`
          );
        }
      }
    );
  }
);

console.log(
  `WebSocket server running on port ${PORT}`
);