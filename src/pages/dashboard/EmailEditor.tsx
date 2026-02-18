import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Mail,
  Send,
  Sparkles,
  FileText,
  Plus,
  X,
  Loader2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Button } from "../../components/ui";
import toast from "react-hot-toast";
import { useEmailTemplateStore } from "../../stores/emailTemplateStore";
import { EmailTemplate, EmailTemplateVariable } from "../../types";
import EmailSendAPI, {
  SendEmailRequest,
  SendTemplateEmailRequest,
} from "../../services/emailSendApi";

// ── New Lexical-based components ──────────────────────────────
import type { LexicalEditorHandle } from "../../components/email/LexicalEditor";
import EditorToolbar from "../../components/email/EditorToolbar";
import LinkModal from "../../components/email/LinkModal";
import ImageModal from "../../components/email/ImageModal";
import TemplatePanel from "../../components/email/TemplatePanel";
import TemplateModal, {
  TemplateFormData,
} from "../../components/email/TemplateModal";
import VariableModal from "../../components/email/VariableModal";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $createParagraphNode,
  $getRoot,
} from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
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
import {
  $generateNodesFromDOM,
} from "@lexical/html";

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

const editorNodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode];

// ── Sub-components ────────────────────────────────────────────
const FieldRow: React.FC<{
  label: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ label, children, last }) => (
  <div className={`flex items-center ${last ? "" : "border-b border-gray-100"}`}>
    <label className="w-[76px] shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-4 py-3.5 pl-5 select-none">
      {label}
    </label>
    <div className="flex-1 flex items-center">{children}</div>
  </div>
);

