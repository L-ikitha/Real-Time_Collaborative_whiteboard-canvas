import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  PointerEvent as ReactPointerEvent,
} from "react";

import type {
  DrawingMessage,
} from "../hooks/useWebSocket";

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
  onDraw?: (
    message: DrawingMessage
  ) => void;
  onCanvasReady?: (
    canvas: HTMLCanvasElement
  ) => void;
  remoteMessage?: DrawingMessage | null;
}

interface DrawSegment {
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
  segments: DrawSegment[];
  active: boolean;
}

const Canvas = forwardRef<
  CanvasHandle,
  CanvasProps
>(
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
    const canvasRef =
      useRef<HTMLCanvasElement | null>(
        null
      );

    const isDrawingRef =
      useRef(false);

    const lastPointRef =
      useRef<{
        x: number;
        y: number;
      } | null>(null);

    const currentStrokeIdRef =
      useRef<string | null>(null);

    const strokesRef =
      useRef<Stroke[]>([]);

    const localUserIdRef =
      useRef("local-user");

    useEffect(() => {
      const canvas =
        canvasRef.current;

      if (
        canvas &&
        onCanvasReady
      ) {
        onCanvasReady(canvas);
      }
    }, [onCanvasReady]);

    const getCoordinates = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return {
          x: 0,
          y: 0,
        };
      }

      const rect =
        canvas.getBoundingClientRect();

      return {
        x:
          ((event.clientX -
            rect.left) /
            rect.width) *
          canvas.width,

        y:
          ((event.clientY -
            rect.top) /
            rect.height) *
          canvas.height,
      };
    };

    const drawLine = (
      segment: DrawSegment
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.lineWidth =
        segment.brushSize;

      context.lineCap = "round";
      context.lineJoin = "round";

      context.strokeStyle =
        segment.isEraser
          ? "#ffffff"
          : segment.color;

      context.beginPath();

      context.moveTo(
        segment.previousX,
        segment.previousY
      );

      context.lineTo(
        segment.x,
        segment.y
      );

      context.stroke();
    };

    const redrawCanvas = () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      for (
        const stroke of
        strokesRef.current
      ) {
        if (!stroke.active) {
          continue;
        }

        for (
          const segment of
          stroke.segments
        ) {
          drawLine(segment);
        }
      }
    };

    const findStroke = (
      strokeId: string
    ) => {
      return strokesRef.current.find(
        (stroke) =>
          stroke.strokeId ===
          strokeId
      );
    };

    const addSegment = (
      message: DrawingMessage,
      userId: string
    ) => {
      if (
        message.type !== "draw" ||
        message.strokeId ===
          undefined ||
        message.x === undefined ||
        message.y === undefined ||
        message.previousX ===
          undefined ||
        message.previousY ===
          undefined ||
        message.color ===
          undefined ||
        message.brushSize ===
          undefined ||
        message.isEraser ===
          undefined
      ) {
        return;
      }

      const strokeId =
        message.strokeId;

      const existingStroke =
        findStroke(strokeId);

      const segment: DrawSegment = {
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
      };

      if (existingStroke) {
        existingStroke.segments.push(
          segment
        );

        if (existingStroke.active) {
          drawLine(segment);
        }

        return;
      }

      const newStroke: Stroke = {
        strokeId,
        userId,
        segments: [segment],
        active: true,
      };

      strokesRef.current.push(
        newStroke
      );

      drawLine(segment);
    };

    useEffect(() => {
      if (!remoteMessage) {
        return;
      }

      if (
        remoteMessage.type ===
        "draw"
      ) {
        addSegment(
          remoteMessage,
          remoteMessage.userId ||
            "remote-user"
        );
      }

      if (
        remoteMessage.type ===
        "undo"
      ) {
        if (
          remoteMessage.strokeId
        ) {
          const stroke =
            findStroke(
              remoteMessage.strokeId
            );

          if (stroke) {
            stroke.active = false;
            redrawCanvas();
          }
        }
      }

      if (
        remoteMessage.type ===
        "redo"
      ) {
        if (
          remoteMessage.strokeId
        ) {
          const stroke =
            findStroke(
              remoteMessage.strokeId
            );

          if (stroke) {
            stroke.active = true;
            redrawCanvas();
          }
        }
      }

      if (
        remoteMessage.type ===
        "clear"
      ) {
        strokesRef.current = [];
        redrawCanvas();
      }
    }, [remoteMessage]);

    const startDrawing = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      canvas.setPointerCapture(
        event.pointerId
      );

      isDrawingRef.current = true;

      const point =
        getCoordinates(event);

      lastPointRef.current =
        point;

      const strokeId =
        crypto.randomUUID();

      currentStrokeIdRef.current =
        strokeId;

      strokesRef.current.push({
        strokeId,
        userId:
          localUserIdRef.current,
        segments: [],
        active: true,
      });
    };

    const draw = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      if (
        !isDrawingRef.current
      ) {
        return;
      }

      const previousPoint =
        lastPointRef.current;

      if (!previousPoint) {
        return;
      }

      const currentPoint =
        getCoordinates(event);

      const strokeId =
        currentStrokeIdRef.current;

      if (!strokeId) {
        return;
      }

      const segment: DrawSegment = {
        x: currentPoint.x,
        y: currentPoint.y,
        previousX:
          previousPoint.x,
        previousY:
          previousPoint.y,
        color,
        brushSize,
        isEraser,
      };

      const stroke =
        findStroke(strokeId);

      if (stroke) {
        stroke.segments.push(
          segment
        );
      }

      drawLine(segment);

      onDraw?.({
        type: "draw",
        strokeId,
        x: currentPoint.x,
        y: currentPoint.y,
        previousX:
          previousPoint.x,
        previousY:
          previousPoint.y,
        color,
        brushSize,
        isEraser,
      });

      lastPointRef.current =
        currentPoint;
    };

    const stopDrawing = (
      event: ReactPointerEvent<HTMLCanvasElement>
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      if (
        canvas.hasPointerCapture(
          event.pointerId
        )
      ) {
        canvas.releasePointerCapture(
          event.pointerId
        );
      }

      isDrawingRef.current =
        false;

      lastPointRef.current =
        null;

      currentStrokeIdRef.current =
        null;
    };

    const undo = () => {
      onDraw?.({
        type: "undo",
      });
    };

    const redo = () => {
      onDraw?.({
        type: "redo",
      });
    };

    const clear = () => {
      onDraw?.({
        type: "clear",
      });
    };

    useImperativeHandle(
      ref,
      () => ({
        undo,
        redo,
        clear,
      }),
      []
    );

    return (
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="drawing-canvas"
          onPointerDown={
            startDrawing
          }
          onPointerMove={draw}
          onPointerUp={
            stopDrawing
          }
          onPointerCancel={
            stopDrawing
          }
          onContextMenu={(event) =>
            event.preventDefault()
          }
        />
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export { Canvas };