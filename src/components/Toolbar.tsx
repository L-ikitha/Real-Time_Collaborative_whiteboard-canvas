interface ToolbarProps {
  color: string;
  brushSize: number;
  isEraser: boolean;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onEraserChange: (value: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

function Toolbar({
  color,
  brushSize,
  isEraser,
  onColorChange,
  onBrushSizeChange,
  onEraserChange,
  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="tool-group">
        <label htmlFor="color-picker">Color</label>

        <input
          id="color-picker"
          type="color"
          value={color}
          disabled={isEraser}
          onChange={(event) =>
            onColorChange(event.target.value)
          }
        />
      </div>

      <div className="tool-group brush-control">
        <label htmlFor="brush-size">
          Brush: <strong>{brushSize}px</strong>
        </label>

        <input
          id="brush-size"
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(event) =>
            onBrushSizeChange(Number(event.target.value))
          }
        />
      </div>

      <div className="tool-actions">
        <button
          type="button"
          onClick={() => onEraserChange(!isEraser)}
          className={isEraser ? "active" : ""}
        >
          {isEraser ? "Pen" : "Eraser"}
        </button>

        <button
          type="button"
          onClick={onUndo}
        >
          Undo
        </button>

        <button
          type="button"
          onClick={onRedo}
        >
          Redo
        </button>

        <button
          type="button"
          onClick={onClear}
          className="clear-button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default Toolbar;