// ── Editor inner component (needs Lexical context) ────────────
const EmailEditorInner: React.FC<{
  editorRef: React.MutableRefObject<LexicalEditorHandle | null>;
  editorMode: "visual" | "source" | "preview";
  isFullscreen: boolean;
  htmlSource: string;
  setHtmlSource: (v: string) => void;
  previewHtml: string;
  to: string;
  cc: string;
  subject: string;
  charCount: number;
  setCharCount: (n: number) => void;
  setCurrentHtml: (html: string) => void;
  setCurrentText: (text: string) => void;
  onSetMode: (mode: "visual" | "source" | "preview") => void;
  onToggleFullscreen: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  appliedTemplate: EmailTemplate | null;
  onRemoveTemplate: () => void;
  onShowVarModal: () => void;
  templateVarValues: Record<string, string>;
  sending: boolean;
  onSend: () => void;
  onClear: () => void;
}> = ({
  editorRef,
  editorMode,
  isFullscreen,
  htmlSource,
  setHtmlSource,
  previewHtml,
  to,
  cc,
  subject,
  charCount,
  setCharCount,
  setCurrentHtml,
  setCurrentText,
  onSetMode,
  onToggleFullscreen,
  onInsertLink,
  onInsertImage,
  appliedTemplate,
  onRemoveTemplate,
  onShowVarModal,
  templateVarValues,
  sending,
  onSend,
  onClear,
}) => {
  const [editor] = useLexicalComposerContext();

  // Expose editor handle
  useEffect(() => {
    editorRef.current = {
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
      focus: () => editor.focus(),
      getEditor: () => editor,
    };
  }, [editor, editorRef]);

  const handleEditorChange = useCallback(() => {
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      const text = $getRoot().getTextContent();
      setCurrentHtml(html);
      setCurrentText(text);
      setCharCount(text.trim().length);
    });
  }, [editor, setCurrentHtml, setCurrentText, setCharCount]);

  return (
    <>
      {/* Toolbar */}
      <EditorToolbar
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onInsertLink={onInsertLink}
        onInsertImage={onInsertImage}
        editorMode={editorMode}
        onSetMode={onSetMode}
      />

      {/* Editor Area */}
      <div className={`relative ${isFullscreen ? "flex-1 overflow-hidden" : ""}`}>
        {editorMode === "visual" && (
          <>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`lexical-content-editable outline-none focus-visible:outline-none text-[15px] text-gray-800 leading-[1.75] bg-white ${
                    isFullscreen ? "h-full overflow-y-auto" : "min-h-[480px]"
                  } px-8 py-6`}
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    wordBreak: "break-word",
                  }}
                />
              }
              placeholder={
                <div
                  className="absolute top-6 left-8 text-gray-400 pointer-events-none select-none italic text-[15px]"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
            <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange />
          </>
        )}

        {editorMode === "source" && (
          <textarea
            value={htmlSource}
            onChange={(e) => setHtmlSource(e.target.value)}
            className={`w-full outline-none text-xs text-gray-700 font-mono leading-relaxed px-8 py-7 bg-slate-50 resize-none ${
              isFullscreen ? "h-full" : "min-h-[480px]"
            }`}
            spellCheck={false}
          />
        )}

        {editorMode === "preview" && (
          <div className={`bg-gray-50 ${isFullscreen ? "h-full overflow-y-auto" : ""}`}>
            <div className="max-w-2xl mx-auto py-8 px-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-600 w-8">To:</span>
                    <span className="text-gray-700">{to || "—"}</span>
                  </div>
                  {cc && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-600 w-8">Cc:</span>
                      <span className="text-gray-700">{cc}</span>
                    </div>
                  )}
                  <p className="text-base font-bold text-gray-900 pt-1">
                    {subject || "(No Subject)"}
                  </p>
                </div>
                <div
                  className="px-6 py-5 text-sm text-gray-800 leading-relaxed email-preview-content"
                  style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div className="border-t border-gray-200 bg-gray-50/80 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 tabular-nums font-medium">
            {charCount} chars
          </span>
          {appliedTemplate && <span className="w-px h-4 bg-gray-200" />}
          {appliedTemplate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
              <Sparkles className="w-3 h-3" />
              {appliedTemplate.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <Button
            onClick={onSend}
            disabled={sending}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-7 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Main Component ────────────────────────────────────────────
export const EmailEditor: React.FC = () => {
  const editorRef = useRef<LexicalEditorHandle | null>(null);

  // Form state
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);

  // Editor content
  const [currentHtml, setCurrentHtml] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [charCount, setCharCount] = useState(0);

  // UI state
  const [sending, setSending] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "source" | "preview">("visual");
  const [htmlSource, setHtmlSource] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showVarFillModal, setShowVarFillModal] = useState(false);

  // Template state
  const [appliedTemplate, setAppliedTemplate] = useState<EmailTemplate | null>(null);
  const [templateVarValues, setTemplateVarValues] = useState<Record<string, string>>({});
  const [emailType, setEmailType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [templateEditMode, setTemplateEditMode] = useState<"create" | "edit">("create");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData | undefined>();
  const [templateVariables, setTemplateVariables] = useState<EmailTemplateVariable[]>([]);

  // Store
  const {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useEmailTemplateStore();

  useEffect(() => {
    fetchTemplates().catch(() => toast.error("Failed to load email templates"));
  }, [fetchTemplates]);

  // ── Mode switching ──────────────────────────────────────────
  const handleSetMode = useCallback(
    (mode: "visual" | "source" | "preview") => {
      if (mode === "source" && editorMode === "visual") {
        // Going to source: capture current HTML
        if (editorRef.current) {
          setHtmlSource(editorRef.current.getHTML());
        }
      } else if (mode === "visual" && editorMode === "source") {
        // Coming back from source: apply HTML to editor
        if (editorRef.current && htmlSource) {
          editorRef.current.setHTML(htmlSource);
        }
      } else if (mode === "preview") {
        // Capture current HTML for preview
        if (editorMode === "source") {
          setPreviewHtml(htmlSource);
        } else if (editorRef.current) {
          setPreviewHtml(editorRef.current.getHTML());
        }
      }
      setEditorMode(mode);
    },
    [editorMode, htmlSource],
  );

  // ── Link insertion ──────────────────────────────────────────
  const handleInsertLink = useCallback(
    (url: string, text: string) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            const textNode = $createTextNode(text);
            selection.insertNodes([textNode]);
            textNode.select();
          }
        }
      });
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    },
    [],
  );

  // ── Image insertion ─────────────────────────────────────────
  const handleInsertImage = useCallback(
    (url: string, altText: string) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) return;
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imgHtml = `<img src="${url}" alt="${altText}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`;
          const parser = new DOMParser();
          const dom = parser.parseFromString(imgHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          selection.insertNodes(nodes);
        }
      });
    },
    [],
  );

  // ── Template actions ────────────────────────────────────────
  const applyTemplate = (template: EmailTemplate) => {
    if (editorRef.current) {
      editorRef.current.setHTML(template.htmlBody);
      if (template.subject) setSubject(template.subject);
    }
    setAppliedTemplate(template);
    setEmailType(template.category || "OTHER");
    if (template.variables && template.variables.length > 0) {
      const initialVars: Record<string, string> = {};
      template.variables.forEach((v) => {
        initialVars[v.name] = "";
      });
      setTemplateVarValues(initialVars);
      setShowVarFillModal(true);
    } else {
      setTemplateVarValues({});
    }
    setShowTemplates(false);
    toast.success(`"${template.name}" template applied`);
  };

  const handleTemplateEdit = (template: EmailTemplate) => {
    applyTemplate(template);
    setTemplateEditMode("edit");
    setEditingTemplateId(template.id);
    setTemplateFormData({
      name: template.name,
      category: template.category as TemplateFormData["category"],
      description: template.description || "",
      subject: template.subject || "",
    });
    setTemplateVariables(template.variables || []);
    setShowTemplateModal(true);
  };

  const handleTemplateDelete = async (template: EmailTemplate) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
        toast.success("Template deleted");
        await fetchTemplates();
      } catch {
        toast.error("Failed to delete template");
      }
    }
  };

  const openCreateTemplateModal = () => {
    setTemplateEditMode("create");
    setEditingTemplateId(null);
    setTemplateFormData({
      name: "",
      category: "OTHER",
      description: "",
      subject: subject || "",
    });
    setTemplateVariables([]);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (
    data: TemplateFormData,
    variables: EmailTemplateVariable[],
  ) => {
    try {
      const editorHtml = editorRef.current?.getHTML()?.trim() || "";
      const editorText = editorRef.current?.getText()?.trim() || "";

      const templateData = {
        name: data.name.trim(),
        category: data.category,
        description: data.description.trim() || undefined,
        subject: data.subject.trim(),
        htmlBody: editorHtml || `<p>Template: ${data.name.trim()}</p>`,
        textBody: editorText || `Template: ${data.name.trim()}`,
        variables: variables.length > 0 ? variables : undefined,
      };

      if (templateEditMode === "create") {
        await createTemplate(templateData);
        toast.success("Template created!");
      } else if (editingTemplateId) {
        await updateTemplate(editingTemplateId, templateData);
        toast.success("Template updated!");
      }

      await fetchTemplates();
      setShowTemplateModal(false);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${templateEditMode} template`);
    }
  };

  // ── Clear / Send ────────────────────────────────────────────
  const clearEditor = () => {
    editorRef.current?.clear();
    setTo("");
    setToName("");
    setCc("");
    setSubject("");
    setShowCc(false);
    setAppliedTemplate(null);
    setTemplateVarValues({});
    setEmailType("");
    setProjectId("");
    setCharCount(0);
    setCurrentHtml("");
    setCurrentText("");
    toast("Editor cleared", { icon: "🗑️" });
  };

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    const body = editorRef.current?.getHTML() || currentHtml;
    const text = editorRef.current?.getText() || currentText;
    if (!text.trim()) {
      toast.error("Email body cannot be empty");
      return;
    }

    setSending(true);
    try {
      if (appliedTemplate) {
        const payload: SendTemplateEmailRequest = {
          templateName: appliedTemplate.name
            .toLowerCase()
            .replace(/\s+/g, "_"),
          to: to.trim(),
          toName: toName.trim() || undefined,
          variables:
            Object.keys(templateVarValues).length > 0
              ? templateVarValues
              : undefined,
          emailType: emailType || appliedTemplate.category || "OTHER",
          subject: subject.trim(),
          projectId: projectId.trim() || undefined,
        };
        await EmailSendAPI.sendTemplateEmail(payload);
      } else {
        const payload: SendEmailRequest = {
          to: to.trim(),
          toName: toName.trim() || undefined,
          subject: subject.trim(),
          htmlBody: body,
          textBody: text,
          cc: cc.trim() || undefined,
          projectId: projectId.trim() || undefined,
        };
        await EmailSendAPI.sendEmail(payload);
      }
      toast.success("Email sent successfully!");
      clearEditor();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  // ── Lexical initial config ──────────────────────────────────
  const initialConfig = {
    namespace: "GHSEmailEditor",
    theme: editorTheme,
    nodes: editorNodes,
    onError: (error: Error) => {
      console.error("Lexical editor error:", error);
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Composer</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Craft beautifully formatted emails for your clients
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateTemplateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Save as Template
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            Templates
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                showTemplates ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* TEMPLATE PICKER */}
      {showTemplates && (
        <TemplatePanel
          templates={templates}
          isLoading={isLoading}
          error={error}
          onApply={applyTemplate}
          onEdit={handleTemplateEdit}
          onDelete={handleTemplateDelete}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* MAIN EDITOR CARD - wraps the Lexical Composer */}
      <LexicalComposer initialConfig={initialConfig}>
        <div
          className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${
            isFullscreen ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""
          }`}
        >
          {isFullscreen && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
              onClick={() => setIsFullscreen(false)}
            />
          )}

          {/* Addressing Section */}
          <div className="bg-white">
            <FieldRow label="To">
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@email.com"
                className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none focus-visible:outline-none text-gray-800 placeholder:text-gray-400"
              />
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="shrink-0 mr-4 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors focus-visible:outline-none"
                >
                  + Cc
                </button>
              )}
            </FieldRow>

            <FieldRow label="Name">
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Recipient name (optional)"
                className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none focus-visible:outline-none text-gray-800 placeholder:text-gray-400"
              />
            </FieldRow>

            {showCc && (
              <FieldRow label="Cc">
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@email.com"
                  className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none focus-visible:outline-none text-gray-800 placeholder:text-gray-400"
                />
                <button
                  onClick={() => {
                    setShowCc(false);
                    setCc("");
                  }}
                  className="mr-4 p-1 text-gray-300 hover:text-gray-500 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </FieldRow>
            )}

            <FieldRow label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this email about?"
                className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none focus-visible:outline-none text-gray-800 placeholder:text-gray-400 font-medium"
              />
            </FieldRow>

            <FieldRow label="Project" last>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Project ID (optional)"
                className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none focus-visible:outline-none text-gray-800 placeholder:text-gray-400"
              />
            </FieldRow>
          </div>

          {/* Applied Template Badge */}
          {appliedTemplate && (
            <div className="border-y border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-xs font-semibold text-orange-700">
                  Using: {appliedTemplate.name}
                </span>
                {appliedTemplate.variables &&
                  appliedTemplate.variables.length > 0 && (
                    <button
                      onClick={() => setShowVarFillModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      Variables (
                      {
                        Object.values(templateVarValues).filter(Boolean)
                          .length
                      }
                      /{appliedTemplate.variables.length})
                    </button>
                  )}
              </div>
              <button
                onClick={() => {
                  setAppliedTemplate(null);
                  setTemplateVarValues({});
                  setEmailType("");
                  toast("Template detached", { icon: "📧" });
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          )}

          {/* Toolbar + Editor + Footer (needs Lexical context) */}
          <EmailEditorInner
            editorRef={editorRef}
            editorMode={editorMode}
            isFullscreen={isFullscreen}
            htmlSource={htmlSource}
            setHtmlSource={setHtmlSource}
            previewHtml={previewHtml}
            to={to}
            cc={cc}
            subject={subject}
            charCount={charCount}
            setCharCount={setCharCount}
            setCurrentHtml={setCurrentHtml}
            setCurrentText={setCurrentText}
            onSetMode={handleSetMode}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onInsertLink={() => setShowLinkModal(true)}
            onInsertImage={() => setShowImageModal(true)}
            appliedTemplate={appliedTemplate}
            onRemoveTemplate={() => {
              setAppliedTemplate(null);
              setTemplateVarValues({});
              setEmailType("");
            }}
            onShowVarModal={() => setShowVarFillModal(true)}
            templateVarValues={templateVarValues}
            sending={sending}
            onSend={handleSend}
            onClear={clearEditor}
          />
        </div>
      </LexicalComposer>

      {/* ── Modals ─────────────────────────────────────────── */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleInsertLink}
      />

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={handleInsertImage}
      />

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        mode={templateEditMode}
        initialData={templateFormData}
        initialVariables={templateVariables}
        currentSubject={subject}
        onSave={handleSaveTemplate}
      />

      <VariableModal
        isOpen={showVarFillModal}
        onClose={() => setShowVarFillModal(false)}
        template={appliedTemplate}
        values={templateVarValues}
        emailType={emailType}
        onSave={(values, type) => {
          setTemplateVarValues(values);
          setEmailType(type);
        }}
      />

      {/* EDITOR STYLES */}
      <style>{`
        .lexical-editor-root {
          outline: none;
        }
        .lexical-paragraph {
          margin-bottom: 0.65em;
        }
        .lexical-h1 {
          font-size: 1.75em;
          font-weight: 800;
          margin: 1.2em 0 0.5em;
          color: #111827;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .lexical-h2 {
          font-size: 1.35em;
          font-weight: 700;
          margin: 1em 0 0.4em;
          color: #1f2937;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .lexical-h3 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.8em 0 0.3em;
          color: #374151;
          line-height: 1.4;
        }
        .lexical-ul,
        .lexical-ol {
          padding-left: 1.5em;
          margin: 0.65em 0;
        }
        .lexical-li {
          margin-bottom: 0.3em;
          line-height: 1.6;
        }
        .lexical-link {
          color: #ea580c;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .lexical-bold {
          font-weight: 700;
        }
        .lexical-italic {
          font-style: italic;
        }
        .lexical-underline {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .lexical-strikethrough {
          text-decoration: line-through;
        }
        .lexical-code-inline {
          background: #f1f5f9;
          color: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.85em;
        }
        .lexical-blockquote {
          border-left: 3px solid #f97316;
          padding: 12px 20px;
          margin: 16px 0;
          color: #4b5563;
          background: #fff7ed;
          border-radius: 0 10px 10px 0;
          font-style: italic;
        }
        .lexical-code-block {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 0.8em;
          overflow-x: auto;
          line-height: 1.65;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .lexical-content-editable img {
          max-width: 100%;
          border-radius: 10px;
          margin: 12px 0;
        }
        .lexical-content-editable hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 24px 0;
        }
        .email-preview-content p { margin-bottom: 0.65em; }
        .email-preview-content h1 { font-size: 1.75em; font-weight: 800; margin: 1.2em 0 0.5em; color: #111827; }
        .email-preview-content h2 { font-size: 1.35em; font-weight: 700; margin: 1em 0 0.4em; }
        .email-preview-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; }
        .email-preview-content ul, .email-preview-content ol { padding-left: 1.5em; margin: 0.65em 0; }
        .email-preview-content li { margin-bottom: 0.3em; }
        .email-preview-content a { color: #ea580c; text-decoration: underline; }
        .email-preview-content blockquote { border-left: 3px solid #f97316; padding: 12px 20px; margin: 16px 0; color: #4b5563; background: #fff7ed; border-radius: 0 10px 10px 0; }
        .email-preview-content img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
      `}</style>
    </div>
  );
};

export default EmailEditor;
