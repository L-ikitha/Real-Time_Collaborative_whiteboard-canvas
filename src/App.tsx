import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Canvas } from "./components/Canvas";
import type { CanvasHandle } from "./components/Canvas";

import Toolbar from "./components/Toolbar";

import {
  useWebSocket,
} from "./hooks/useWebSocket";

import type {
  CursorMessage,
  DrawingMessage,
  UserMessage,
} from "./hooks/useWebSocket";

interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

function App() {
  const [color, setColor] =
    useState("#000000");

  const [brushSize, setBrushSize] =
    useState(5);

  const [isEraser, setIsEraser] =
    useState(false);

  const [roomId, setRoomId] =
    useState("");

  const [roomInput, setRoomInput] =
    useState("");

  const [userName, setUserName] =
    useState("");

  const [nameInput, setNameInput] =
    useState("");

  const [onlineUsers, setOnlineUsers] =
    useState(0);

  const [remoteMessage, setRemoteMessage] =
    useState<DrawingMessage | null>(
      null
    );

  const [cursors, setCursors] =
    useState<Cursor[]>([]);

  const canvasRef =
    useRef<CanvasHandle | null>(
      null
    );

  const handleRemoteMessage =
    useCallback(
      (message: DrawingMessage) => {
        setRemoteMessage(message);
      },
      []
    );

  const handlePresenceChange =
    useCallback((count: number) => {
      setOnlineUsers(count);
    }, []);

  const handleCursorChange =
    useCallback(
      (message: CursorMessage) => {
        setCursors((current) => {
          const existing =
            current.find(
              (cursor) =>
                cursor.userId ===
                message.userId
            );

          if (existing) {
            return current.map(
              (cursor) =>
                cursor.userId ===
                message.userId
                  ? {
                      ...cursor,
                      x: message.x,
                      y: message.y,
                      userName:
                        message.userName,
                    }
                  : cursor
            );
          }

          return [
            ...current,
            {
              userId:
                message.userId,
              userName:
                message.userName,
              x: message.x,
              y: message.y,
            },
          ];
        });
      },
      []
    );

  const handleUserChange =
    useCallback(
      (message: UserMessage) => {
        if (
          message.type ===
          "user-left"
        ) {
          setCursors((current) =>
            current.filter(
              (cursor) =>
                cursor.userId !==
                message.userId
            )
          );
        }
      },
      []
    );

  const {
    isConnected,
    sendMessage,
    joinRoom,
    sendCursor,
  } = useWebSocket(
    handleRemoteMessage,
    handlePresenceChange,
    handleCursorChange,
    handleUserChange
  );

  const handleUndo =
    useCallback(() => {
      canvasRef.current?.undo();
    }, []);

  const handleRedo =
    useCallback(() => {
      canvasRef.current?.redo();
    }, []);

  const handleClear =
    useCallback(() => {
      canvasRef.current?.clear();

      sendMessage({
        type: "clear",
      });
    }, [sendMessage]);

  const handleCanvasReady =
    useCallback(
      (canvas: HTMLCanvasElement) => {
        console.log(
          "Canvas ready:",
          canvas
        );
      },
      []
    );

  const handleJoinRoom = () => {
    const trimmedRoom =
      roomInput.trim();

    const trimmedName =
      nameInput.trim();

    if (
      !trimmedRoom ||
      !trimmedName
    ) {
      return;
    }

    joinRoom(
      trimmedRoom,
      trimmedName
    );

    setRoomId(trimmedRoom);
    setUserName(trimmedName);

    setOnlineUsers(1);

    setCursors([]);

    canvasRef.current?.clear();

    setRemoteMessage(null);
  };

  const handleCanvasPointerMove =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (!roomId) {
          return;
        }

        const canvas =
          event.currentTarget.querySelector(
            ".drawing-canvas"
          ) as HTMLCanvasElement | null;

        if (!canvas) {
          return;
        }

        const rect =
          canvas.getBoundingClientRect();

        const x =
          ((event.clientX -
            rect.left) /
            rect.width) *
          canvas.width;

        const y =
          ((event.clientY -
            rect.top) /
            rect.height) *
          canvas.height;

        sendCursor(x, y);
      },
      [roomId, sendCursor]
    );

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();

        handleRedo();
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setIsEraser(
          (current) => !current
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleRedo,
    handleUndo,
  ]);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>
            Collaborative Whiteboard
          </h1>

          <p>
            Draw together in real time
          </p>
        </div>

        <div className="connection-status">
          <span
            className={`status-dot ${
              isConnected
                ? "connected"
                : "disconnected"
            }`}
          />

          {isConnected
            ? "Connected"
            : "Disconnected"}
        </div>
      </header>

      <div className="room-bar">
        <div className="room-info">
          <span className="room-label">
            Room
          </span>

          <span className="room-name">
            {roomId || "Not joined"}
          </span>

          {roomId && (
            <>
              <span className="room-users">
                👥 {onlineUsers}{" "}
                {onlineUsers === 1
                  ? "user"
                  : "users"}{" "}
                online
              </span>

              <span className="room-user-name">
                👤 {userName}
              </span>
            </>
          )}
        </div>

        <div className="room-controls">
          <input
            type="text"
            value={nameInput}
            onChange={(event) =>
              setNameInput(
                event.target.value
              )
            }
            placeholder="Your name"
          />

          <input
            type="text"
            value={roomInput}
            onChange={(event) =>
              setRoomInput(
                event.target.value
              )
            }
            placeholder="Room name"
          />

          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={
              !isConnected ||
              !nameInput.trim() ||
              !roomInput.trim()
            }
          >
            Join Room
          </button>
        </div>
      </div>

      <Toolbar
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={setColor}
        onBrushSizeChange={
          setBrushSize
        }
        onEraserChange={
          setIsEraser
        }
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
      />

      <div
        className="canvas-area"
        onPointerMove={
          handleCanvasPointerMove
        }
      >
        <Canvas
          ref={canvasRef}
          color={color}
          brushSize={brushSize}
          isEraser={isEraser}
          onCanvasReady={
            handleCanvasReady
          }
          remoteMessage={
            remoteMessage
          }
          onDraw={sendMessage}
        />

        {cursors.map((cursor) => (
          <div
            key={cursor.userId}
            className="remote-cursor"
            style={{
              left: `${cursor.x / 10}%`,
              top: `${cursor.y / 6}%`,
            }}
          >
            <span className="cursor-pointer">
              ↖
            </span>

            <span className="cursor-name">
              {cursor.userName}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;