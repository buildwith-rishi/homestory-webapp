import React, { useCallback, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  EditorState,
  LexicalEditor,
  ElementNode,
} from "lexical";
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";

// ── Toolbar plugin ──────────────────────────────────────────────────────────

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(
    new Set(),
  );
  const [activeListType, setActiveListType] = React.useState<
    "bullet" | "number" | null
  >(null);

  // Track selection state to highlight active buttons
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const formats = new Set<string>();
        if (selection.hasFormat("bold")) formats.add("bold");
        if (selection.hasFormat("italic")) formats.add("italic");
        if (selection.hasFormat("underline")) formats.add("underline");
        if (selection.hasFormat("strikethrough")) formats.add("strikethrough");
        setActiveFormats(formats);

        // Check if inside a list
        const anchorNode = selection.anchor.getNode();
        const parent =
          anchorNode.getParent()?.getParent() ?? anchorNode.getParent();
        if (parent && $isListNode(parent)) {
          setActiveListType(
            parent.getListType() === "bullet" ? "bullet" : "number",
          );
        } else {
          setActiveListType(null);
        }
      });
    });
  }, [editor]);

  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  const formatItalic = () =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  const formatUnderline = () =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  const formatStrikethrough = () =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");

  const formatBulletList = () => {
    if (activeListType === "bullet") {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const formatOrderedList = () => {
    if (activeListType === "number") {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const ToolbarBtn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-orange-100 text-orange-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <ToolbarBtn
        active={activeFormats.has("bold")}
        onClick={formatBold}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={activeFormats.has("italic")}
        onClick={formatItalic}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={activeFormats.has("underline")}
        onClick={formatUnderline}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={activeFormats.has("strikethrough")}
        onClick={formatStrikethrough}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>

      {/* Divider */}
      <span className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarBtn
        active={activeListType === "bullet"}
        onClick={formatBulletList}
        title="Bullet list"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={activeListType === "number"}
        onClick={formatOrderedList}
        title="Numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  );
}

// ── HTML output plugin ──────────────────────────────────────────────────────

function HtmlOutputPlugin({ onChange }: { onChange: (html: string) => void }) {
  const handleChange = useCallback(
    (_editorState: EditorState, _editor: LexicalEditor) => {
      _editor.update(() => {
        const html = $generateHtmlFromNodes(_editor, null);
        onChange(html);
      });
    },
    [onChange],
  );

  return <OnChangePlugin onChange={handleChange} />;
}

// ── Content init plugin — clears editor and optionally loads HTML on resetKey change ──

function ContentInitPlugin({
  resetKey,
  initialHtml,
}: {
  resetKey: number;
  initialHtml?: string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      if (initialHtml) {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          if (nodes.length > 0) {
            // $generateNodesFromDOM returns block-level nodes for well-formed HTML
            (nodes as ElementNode[]).forEach((n) => root.append(n));
          } else {
            root.append($createParagraphNode());
          }
        } catch {
          root.append($createParagraphNode());
        }
      } else {
        root.append($createParagraphNode());
      }
    });
    // Only run when resetKey changes (not on every initialHtml string change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

interface RichTextEditorProps {
  /** Called on every change with the HTML string representation */
  onChange: (html: string) => void;
  placeholder?: string;
  /** Bumping this number resets the editor (and loads initialHtml if provided) */
  resetKey?: number;
  /** Pre-fill the editor with this HTML when resetKey changes */
  initialHtml?: string;
  minHeight?: string;
}

const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
  },
  list: {
    ul: "list-disc ml-4 my-1",
    ol: "list-decimal ml-4 my-1",
    listitem: "ml-1",
  },
  paragraph: "mb-1",
};

function onError(error: Error) {
  console.error("[RichTextEditor]", error);
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onChange,
  placeholder = "Write your message here…",
  resetKey = 0,
  initialHtml,
  minHeight = "96px",
}) => {
  const initialConfig = {
    namespace: "NotifyCustomerEditor",
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-400/50 bg-white">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="px-3 py-2 text-sm text-gray-800 focus:outline-none"
                style={{ minHeight }}
                aria-placeholder={placeholder}
                placeholder={
                  <div
                    className="absolute top-2 left-3 text-sm text-gray-400 pointer-events-none select-none"
                    aria-hidden
                  >
                    {placeholder}
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={({ children }) => <>{children}</>}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <HtmlOutputPlugin onChange={onChange} />
        <ContentInitPlugin resetKey={resetKey} initialHtml={initialHtml} />
      </div>
    </LexicalComposer>
  );
};
