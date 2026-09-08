import { useState } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import "./App.css";

function App() {
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);

  const clearCanvas = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      <h1>Collaborative Whiteboard</h1>

      <Toolbar
      color={color}
      brushSize={brushSize}
      onColorChange={setColor}
      onBrushSizeChange={setBrushSize}
      onClear={clearCanvas}
    />

    <Canvas color={color} brushSize={brushSize} />
          
    </div>
  );
}

export default App;