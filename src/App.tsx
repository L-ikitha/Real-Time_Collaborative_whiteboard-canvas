import { useState } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import "./App.css";

function App() {
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const clearCanvas = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      <h1>Collaborative Whiteboard</h1>

      <Toolbar
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={setColor}
        onBrushSizeChange={setBrushSize}
        onEraserChange={setIsEraser}
        onClear={clearCanvas}
      />

      <Canvas
        color={color}
        brushSize={brushSize}
        isEraser={isEraser}
      />
    </div>
  );
}

export default App;