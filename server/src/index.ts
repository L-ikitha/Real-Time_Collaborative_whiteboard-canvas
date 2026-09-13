import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.PORT) || 8080;

interface ClientInfo {
  userId: string;
  userName: string;
  roomId: string | null;
}

interface DrawSegment {
  strokeId: string;
  userId: string;
  userName: string;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  color: string;
  brushSize: number;
  isEraser: boolean;
}

interface Stroke {
  strokeId: string;
  userId: string;
  userName: string;
  segments: DrawSegment[];
  active: boolean;
}

interface RoomState {
  clients: Map<WebSocket, ClientInfo>;
  strokes: Stroke[];
  redoStacks: Map<string, string[]>;
}

interface ClientMessage {
  type:
    | "join-room"
    | "draw"
    | "undo"
    | "redo"
    | "clear"
    | "cursor";

  roomId?: string;
  userName?: string;

  strokeId?: string;

  x?: number;
  y?: number;
  previousX?: number;
  previousY?: number;

  color?: string;
  brushSize?: number;
  isEraser?: boolean;
}

const rooms = new Map<string, RoomState>();

const clientInfo = new Map<
  WebSocket,
  ClientInfo
>();

const server = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
});

console.log(
  `WebSocket server running on port ${PORT}`
);

function getRoom(
  roomId: string
): RoomState {
  let room = rooms.get(roomId);

  if (!room) {
    room = {
      clients: new Map(),
      strokes: [],
      redoStacks: new Map(),
    };

    rooms.set(roomId, room);
  }

  return room;
}

function send(
  socket: WebSocket,
  message: unknown
) {
  if (
    socket.readyState ===
    WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify(message)
    );
  }
}

function broadcastToRoom(
  room: RoomState,
  message: unknown,
  exclude?: WebSocket
) {
  for (const socket of room.clients.keys()) {
    if (socket === exclude) {
      continue;
    }

    send(socket, message);
  }
}

function broadcastToAllInRoom(
  room: RoomState,
  message: unknown
) {
  for (const socket of room.clients.keys()) {
    send(socket, message);
  }
}

function sendPresence(
  room: RoomState
) {
  const count =
    room.clients.size;

  broadcastToAllInRoom(room, {
    type: "presence",
    count,
  });
}

function sendUserList(
  room: RoomState
) {
  const users = Array.from(
    room.clients.values()
  ).map((client) => ({
    userId: client.userId,
    userName: client.userName,
  }));

  broadcastToAllInRoom(room, {
    type: "user-list",
    users,
  });
}

function leaveRoom(
  socket: WebSocket
) {
  const client =
    clientInfo.get(socket);

  if (!client?.roomId) {
    clientInfo.delete(socket);
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    clientInfo.delete(socket);
    return;
  }

  room.clients.delete(socket);

  broadcastToAllInRoom(room, {
    type: "user-left",
    userId: client.userId,
    userName: client.userName,
  });

  sendPresence(room);
  sendUserList(room);

  clientInfo.delete(socket);

  if (room.clients.size === 0) {
    rooms.delete(client.roomId);
  }
}

function sendExistingDrawing(
  socket: WebSocket,
  room: RoomState
) {
  for (const stroke of room.strokes) {
    if (!stroke.active) {
      continue;
    }

    for (const segment of stroke.segments) {
      send(socket, {
        type: "draw",
        strokeId:
          segment.strokeId,
        userId:
          segment.userId,
        userName:
          segment.userName,
        x: segment.x,
        y: segment.y,
        previousX:
          segment.previousX,
        previousY:
          segment.previousY,
        color:
          segment.color,
        brushSize:
          segment.brushSize,
        isEraser:
          segment.isEraser,
      });
    }
  }
}

function handleJoinRoom(
  socket: WebSocket,
  message: ClientMessage
) {
  if (
    !message.roomId ||
    !message.userName
  ) {
    return;
  }

  const oldClient =
    clientInfo.get(socket);

  if (oldClient?.roomId) {
    leaveRoom(socket);
  }

  const userId =
    crypto.randomUUID();

  const roomId =
    message.roomId.trim();

  const userName =
    message.userName.trim() ||
    "Anonymous";

  const room =
    getRoom(roomId);

  const client: ClientInfo = {
    userId,
    userName,
    roomId,
  };

  clientInfo.set(
    socket,
    client
  );

  room.clients.set(
    socket,
    client
  );

  send(socket, {
    type: "room-joined",
    roomId,
    userId,
    userName,
  });

  sendExistingDrawing(
    socket,
    room
  );

  broadcastToRoom(
    room,
    {
      type: "user-joined",
      userId,
      userName,
    },
    socket
  );

  sendPresence(room);
  sendUserList(room);

  console.log(
    `${userName} joined room ${roomId}`
  );
}

