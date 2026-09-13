import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "./components/Canvas";
import type { CanvasHandle } from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const canvasRef = useRef<CanvasHandle | null>(null);

  const { isConnected, sendMessage } = useWebSocket();

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();

    sendMessage({
      type: "clear",
    });
  }, [sendMessage]);

  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      console.log("Canvas ready:", canvas);
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        handleRedo();
      }

      if (event.key.toLowerCase() === "e") {
        setIsEraser((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleRedo, handleUndo]);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Collaborative Whiteboard</h1>
          <p>Draw together in real time</p>
        </div>

        <div className="connection-status">
          <span
            className={`status-dot ${
              isConnected ? "connected" : "disconnected"
            }`}
          />

          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </header>

      <Toolbar
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={setColor}
        onBrushSizeChange={setBrushSize}
        onEraserChange={setIsEraser}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
      />

      <Canvas
        ref={canvasRef}
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onCanvasReady={handleCanvasReady}
        onDraw={() => {
          sendMessage({
            type: "draw",
          });
        }}
      />
    </main>
  );
}

export default App;