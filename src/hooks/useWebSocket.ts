import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const WS_URL = "ws://localhost:8080";

export interface DrawingMessage {
  type: "draw" | "clear";
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
  type: "user-joined" | "user-left";
  userId: string;
  userName: string;
}

interface ServerMessage {
  type:
    | "connection"
    | "room-joined"
    | "draw"
    | "clear"
    | "presence"
    | "cursor"
    | "user-joined"
    | "user-left";

  message?: string;
  roomId?: string;
  count?: number;

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
  ) => void
) {
  const socketRef =
    useRef<WebSocket | null>(null);

  const onMessageRef =
    useRef(onMessage);

  const onPresenceChangeRef =
    useRef(onPresenceChange);

  const onCursorChangeRef =
    useRef(onCursorChange);

  const onUserChangeRef =
    useRef(onUserChange);

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
    const socket =
      new WebSocket(WS_URL);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "Connected to WebSocket server"
      );

      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message: ServerMessage =
          JSON.parse(event.data);

        console.log(
          "Received:",
          message
        );

        if (
          message.type === "draw"
        ) {
          onMessageRef.current?.({
            type: "draw",
            x: message.x,
            y: message.y,
            previousX:
              message.previousX,
            previousY:
              message.previousY,
            color: message.color,
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
          message.type === "presence" &&
          typeof message.count ===
            "number"
        ) {
          onPresenceChangeRef.current?.(
            message.count
          );

          return;
        }

        if (
          message.type === "cursor" &&
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

          return;
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
    };

    return () => {
      socket.close();
    };
  }, []);

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