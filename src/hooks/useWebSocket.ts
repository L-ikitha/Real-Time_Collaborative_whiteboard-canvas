import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  "ws://localhost:8080";

export interface DrawingMessage {
  type:
    | "draw"
    | "clear"
    | "undo"
    | "redo";

  strokeId?: string;
  userId?: string;
  userName?: string;

  x?: number;
  y?: number;
  previousX?: number;
  previousY?: number;
  color?: string;
  brushSize?: number;
  isEraser?: boolean;
}

export interface CursorMessage {
  type: "cursor";
  userId: string;
  userName: string;
  x: number;
  y: number;
}

export interface UserMessage {
  type:
    | "user-joined"
    | "user-left";
  userId: string;
  userName: string;
}

export interface RoomUser {
  userId: string;
  userName: string;
}

interface ServerMessage {
  type:
    | "connection"
    | "room-joined"
    | "draw"
    | "clear"
    | "undo"
    | "redo"
    | "presence"
    | "cursor"
    | "user-joined"
    | "user-left"
    | "user-list";

  message?: string;
  roomId?: string;
  count?: number;

  userId?: string;
  userName?: string;

  strokeId?: string;

  x?: number;
  y?: number;
  previousX?: number;
  previousY?: number;
  color?: string;
  brushSize?: number;
  isEraser?: boolean;

  users?: RoomUser[];
}

export function useWebSocket(
  onMessage?: (
    message: DrawingMessage
  ) => void,
  onPresenceChange?: (
    count: number
  ) => void,
  onCursorChange?: (
    message: CursorMessage
  ) => void,
  onUserChange?: (
    message: UserMessage
  ) => void,
  onUserListChange?: (
    users: RoomUser[]
  ) => void
) {
  const socketRef =
    useRef<WebSocket | null>(null);

  const reconnectTimerRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  const shouldReconnectRef =
    useRef(true);

  const currentRoomRef =
    useRef<string | null>(null);

  const currentUserNameRef =
    useRef("Anonymous");

  const onMessageRef =
    useRef(onMessage);

  const onPresenceChangeRef =
    useRef(onPresenceChange);

  const onCursorChangeRef =
    useRef(onCursorChange);

  const onUserChangeRef =
    useRef(onUserChange);

  const onUserListChangeRef =
    useRef(onUserListChange);

  const [isConnected, setIsConnected] =
    useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onPresenceChangeRef.current =
      onPresenceChange;
  }, [onPresenceChange]);

  useEffect(() => {
    onCursorChangeRef.current =
      onCursorChange;
  }, [onCursorChange]);

  useEffect(() => {
    onUserChangeRef.current =
      onUserChange;
  }, [onUserChange]);

  useEffect(() => {
    onUserListChangeRef.current =
      onUserListChange;
  }, [onUserListChange]);

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      return;
    }

    const existingSocket =
      socketRef.current;

    if (
      existingSocket &&
      (
        existingSocket.readyState ===
          WebSocket.OPEN ||
        existingSocket.readyState ===
          WebSocket.CONNECTING
      )
    ) {
      return;
    }

    console.log(
      "Connecting to WebSocket server:",
      WS_URL
    );

    const socket =
      new WebSocket(WS_URL);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "Connected to WebSocket server"
      );

      setIsConnected(true);

      const room =
        currentRoomRef.current;

      const userName =
        currentUserNameRef.current;

      if (room) {
        socket.send(
          JSON.stringify({
            type: "join-room",
            roomId: room,
            userName,
          })
        );

        console.log(
          `Rejoined room: ${room}`
        );
      }
    };

    socket.onmessage = (event) => {
      try {
        const message: ServerMessage =
          JSON.parse(event.data);

        if (
          message.type === "draw"
        ) {
          onMessageRef.current?.({
            type: "draw",
            strokeId:
              message.strokeId,
            userId:
              message.userId,
            userName:
              message.userName,
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
          });

          return;
        }

        if (
          message.type === "clear"
        ) {
          onMessageRef.current?.({
            type: "clear",
          });

          return;
        }

        if (
          message.type === "undo"
        ) {
          onMessageRef.current?.({
            type: "undo",
            strokeId:
              message.strokeId,
            userId:
              message.userId,
            userName:
              message.userName,
          });

          return;
        }

        if (
          message.type === "redo"
        ) {
          onMessageRef.current?.({
            type: "redo",
            strokeId:
              message.strokeId,
            userId:
              message.userId,
            userName:
              message.userName,
          });

          return;
        }

        if (
          message.type ===
            "presence" &&
          typeof message.count ===
            "number"
        ) {
          onPresenceChangeRef.current?.(
            message.count
          );

          return;
        }

        if (
          message.type ===
            "user-list" &&
          Array.isArray(
            message.users
          )
        ) {
          onUserListChangeRef.current?.(
            message.users
          );

          return;
        }

        if (
          message.type ===
            "cursor" &&
          typeof message.userId ===
            "string" &&
          typeof message.userName ===
            "string" &&
          typeof message.x ===
            "number" &&
          typeof message.y ===
            "number"
        ) {
          onCursorChangeRef.current?.({
            type: "cursor",
            userId:
              message.userId,
            userName:
              message.userName,
            x: message.x,
            y: message.y,
          });

          return;
        }

        if (
          (
            message.type ===
              "user-joined" ||
            message.type ===
              "user-left"
          ) &&
          typeof message.userId ===
            "string" &&
          typeof message.userName ===
            "string"
        ) {
          onUserChangeRef.current?.({
            type: message.type,
            userId:
              message.userId,
            userName:
              message.userName,
          });

          return;
        }

        if (
          message.type ===
          "room-joined"
        ) {
          console.log(
            `Joined room: ${message.roomId}`
          );
        }
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    };

    socket.onclose = () => {
      console.log(
        "Disconnected from WebSocket server"
      );

      setIsConnected(false);

      socketRef.current = null;

      if (
        shouldReconnectRef.current
      ) {
        reconnectTimerRef.current =
          setTimeout(() => {
            connect();
          }, 2000);
      }
    };
  }, []);

  useEffect(() => {
    shouldReconnectRef.current =
      true;

    connect();

    return () => {
      shouldReconnectRef.current =
        false;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current
        );
      }

      socketRef.current?.close();

      socketRef.current = null;
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message: DrawingMessage) => {
      const socket =
        socketRef.current;

      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify(message)
        );
      }
    },
    []
  );

  const joinRoom = useCallback(
    (
      roomId: string,
      userName: string
    ) => {
      currentRoomRef.current =
        roomId;

      currentUserNameRef.current =
        userName;

      const socket =
        socketRef.current;

      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "join-room",
            roomId,
            userName,
          })
        );

        console.log(
          `Joining room: ${roomId}`
        );
      }
    },
    []
  );

  const sendCursor = useCallback(
    (
      x: number,
      y: number
    ) => {
      const socket =
        socketRef.current;

      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "cursor",
            x,
            y,
          })
        );
      }
    },
    []
  );

  return {
    isConnected,
    sendMessage,
    joinRoom,
    sendCursor,
  };
}