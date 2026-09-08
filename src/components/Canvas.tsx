import { useRef } from "react";

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
    />
  );
}

export default Canvas;