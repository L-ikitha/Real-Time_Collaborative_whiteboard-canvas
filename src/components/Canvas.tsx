import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DrawingMessage } from "../hooks/useWebSocket";

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
  onDraw?: (message: DrawingMessage) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  remoteMessage?: DrawingMessage | null;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  (
    {
      color,
      brushSize,
      isEraser,
      onDraw,
      onCanvasReady,
      remoteMessage,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);

    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const historyRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);

    useEffect(() => {
      const canvas = canvasRef.current;

      if (canvas && onCanvasReady) {
        onCanvasReady(canvas);
      }
    }, [onCanvasReady]);

    const getCoordinates = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();

      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      };
    };

    const saveState = () => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");

      if (!context) return;

      historyRef.current.push(
        context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )
      );

      redoStackRef.current = [];
    };

    const drawLine = (
      x: number,
      y: number,
      previousX: number,
      previousY: number,
      strokeColor: string,
      size: number,
      eraser: boolean
    ) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");

      if (!context) return;

      context.lineWidth = size;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = eraser ? "#ffffff" : strokeColor;

      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(x, y);
      context.stroke();
    };

    useEffect(() => {
      if (!remoteMessage) return;

      if (
        remoteMessage.type === "draw" &&
        remoteMessage.x !== undefined &&
        remoteMessage.y !== undefined &&
        remoteMessage.previousX !== undefined &&
        remoteMessage.previousY !== undefined &&
        remoteMessage.color !== undefined &&
        remoteMessage.brushSize !== undefined &&
        remoteMessage.isEraser !== undefined
      ) {
        drawLine(
          remoteMessage.x,
          remoteMessage.y,
          remoteMessage.previousX,
          remoteMessage.previousY,
          remoteMessage.color,
          remoteMessage.brushSize,
          remoteMessage.isEraser
        );
      }

      if (remoteMessage.type === "clear") {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        if (!context) return;

        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    }, [remoteMessage]);

    const startDrawing = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      saveState();

      canvas.setPointerCapture(event.pointerId);

      isDrawingRef.current = true;

      const { x, y } = getCoordinates(event);

      lastPointRef.current = { x, y };
    };

    const draw = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current) return;

      const canvas = canvasRef.current;

      if (!canvas) return;

      const currentPoint = getCoordinates(event);

      const previousPoint = lastPointRef.current;

      if (!previousPoint) {
        lastPointRef.current = currentPoint;
        return;
      }

      drawLine(
        currentPoint.x,
        currentPoint.y,
        previousPoint.x,
        previousPoint.y,
        color,
        brushSize,
        isEraser
      );

      onDraw?.({
        type: "draw",
        x: currentPoint.x,
        y: currentPoint.y,
        previousX: previousPoint.x,
        previousY: previousPoint.y,
        color,
        brushSize,
        isEraser,
      });

      lastPointRef.current = currentPoint;
    };

    const stopDrawing = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    const undo = () => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");

      if (!context) return;

      if (historyRef.current.length === 0) return;

      const currentState = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      redoStackRef.current.push(currentState);

      const previousState = historyRef.current.pop();

      if (previousState) {
        context.putImageData(previousState, 0, 0);
      }
    };

    const redo = () => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");

      if (!context) return;

      if (redoStackRef.current.length === 0) return;

      const currentState = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      historyRef.current.push(currentState);

      const nextState = redoStackRef.current.pop();

      if (nextState) {
        context.putImageData(nextState, 0, 0);
      }
    };

    const clear = () => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const context = canvas.getContext("2d");

      if (!context) return;

      saveState();

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    useImperativeHandle(ref, () => ({
      undo,
      redo,
      clear,
    }));

    return (
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="drawing-canvas"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export { Canvas };