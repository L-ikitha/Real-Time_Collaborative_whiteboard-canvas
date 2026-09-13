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
      <div className="toolbar-group">
        <span className="toolbar-label">Color</span>

        <input
          className="color-input"
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
        />
      </div>

      <div className="toolbar-group brush-group">
        <span className="toolbar-label">Brush</span>

        <input
          className="brush-input"
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(event) =>
            onBrushSizeChange(Number(event.target.value))
          }
        />

        <span className="brush-value">{brushSize}px</span>
      </div>

      <div className="toolbar-divider" />

      <button
        type="button"
        className={`toolbar-button ${isEraser ? "active" : ""}`}
        onClick={() => onEraserChange(!isEraser)}
      >
        🧹 Eraser
      </button>

      <button
        type="button"
        className="toolbar-button"
        onClick={onUndo}
      >
        ↩ Undo
      </button>

      <button
        type="button"
        className="toolbar-button"
        onClick={onRedo}
      >
        ↪ Redo
      </button>

      <button
        type="button"
        className="toolbar-button clear-button"
        onClick={onClear}
      >
        🗑 Clear
      </button>
    </div>
  );
}

export default Toolbar;