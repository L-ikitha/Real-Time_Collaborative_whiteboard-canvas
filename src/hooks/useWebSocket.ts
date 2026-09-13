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

interface ServerMessage {
  type:
    | "connection"
    | "room-joined"
    | "draw"
    | "clear"
    | "presence";

  message?: string;
  roomId?: string;
  count?: number;

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
  ) => void
) {
  const socketRef =
    useRef<WebSocket | null>(null);

  const onMessageRef =
    useRef(onMessage);

  const onPresenceChangeRef =
    useRef(onPresenceChange);

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
          console.log(
            `Users online: ${message.count}`
          );

          onPresenceChangeRef.current?.(
            message.count
          );

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
    (roomId: string) => {
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
          })
        );

        console.log(
          `Joining room: ${roomId}`
        );
      }
    },
    []
  );

  return {
    isConnected,
    sendMessage,
    joinRoom,
  };
}