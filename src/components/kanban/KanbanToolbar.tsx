import React from "react";
import {
  Minus,
  Plus,
  RotateCcw,
  ChevronsLeftRight,
  ChevronsRightLeft,
} from "lucide-react";

/**
 * Props for the KanbanToolbar component
 */
export interface KanbanToolbarProps {
  /** Current zoom level (0.7 to 1.15) */
  zoom: number;
  /** Callback when zoom in button is clicked */
  onZoomIn: () => void;
  /** Callback when zoom out button is clicked */
  onZoomOut: () => void;
  /** Callback when zoom reset button is clicked */
  onZoomReset: () => void;
  /** Callback when expand all button is clicked */
  onExpandAll?: () => void;
  /** Callback when collapse all button is clicked */
  onCollapseAll?: () => void;
  /** Whether any columns are currently collapsed (enables Expand All) */
  hasCollapsedColumns?: boolean;
  /** Whether any columns are currently expanded (enables Collapse All) */
  hasExpandedColumns?: boolean;
  /** Theme variant */
  theme?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
  /** Minimum zoom level (default: 0.7) */
  minZoom?: number;
  /** Maximum zoom level (default: 1.15) */
  maxZoom?: number;
}

/**
 * Toolbar icon button with consistent styling
 */
interface ToolbarIconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  isLight: boolean;
  children: React.ReactNode;
  className?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({
  onClick,
  disabled = false,
  title,
  isLight,
  children,
  className = "",
  isFirst = false,
  isLast = false,
}) => {
  const roundedClasses = isFirst
    ? "rounded-l-md"
    : isLast
      ? "rounded-r-md"
      : "rounded-none";

  const baseClasses = `
    h-8 w-8 flex items-center justify-center
    transition-all duration-150 ease-in-out
    disabled:opacity-30 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:z-10
    active:scale-90
    ${roundedClasses}
  `;

  const themeClasses = isLight
    ? `bg-gray-50 hover:bg-gray-200 active:bg-orange-100 text-gray-700 
       disabled:hover:bg-gray-50 border-r border-gray-200 last:border-r-0`
    : `bg-gray-800 hover:bg-gray-700 active:bg-orange-900/30 text-gray-300 
       disabled:hover:bg-gray-800 border-r border-gray-700 last:border-r-0`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${themeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Toolbar text button with consistent styling
 */
interface ToolbarTextButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  isLight: boolean;
  children: React.ReactNode;
  className?: string;
}

const ToolbarTextButton: React.FC<ToolbarTextButtonProps> = ({
  onClick,
  disabled = false,
  title,
  isLight,
  children,
  className = "",
}) => {
  const baseClasses = `
    h-8 px-3 flex items-center justify-center
    text-[11px] font-semibold tracking-wide
    rounded-md transition-all duration-150 ease-in-out
    disabled:opacity-30 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-orange-500/50
    active:scale-95
  `;

  const themeClasses = isLight
    ? `bg-gray-50 hover:bg-gray-200 active:bg-orange-100 text-gray-700 
       disabled:hover:bg-gray-50`
    : `bg-gray-800 hover:bg-gray-700 active:bg-orange-900/30 text-gray-300 
       disabled:hover:bg-gray-800`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${themeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Group wrapper for connected buttons
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  isLight: boolean;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  isLight,
  className = "",
}) => {
  const themeClasses = isLight
    ? "bg-gray-100/90 backdrop-blur-sm border border-gray-200"
    : "bg-gray-800/90 backdrop-blur-sm border border-gray-700";

  return (
    <div
      className={`inline-flex items-center rounded-lg overflow-hidden ${themeClasses} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * KanbanToolbar - Refined toolbar component for the Kanban board
 *
 * Features:
 * - Zoom controls with percentage indicator
 * - Column expand/collapse controls
 * - Theme support (light/dark)
 * - Disabled states for min/max zoom and column states
 * - Smooth hover/active transitions
 */
export const KanbanToolbar: React.FC<KanbanToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onExpandAll,
  onCollapseAll,
  hasCollapsedColumns = false,
  hasExpandedColumns = false,
  theme = "dark",
  className = "",
  minZoom = 0.7,
  maxZoom = 1.15,
}) => {
  const isLight = theme === "light";
  const zoomPercentage = Math.round(zoom * 100);
  const isAtMinZoom = zoom <= minZoom;
  const isAtMaxZoom = zoom >= maxZoom;
  const isAtDefaultZoom = Math.abs(zoom - 1.0) < 0.001;

  const containerClasses = isLight
    ? "bg-white/90 backdrop-blur-md border-b border-gray-200"
    : "bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50";

  const labelClasses = isLight
    ? "text-gray-500"
    : "text-gray-500";

  const zoomIndicatorClasses = isLight
    ? "bg-white text-gray-800 border-x border-gray-200"
    : "bg-gray-900 text-gray-200 border-x border-gray-700";

  return (
    <div
      className={`px-3 py-2.5 flex items-center justify-between ${containerClasses} ${className}`}
    >
      {/* Left: Column Controls */}
      {(onExpandAll || onCollapseAll) && (
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${labelClasses}`}
          >
            Columns
          </span>
          <div className="flex items-center gap-1.5">
            {onExpandAll && (
              <ToolbarTextButton
                onClick={onExpandAll}
                disabled={!hasCollapsedColumns}
                title="Expand all columns"
                isLight={isLight}
              >
                <ChevronsLeftRight className="w-3.5 h-3.5 mr-1.5" />
                Expand All
              </ToolbarTextButton>
            )}
            {onCollapseAll && (
              <ToolbarTextButton
                onClick={onCollapseAll}
                disabled={!hasExpandedColumns}
                title="Collapse all columns"
                isLight={isLight}
              >
                <ChevronsRightLeft className="w-3.5 h-3.5 mr-1.5" />
                Collapse All
              </ToolbarTextButton>
            )}
          </div>
        </div>
      )}

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-3">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${labelClasses}`}
        >
          Zoom
        </span>
        <ButtonGroup isLight={isLight}>
          <ToolbarIconButton
            onClick={onZoomOut}
            disabled={isAtMinZoom}
            title={`Zoom out (${minZoom * 100}% min)`}
            isLight={isLight}
            isFirst
          >
            <Minus className="w-4 h-4" />
          </ToolbarIconButton>

          {/* Zoom percentage indicator */}
          <div
            className={`h-8 min-w-[52px] flex items-center justify-center 
              text-xs font-semibold tabular-nums ${zoomIndicatorClasses}`}
          >
            {zoomPercentage}%
          </div>

          <ToolbarIconButton
            onClick={onZoomIn}
            disabled={isAtMaxZoom}
            title={`Zoom in (${maxZoom * 100}% max)`}
            isLight={isLight}
          >
            <Plus className="w-4 h-4" />
          </ToolbarIconButton>

          <ToolbarIconButton
            onClick={onZoomReset}
            disabled={isAtDefaultZoom}
            title="Reset zoom to 100%"
            isLight={isLight}
            isLast
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </ToolbarIconButton>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default KanbanToolbar;