function handleDraw(
  socket: WebSocket,
  message: ClientMessage
) {
  const client =
    clientInfo.get(socket);

  if (
    !client?.roomId ||
    !message.strokeId ||
    typeof message.x !== "number" ||
    typeof message.y !== "number" ||
    typeof message.previousX !==
      "number" ||
    typeof message.previousY !==
      "number" ||
    typeof message.color !== "string" ||
    typeof message.brushSize !==
      "number" ||
    typeof message.isEraser !==
      "boolean"
  ) {
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    return;
  }

  let stroke =
    room.strokes.find(
      (item) =>
        item.strokeId ===
        message.strokeId
    );

  if (!stroke) {
    stroke = {
      strokeId:
        message.strokeId,
      userId:
        client.userId,
      userName:
        client.userName,
      segments: [],
      active: true,
    };

    room.strokes.push(stroke);

    // A new drawing after an undo
    // invalidates that user's redo history.
    room.redoStacks.set(
      client.userId,
      []
    );
  }

  // Only the user who created the stroke
  // can add segments to it.
  if (
    stroke.userId !==
    client.userId
  ) {
    return;
  }

  const segment: DrawSegment = {
    strokeId:
      message.strokeId,
    userId:
      client.userId,
    userName:
      client.userName,
    x: message.x,
    y: message.y,
    previousX:
      message.previousX,
    previousY:
      message.previousY,
    color:
      message.color,
    brushSize:
      message.brushSize,
    isEraser:
      message.isEraser,
  };

  stroke.segments.push(
    segment
  );

  broadcastToRoom(
    room,
    {
      type: "draw",
      strokeId:
        segment.strokeId,
      userId:
        segment.userId,
      userName:
        segment.userName,
      x: segment.x,
      y: segment.y,
      previousX:
        segment.previousX,
      previousY:
        segment.previousY,
      color:
        segment.color,
      brushSize:
        segment.brushSize,
      isEraser:
        segment.isEraser,
    },
    socket
  );
}

function handleUndo(
  socket: WebSocket
) {
  const client =
    clientInfo.get(socket);

  if (!client?.roomId) {
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    return;
  }

  // Find the latest ACTIVE stroke
  // created by this specific user.
  let targetStroke:
    | Stroke
    | undefined;

  for (
    let index =
      room.strokes.length - 1;
    index >= 0;
    index--
  ) {
    const stroke =
      room.strokes[index];

    if (
      stroke.userId ===
        client.userId &&
      stroke.active
    ) {
      targetStroke = stroke;
      break;
    }
  }

  if (!targetStroke) {
    return;
  }

  targetStroke.active = false;

  const redoStack =
    room.redoStacks.get(
      client.userId
    ) || [];

  redoStack.push(
    targetStroke.strokeId
  );

  room.redoStacks.set(
    client.userId,
    redoStack
  );

  // IMPORTANT:
  // Send to EVERYONE, including the
  // person who clicked Undo.
  broadcastToAllInRoom(
    room,
    {
      type: "undo",
      strokeId:
        targetStroke.strokeId,
      userId:
        client.userId,
      userName:
        client.userName,
    }
  );

  console.log(
    `${client.userName} undid stroke ${targetStroke.strokeId}`
  );
}

function handleRedo(
  socket: WebSocket
) {
  const client =
    clientInfo.get(socket);

  if (!client?.roomId) {
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    return;
  }

  const redoStack =
    room.redoStacks.get(
      client.userId
    ) || [];

  if (redoStack.length === 0) {
    return;
  }

  const strokeId =
    redoStack.pop();

  if (!strokeId) {
    return;
  }

  const stroke =
    room.strokes.find(
      (item) =>
        item.strokeId ===
        strokeId &&
        item.userId ===
          client.userId
    );

  if (!stroke) {
    return;
  }

  stroke.active = true;

  room.redoStacks.set(
    client.userId,
    redoStack
  );

  // Send to EVERYONE.
  broadcastToAllInRoom(
    room,
    {
      type: "redo",
      strokeId:
        stroke.strokeId,
      userId:
        client.userId,
      userName:
        client.userName,
    }
  );

  console.log(
    `${client.userName} redid stroke ${stroke.strokeId}`
  );
}

function handleClear(
  socket: WebSocket
) {
  const client =
    clientInfo.get(socket);

  if (!client?.roomId) {
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    return;
  }

  room.strokes = [];
  room.redoStacks.clear();

  // Send to EVERYONE.
  broadcastToAllInRoom(
    room,
    {
      type: "clear",
    }
  );

  console.log(
    `${client.userName} cleared room ${client.roomId}`
  );
}

function handleCursor(
  socket: WebSocket,
  message: ClientMessage
) {
  const client =
    clientInfo.get(socket);

  if (
    !client?.roomId ||
    typeof message.x !== "number" ||
    typeof message.y !== "number"
  ) {
    return;
  }

  const room =
    rooms.get(client.roomId);

  if (!room) {
    return;
  }

  broadcastToRoom(
    room,
    {
      type: "cursor",
      userId:
        client.userId,
      userName:
        client.userName,
      x: message.x,
      y: message.y,
    },
    socket
  );
}

server.on(
  "connection",
  (socket) => {
    console.log(
      "New WebSocket connection"
    );

    send(socket, {
      type: "connection",
      message:
        "Connected to collaborative whiteboard server",
    });

    socket.on(
      "message",
      (rawMessage) => {
        try {
          const message: ClientMessage =
            JSON.parse(
              rawMessage.toString()
            );

          switch (message.type) {
            case "join-room":
              handleJoinRoom(
                socket,
                message
              );
              break;

            case "draw":
              handleDraw(
                socket,
                message
              );
              break;

            case "undo":
              handleUndo(socket);
              break;

            case "redo":
              handleRedo(socket);
              break;

            case "clear":
              handleClear(socket);
              break;

            case "cursor":
              handleCursor(
                socket,
                message
              );
              break;

            default:
              break;
          }
        } catch (error) {
          console.error(
            "Invalid message:",
            error
          );
        }
      }
    );

    socket.on("close", () => {
      console.log(
        "WebSocket connection closed"
      );

      leaveRoom(socket);
    });

    socket.on("error", (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    });
  }
);