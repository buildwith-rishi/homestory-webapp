import React, { useState, useCallback, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  ElementFormatType,
  $createParagraphNode,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getNearestNodeOfType } from "@lexical/utils";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Minus,
  Quote,
  Undo2,
  Redo2,
  Copy,
  Maximize2,
  Minimize2,
  ChevronDown,
  Code,
  Type,
} from "lucide-react";
import { $generateHtmlFromNodes } from "@lexical/html";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────
type BlockType = "paragraph" | "h1" | "h2" | "h3" | "quote" | "ul" | "ol";

interface EditorToolbarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  editorMode: "visual" | "source" | "preview";
  onSetMode: (mode: "visual" | "source" | "preview") => void;
}

// ── Sub-components ────────────────────────────────────────────
const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, active, title, disabled, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
      disabled
        ? "text-gray-300 cursor-not-allowed"
        : active
        ? "bg-orange-100 text-orange-600 ring-1 ring-orange-200"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
);

const BLOCK_OPTIONS: { value: BlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "quote", label: "Blockquote" },
];

// ── Main Toolbar ──────────────────────────────────────────────
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onInsertLink,
  onInsertImage,
  editorMode,
  onSetMode,
}) => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const isDisabled = editorMode !== "visual";

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));
    setIsCode(selection.hasFormat("code"));

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as BlockType);
    } else if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType(anchorNode, ListNode);
      if (parentList) {
        setBlockType(parentList.getListType() === "bullet" ? "ul" : "ol");
      }
    } else if (element.getType() === "quote") {
      setBlockType("quote");
    } else {
      setBlockType("paragraph");
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showBlockDropdown) return;
    const close = () => setShowBlockDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showBlockDropdown]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatBlock = (type: BlockType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else if (type === "h1" || type === "h2" || type === "h3") {
        $setBlocksType(selection, () =>
          $createHeadingNode(type as HeadingTagType),
        );
      } else if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else if (type === "ul") {
        if (blockType === "ul") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
      } else if (type === "ol") {
        if (blockType === "ol") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
      }
    });
    setShowBlockDropdown(false);
  };

  const formatAlignment = (alignment: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const insertDivider = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = selection.anchor.getNode();
      const parent = node.getTopLevelElementOrThrow();
      const hr = $createParagraphNode();
      parent.insertAfter(hr);
    });
  };

  const copyHtml = () => {
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      navigator.clipboard.writeText(html);
      toast.success("HTML copied to clipboard");
    });
  };

  const currentBlockLabel = BLOCK_OPTIONS.find((b) => b.value === blockType)?.label || "Paragraph";

  return (
    <div className="border-y border-gray-200 bg-gray-50/80 px-3 py-1.5 flex flex-wrap items-center gap-0.5">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (Ctrl+Z)"
        disabled={isDisabled}
      >
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (Ctrl+Y)"
        disabled={isDisabled}
      >
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarDivider />

      {/* Block Format Dropdown */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => !isDisabled && setShowBlockDropdown(!showBlockDropdown)}
          disabled={isDisabled}
          className={`h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium rounded-lg transition-colors ${
            isDisabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span className="min-w-[70px] text-left">{currentBlockLabel}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {showBlockDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 min-w-[150px]">
            {BLOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => formatBlock(opt.value)}
                className={`block w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  blockType === opt.value
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton onClick={() => formatText("bold")} active={isBold} title="Bold (Ctrl+B)" disabled={isDisabled}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatText("italic")} active={isItalic} title="Italic (Ctrl+I)" disabled={isDisabled}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatText("underline")} active={isUnderline} title="Underline (Ctrl+U)" disabled={isDisabled}>
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatText("strikethrough")} active={isStrikethrough} title="Strikethrough" disabled={isDisabled}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatText("code")} active={isCode} title="Inline Code" disabled={isDisabled}>
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton onClick={() => formatAlignment("left")} title="Align Left" disabled={isDisabled}>
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatAlignment("center")} title="Align Center" disabled={isDisabled}>
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatAlignment("right")} title="Align Right" disabled={isDisabled}>
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatAlignment("justify")} title="Justify" disabled={isDisabled}>
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => formatBlock("ul")} active={blockType === "ul"} title="Bullet List" disabled={isDisabled}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatBlock("ol")} active={blockType === "ol"} title="Numbered List" disabled={isDisabled}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarDivider />

      {/* Insert */}
      <ToolbarButton onClick={onInsertLink} title="Insert Link" disabled={isDisabled}>
        <Link2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onInsertImage} title="Insert Image" disabled={isDisabled}>
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatBlock("quote")} active={blockType === "quote"} title="Blockquote" disabled={isDisabled}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Mode Switcher */}
      <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5 mr-1">
        {(["visual", "source", "preview"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onSetMode(mode)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
              editorMode === mode
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {mode === "source" ? "HTML" : mode === "visual" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <ToolbarButton onClick={copyHtml} title="Copy HTML">
        <Copy className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </ToolbarButton>
    </div>
  );
};

export default EditorToolbar;
