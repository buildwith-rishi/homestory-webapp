import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  EditorState,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  LexicalEditor as LexicalEditorType,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode as LexicalListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getNearestNodeOfType } from "@lexical/utils";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
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
  Quote,
  Undo2,
  Redo2,
  ChevronDown,
  Type,
} from "lucide-react";
import { Modal } from "../ui";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmailEditorCoreRef {
  setHtml: (html: string) => void;
  getHtml: () => string;
  getTextContent: () => string;
  clear: () => void;
}

interface EmailEditorCoreProps {
  onChange?: (html: string, text: string) => void;
  isFullscreen?: boolean;
  showPreview?: boolean;
  showSource?: boolean;
  htmlSource?: string;
  onHtmlSourceChange?: (html: string) => void;
}

// ── Theme ─────────────────────────────────────────────────────────────────────

const editorTheme = {
  root: "lexical-editor-root",
  paragraph: "lexical-paragraph",
  heading: {
    h1: "lexical-h1",
    h2: "lexical-h2",
    h3: "lexical-h3",
  },
  list: {
    ul: "lexical-ul",
    ol: "lexical-ol",
    listitem: "lexical-li",
    nested: { listitem: "lexical-nested-li" },
  },
  link: "lexical-link",
  text: {
    bold: "lexical-bold",
    italic: "lexical-italic",
    underline: "lexical-underline",
    strikethrough: "lexical-strikethrough",
    code: "lexical-code-inline",
  },
  quote: "lexical-blockquote",
  code: "lexical-code-block",
};

const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

// ── Toolbar sub-components ────────────────────────────────────────────────────

const TBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-100 ${
      disabled
        ? "text-gray-200 cursor-not-allowed"
        : active
          ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`}
  >
    {children}
  </button>
);

const TGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-gray-100/60 rounded-lg">
    {children}
  </div>
);

type BlockType = "paragraph" | "h1" | "h2" | "h3" | "quote" | "ul" | "ol";

const BLOCK_OPTIONS: { value: BlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "quote", label: "Blockquote" },
];

// ── Inner Toolbar (must live inside LexicalComposer) ──────────────────────────

const InnerToolbar: React.FC<{
  isDisabled: boolean;
  onInsertLink: () => void;
  onInsertImage: () => void;
}> = ({ isDisabled, onInsertLink, onInsertImage }) => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);
  const [blockType, setBlockType] = React.useState<BlockType>("paragraph");
  const [showBlockDrop, setShowBlockDrop] = React.useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as BlockType);
    } else if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType(anchorNode, LexicalListNode);
      setBlockType(parentList?.getListType() === "bullet" ? "ul" : "ol");
    } else if (element.getType() === "quote") {
      setBlockType("quote");
    } else {
      setBlockType("paragraph");
    }
  }, []);

  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  React.useEffect(() => {
    if (!showBlockDrop) return;
    const close = () => setShowBlockDrop(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showBlockDrop]);

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
        if (blockType === "ul")
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        else editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (type === "ol") {
        if (blockType === "ol")
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        else editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
    });
    setShowBlockDrop(false);
  };

  const currentBlockLabel =
    BLOCK_OPTIONS.find((b) => b.value === blockType)?.label ?? "Paragraph";

  return (
    <div className="border-b border-gray-100 bg-white px-3 py-2 flex flex-wrap items-center gap-1.5">
      {/* History group */}
      <TGroup>
        <TBtn
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo (⌘Z)"
          disabled={isDisabled}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo (⌘Y)"
          disabled={isDisabled}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </TBtn>
      </TGroup>

      {/* Block type dropdown */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => !isDisabled && setShowBlockDrop(!showBlockDrop)}
          disabled={isDisabled}
          className={`h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold rounded-lg transition-colors border ${
            isDisabled
              ? "text-gray-300 cursor-not-allowed border-transparent"
              : "text-gray-600 hover:bg-gray-100 border-gray-200 hover:border-gray-300 bg-gray-50"
          }`}
        >
          <Type className="w-3 h-3" />
          <span className="min-w-[62px] text-left">{currentBlockLabel}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {showBlockDrop && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 py-1.5 min-w-[160px]">
            {BLOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => formatBlock(opt.value)}
                className={`block w-full text-left px-3.5 py-2 text-xs transition-colors ${
                  blockType === opt.value
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 font-medium"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text format group */}
      <TGroup>
        <TBtn
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          active={isBold}
          title="Bold (⌘B)"
          disabled={isDisabled}
        >
          <Bold className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          active={isItalic}
          title="Italic (⌘I)"
          disabled={isDisabled}
        >
          <Italic className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
          active={isUnderline}
          title="Underline (⌘U)"
          disabled={isDisabled}
        >
          <Underline className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
          active={isStrikethrough}
          title="Strikethrough"
          disabled={isDisabled}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </TBtn>
      </TGroup>

      {/* Alignment group */}
      <TGroup>
        <TBtn
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
          title="Align Left"
          disabled={isDisabled}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
          }
          title="Align Center"
          disabled={isDisabled}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
          }
          title="Align Right"
          disabled={isDisabled}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
          }
          title="Justify"
          disabled={isDisabled}
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </TBtn>
      </TGroup>

      {/* Lists & Quote group */}
      <TGroup>
        <TBtn
          onClick={() => formatBlock("ul")}
          active={blockType === "ul"}
          title="Bullet List"
          disabled={isDisabled}
        >
          <List className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() => formatBlock("ol")}
          active={blockType === "ol"}
          title="Numbered List"
          disabled={isDisabled}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={() => formatBlock("quote")}
          active={blockType === "quote"}
          title="Blockquote"
          disabled={isDisabled}
        >
          <Quote className="w-3.5 h-3.5" />
        </TBtn>
      </TGroup>

      {/* Insert group */}
      <TGroup>
        <TBtn onClick={onInsertLink} title="Insert Link" disabled={isDisabled}>
          <Link2 className="w-3.5 h-3.5" />
        </TBtn>
        <TBtn
          onClick={onInsertImage}
          title="Insert Image"
          disabled={isDisabled}
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </TBtn>
      </TGroup>
    </div>
  );
};

