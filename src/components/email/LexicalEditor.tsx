import React, { forwardRef, useImperativeHandle, useEffect } from "react";
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
  LexicalEditor as LexicalEditorType,
  EditorState,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical";

// ── Theme ─────────────────────────────────────────────────────
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

// ── Editor Nodes ──────────────────────────────────────────────
const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

// ── Ref Handle ────────────────────────────────────────────────
export interface LexicalEditorHandle {
  getHTML: () => string;
  getText: () => string;
  setHTML: (html: string) => void;
  clear: () => void;
  focus: () => void;
  getEditor: () => LexicalEditorType;
}

// ── Inner component that has access to editor context ─────────
const EditorInner = forwardRef<
  LexicalEditorHandle,
  {
    onChange?: (html: string, text: string) => void;
    placeholder?: string;
    isFullscreen?: boolean;
  }
>(({ onChange, placeholder, isFullscreen }, ref) => {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(ref, () => ({
    getHTML: () => {
      let html = "";
      editor.update(() => {
        html = $generateHtmlFromNodes(editor);
      });
      return html;
    },
    getText: () => {
      let text = "";
      editor.update(() => {
        text = $getRoot().getTextContent();
      });
      return text;
    },
    setHTML: (html: string) => {
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
    clear: () => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
    },
    focus: () => {
      editor.focus();
    },
    getEditor: () => editor,
  }));

  const handleChange = (_editorState: EditorState) => {
    if (!onChange) return;
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      const text = $getRoot().getTextContent();
      onChange(html, text);
    });
  };

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={`lexical-content-editable outline-none text-[15px] text-gray-800 leading-[1.75] bg-white ${
              isFullscreen ? "h-full overflow-y-auto" : "min-h-[480px]"
            } px-8 py-6`}
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: "break-word",
            }}
          />
        }
        placeholder={
          <div
            className="absolute top-6 left-8 text-gray-400 pointer-events-none select-none italic text-[15px]"
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {placeholder || "Start writing your email…"}
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
});
EditorInner.displayName = "EditorInner";

// ── Main Editor Wrapper ───────────────────────────────────────
interface LexicalEditorProps {
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  isFullscreen?: boolean;
}

const LexicalEditorComponent = forwardRef<
  LexicalEditorHandle,
  LexicalEditorProps
>(({ onChange, placeholder, isFullscreen }, ref) => {
  const initialConfig = {
    namespace: "EmailEditor",
    theme: editorTheme,
    nodes: editorNodes,
    onError: (error: Error) => {
      console.error("Lexical editor error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`relative ${isFullscreen ? "flex-1 overflow-hidden" : ""}`}>
        <EditorInner
          ref={ref}
          onChange={onChange}
          placeholder={placeholder}
          isFullscreen={isFullscreen}
        />
      </div>
    </LexicalComposer>
  );
});
LexicalEditorComponent.displayName = "LexicalEditorComponent";

export default LexicalEditorComponent;