// ── Inner editor (needs LexicalComposer context) ──────────────────────────────

interface InnerEditorProps {
  onChange?: (html: string, text: string) => void;
  isFullscreen?: boolean;
  editorRef: React.RefObject<LexicalEditorType | null>;
}

const InnerEditor: React.FC<InnerEditorProps> = ({
  onChange,
  isFullscreen,
  editorRef,
}) => {
  const [editor] = useLexicalComposerContext();

  // Expose the raw editor instance via the ref
  React.useEffect(() => {
    (editorRef as React.MutableRefObject<LexicalEditorType | null>).current =
      editor;
  }, [editor, editorRef]);

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_editorState: EditorState) => {
      if (!onChange) return;
      editor.update(() => {
        const html = $generateHtmlFromNodes(editor);
        const text = $getRoot().getTextContent();
        onChange(html, text);
      });
    },
    [editor, onChange],
  );

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={`lexical-content-editable outline-none text-[15px] text-gray-800 leading-[1.8] bg-white ${
              isFullscreen ? "h-full overflow-y-auto" : "min-h-[420px]"
            } px-9 py-7`}
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: "break-word",
            }}
          />
        }
        placeholder={
          <div
            className="absolute top-7 left-9 text-gray-300 pointer-events-none select-none text-[15px]"
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Start writing your email…
          </div>
        }
        ErrorBoundary={({ children }) => <>{children}</>}
      />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
    </>
  );
};

// ── Link Modal ────────────────────────────────────────────────────────────────

const LinkInsertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text: string) => void;
}> = ({ isOpen, onClose, onInsert }) => {
  const [url, setUrl] = React.useState("");
  const [text, setText] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setUrl("");
      setText("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Link" size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          const final = url.startsWith("http") ? url : `https://${url}`;
          onInsert(final, text.trim() || final);
          onClose();
        }}
        className="p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Display Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Link text (optional)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
          >
            Insert
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Image Modal ───────────────────────────────────────────────────────────────

const ImageInsertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
}> = ({ isOpen, onClose, onInsert }) => {
  const [url, setUrl] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setUrl("");
      setAlt("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Image" size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          onInsert(url.trim(), alt.trim() || "Image");
          onClose();
        }}
        className="p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Image URL <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Alt Text
          </label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm"
          />
        </div>
        {url.trim() && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-center overflow-hidden">
            <img
              src={url}
              alt={alt || "Preview"}
              className="max-h-32 max-w-full object-contain rounded-lg"
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
          >
            Insert
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── EmailEditorCore ───────────────────────────────────────────────────────────

const EmailEditorCore = forwardRef<EmailEditorCoreRef, EmailEditorCoreProps>(
  (
    {
      onChange,
      isFullscreen = false,
      showPreview = false,
      showSource = false,
      htmlSource = "",
      onHtmlSourceChange,
    },
    ref,
  ) => {
    const lexicalEditorRef = useRef<LexicalEditorType | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // ── Imperative Handle ──────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      setHtml: (html: string) => {
        const editor = lexicalEditorRef.current;
        if (!editor) return;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          if (!html.trim()) {
            root.append($createParagraphNode());
            return;
          }
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          if (nodes.length === 0) {
            const p = $createParagraphNode();
            p.append($createTextNode(html));
            root.append(p);
          } else {
            nodes.forEach((node) => root.append(node));
          }
        });
      },
      getHtml: () => {
        const editor = lexicalEditorRef.current;
        if (!editor) return "";
        let html = "";
        editor.getEditorState().read(() => {
          html = $generateHtmlFromNodes(editor);
        });
        return html;
      },
      getTextContent: () => {
        const editor = lexicalEditorRef.current;
        if (!editor) return "";
        let text = "";
        editor.getEditorState().read(() => {
          text = $getRoot().getTextContent();
        });
        return text;
      },
      clear: () => {
        const editor = lexicalEditorRef.current;
        if (!editor) return;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
      },
    }));

    // ── Link / Image insertion ─────────────────────────────────────────────────

    const handleInsertLink = useCallback((url: string) => {
      const editor = lexicalEditorRef.current;
      if (!editor) return;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }, []);

    const handleInsertImage = useCallback((url: string, alt: string) => {
      const editor = lexicalEditorRef.current;
      if (!editor) return;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.insertText(`[Image: ${alt} - ${url}]`);
        toast("Switch to HTML mode to refine the image tag", {
          icon: "\uD83D\uDDBC\uFE0F",
        });
      });
    }, []);

    // ── Initial config ─────────────────────────────────────────────────────────

    const initialConfig = {
      namespace: "EmailEditorCore",
      theme: editorTheme,
      nodes: editorNodes,
      onError: (error: Error) => console.error("Lexical error:", error),
    };

    const isToolbarDisabled = showSource || showPreview;

    return (
      <>
        <LexicalComposer initialConfig={initialConfig}>
          {/* Formatting Toolbar */}
          <InnerToolbar
            isDisabled={isToolbarDisabled}
            onInsertLink={() => setShowLinkModal(true)}
            onInsertImage={() => setShowImageModal(true)}
          />

          {/* Editor Content Area */}
          <div
            className={`relative ${
              showSource || showPreview ? "hidden" : ""
            } ${isFullscreen ? "flex-1 overflow-hidden" : ""}`}
          >
            <InnerEditor
              onChange={onChange}
              isFullscreen={isFullscreen}
              editorRef={lexicalEditorRef}
            />
          </div>

          {/* Source (HTML) Textarea */}
          {showSource && (
            <textarea
              value={htmlSource}
              onChange={(e) => onHtmlSourceChange?.(e.target.value)}
              spellCheck={false}
              className={`w-full font-mono text-[12.5px] text-emerald-700 bg-gray-950 border-0 outline-none resize-none p-7 leading-relaxed ${
                isFullscreen ? "h-full" : "min-h-[420px]"
              }`}
              placeholder="<p>HTML source…</p>"
              style={{ colorScheme: "dark" }}
            />
          )}
        </LexicalComposer>

        {/* Modals (outside LexicalComposer to avoid context issues) */}
        <LinkInsertModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onInsert={handleInsertLink}
        />
        <ImageInsertModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onInsert={handleInsertImage}
        />
      </>
    );
  },
);

EmailEditorCore.displayName = "EmailEditorCore";

export default EmailEditorCore;
