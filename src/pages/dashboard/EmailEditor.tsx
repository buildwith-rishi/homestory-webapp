import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Mail,
  Send,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Type,
  Palette,
  Minus,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Eye,
  Code,
  ChevronDown,
  Sparkles,
  FileText,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Quote,
  Strikethrough,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Card, Button } from "../../components/ui";
import toast from "react-hot-toast";

// ── Template Gallery ──────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Email",
    icon: "📝",
    content: "",
  },
  {
    id: "project-update",
    name: "Project Update",
    icon: "🏗️",
    content: `<h2 style="color:#1a1a1a;margin-bottom:8px;">Project Update — [Project Name]</h2>
<p>Dear <strong>[Client Name]</strong>,</p>
<p>We're excited to share the latest progress on your project. Here's a quick summary:</p>
<ul>
<li><strong>Current Stage:</strong> [Stage Name]</li>
<li><strong>Progress:</strong> [XX]% complete</li>
<li><strong>Next Milestone:</strong> [Milestone details]</li>
</ul>
<p>Please find the attached photos for reference. We'll keep you updated on the next steps.</p>
<p>Warm regards,<br/><strong>[Your Name]</strong><br/>Good Homestory</p>`,
  },
  {
    id: "welcome",
    name: "Welcome Email",
    icon: "👋",
    content: `<h2 style="color:#1a1a1a;margin-bottom:8px;">Welcome to Good Homestory!</h2>
<p>Dear <strong>[Client Name]</strong>,</p>
<p>Thank you for choosing <strong>Good Homestory</strong> for your home transformation project. We're thrilled to have you on board!</p>
<p>Here's what happens next:</p>
<ol>
<li><strong>Initial Consultation</strong> — Our design team will reach out to schedule a site visit.</li>
<li><strong>Design Phase</strong> — We'll prepare a concept deck tailored to your taste.</li>
<li><strong>Execution</strong> — Our expert team will bring your vision to life.</li>
</ol>
<p>If you have any questions, feel free to reply to this email or call us at <strong>[Phone Number]</strong>.</p>
<p>Best regards,<br/><strong>Team Good Homestory</strong></p>`,
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    icon: "💳",
    content: `<h2 style="color:#1a1a1a;margin-bottom:8px;">Payment Reminder</h2>
<p>Dear <strong>[Client Name]</strong>,</p>
<p>This is a gentle reminder that the next payment milestone for your project <strong>[Project Name]</strong> is approaching.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<tr style="background:#f9fafb;">
<td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Milestone</td>
<td style="padding:8px 12px;border:1px solid #e5e7eb;">[Milestone Name]</td>
</tr>
<tr>
<td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Amount Due</td>
<td style="padding:8px 12px;border:1px solid #e5e7eb;">₹[Amount]</td>
</tr>
<tr style="background:#f9fafb;">
<td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Due Date</td>
<td style="padding:8px 12px;border:1px solid #e5e7eb;">[Date]</td>
</tr>
</table>
<p>Please process the payment at your earliest convenience. If already paid, kindly disregard this reminder.</p>
<p>Thank you,<br/><strong>Good Homestory Finance Team</strong></p>`,
  },
  {
    id: "completion",
    name: "Project Completed",
    icon: "🎉",
    content: `<h2 style="color:#1a1a1a;margin-bottom:8px;">🎉 Your Project is Complete!</h2>
<p>Dear <strong>[Client Name]</strong>,</p>
<p>We're delighted to inform you that your project <strong>[Project Name]</strong> has been successfully completed!</p>
<p>It has been a wonderful journey working with you. We hope the final result exceeds your expectations.</p>
<p><strong>Next Steps:</strong></p>
<ul>
<li>A final walkthrough will be scheduled at your convenience.</li>
<li>Any snag-list items will be addressed within the warranty period.</li>
<li>We'd love to hear your feedback — it means the world to us!</li>
</ul>
<p>Thank you for trusting Good Homestory with your home. 🏡</p>
<p>With gratitude,<br/><strong>Team Good Homestory</strong></p>`,
  },
];

// ── Font sizes ────────────────────────────────────────────────────
const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];

// ── Colors ────────────────────────────────────────────────────────
const PRESET_COLORS = [
  "#000000",
  "#374151",
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export const EmailEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Track active formatting states
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Update char count & active formats on selection/input change
  const updateEditorState = useCallback(() => {
    if (editorRef.current) {
      setCharCount(editorRef.current.innerText.trim().length);
    }
    // Check active formats
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough"))
      formats.add("strikethrough");
    if (document.queryCommandState("justifyLeft")) formats.add("alignLeft");
    if (document.queryCommandState("justifyCenter")) formats.add("alignCenter");
    if (document.queryCommandState("justifyRight")) formats.add("alignRight");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateEditorState);
    return () =>
      document.removeEventListener("selectionchange", updateEditorState);
  }, [updateEditorState]);

  // ── execCommand helpers ───────────────────────────────────────
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateEditorState();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  };

  const insertHR = () => {
    exec(
      "insertHTML",
      "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>",
    );
  };

  const formatBlock = (tag: string) => {
    exec("formatBlock", tag);
  };

  const setFontSize = (size: string) => {
    // Use CSS approach for font sizing since execCommand fontSize is limited
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      exec(
        "insertHTML",
        `<span style="font-size:${size}">${sel.toString()}</span>`,
      );
    }
    setShowFontSize(false);
  };

  const setTextColor = (color: string) => {
    exec("foreColor", color);
    setShowTextColor(false);
  };

  const setBackgroundColor = (color: string) => {
    exec("hiliteColor", color);
    setShowBgColor(false);
  };

  const insertBlockquote = () => {
    exec(
      "insertHTML",
      `<blockquote style="border-left:3px solid #f97316;padding:8px 16px;margin:12px 0;color:#4b5563;background:#fff7ed;border-radius:0 8px 8px 0;">Quote text here</blockquote>`,
    );
  };

  // ── Template apply ────────────────────────────────────────────
  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[0]) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      updateEditorState();
    }
    setShowTemplates(false);
    toast.success(`"${template.name}" template applied`);
  };

  // ── Source ↔ Visual toggle ────────────────────────────────────
  const toggleSource = () => {
    if (showSource) {
      // Going back to visual → apply source changes
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlSource;
      }
      setShowSource(false);
    } else {
      // Going to source
      if (editorRef.current) {
        setHtmlSource(editorRef.current.innerHTML);
      }
      setShowSource(true);
    }
  };

  // ── Preview ───────────────────────────────────────────────────
  const getPreviewHtml = () => {
    return editorRef.current?.innerHTML || "";
  };

  // ── Clear ─────────────────────────────────────────────────────
  const clearEditor = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      updateEditorState();
    }
    setTo("");
    setCc("");
    setSubject("");
    setShowCc(false);
    toast("Editor cleared", { icon: "🗑️" });
  };

  // ── Copy HTML ─────────────────────────────────────────────────
  const copyHtml = () => {
    const html = editorRef.current?.innerHTML || "";
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
  };

  // ── Send email ────────────────────────────────────────────────
  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    const body = editorRef.current?.innerHTML || "";
    if (!body.trim() || body === "<br>") {
      toast.error("Email body cannot be empty");
      return;
    }
    setSending(true);
    try {
      // Simulate sending — replace with actual API call
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Email sent successfully!");
      clearEditor();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  // ── Toolbar button helper ─────────────────────────────────────
  const ToolbarBtn: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ onClick, active, title, children, className = "" }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
        active
          ? "bg-orange-100 text-orange-600 shadow-sm"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      } ${className}`}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            Email Composer
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Craft beautifully formatted emails for your clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            Templates
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showTemplates ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Template Picker */}
      {showTemplates && (
        <Card className="p-4 rounded-2xl border-orange-200 bg-orange-50/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Quick Templates
            </h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {EMAIL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-center group shadow-sm"
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-orange-700">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Editor Card */}
      <Card
        className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50 flex flex-col" : ""
        }`}
      >
        {/* Fullscreen overlay backdrop */}
        {isFullscreen && (
          <div
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => setIsFullscreen(false)}
          />
        )}

        {/* ── Addressing fields ──────────────────────────── */}
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center border-b border-gray-100">
            <span className="w-16 text-xs font-semibold text-gray-400 uppercase text-right pr-3 py-3 pl-4">
              To
            </span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="flex-1 py-3 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="mr-4 text-xs text-orange-500 font-medium hover:text-orange-600"
              >
                + Cc
              </button>
            )}
          </div>
          {showCc && (
            <div className="flex items-center border-b border-gray-100">
              <span className="w-16 text-xs font-semibold text-gray-400 uppercase text-right pr-3 py-3 pl-4">
                Cc
              </span>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@email.com"
                className="flex-1 py-3 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
              />
              <button
                onClick={() => {
                  setShowCc(false);
                  setCc("");
                }}
                className="mr-4 text-gray-300 hover:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center">
            <span className="w-16 text-xs font-semibold text-gray-400 uppercase text-right pr-3 py-3 pl-4">
              Subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="flex-1 py-3 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300 font-medium"
            />
          </div>
        </div>

        {/* ── Toolbar ────────────────────────────────────── */}
        <div className="border-b border-gray-100 bg-white px-3 py-1.5 flex flex-wrap items-center gap-0.5">
          {/* Undo / Redo */}
          <ToolbarBtn onClick={() => exec("undo")} title="Undo">
            <Undo2 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => exec("redo")} title="Redo">
            <Redo2 className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Block format */}
          <div className="relative">
            <select
              onChange={(e) => {
                formatBlock(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="h-8 pl-2 pr-6 text-xs text-gray-600 bg-transparent border border-gray-200 rounded-md appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="" disabled>
                Format
              </option>
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="pre">Code Block</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <Divider />

          {/* Font size */}
          <div className="relative">
            <ToolbarBtn
              onClick={() => {
                setShowFontSize(!showFontSize);
                setShowTextColor(false);
                setShowBgColor(false);
              }}
              title="Font Size"
            >
              <Type className="w-4 h-4" />
            </ToolbarBtn>
            {showFontSize && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 min-w-[100px]">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Text style */}
          <ToolbarBtn
            onClick={() => exec("bold")}
            active={activeFormats.has("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("italic")}
            active={activeFormats.has("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("underline")}
            active={activeFormats.has("underline")}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("strikeThrough")}
            active={activeFormats.has("strikethrough")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Text color */}
          <div className="relative">
            <ToolbarBtn
              onClick={() => {
                setShowTextColor(!showTextColor);
                setShowFontSize(false);
                setShowBgColor(false);
              }}
              title="Text Color"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold leading-none">A</span>
                <div className="w-4 h-1 rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-green-500 mt-0.5" />
              </div>
            </ToolbarBtn>
            {showTextColor && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-2 w-[180px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-1">
                  Text Color
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Background color */}
          <div className="relative">
            <ToolbarBtn
              onClick={() => {
                setShowBgColor(!showBgColor);
                setShowFontSize(false);
                setShowTextColor(false);
              }}
              title="Highlight Color"
            >
              <Palette className="w-4 h-4" />
            </ToolbarBtn>
            {showBgColor && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-2 w-[180px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-1">
                  Highlight
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    "transparent",
                    "#fef9c3",
                    "#fce7f3",
                    "#dbeafe",
                    "#d1fae5",
                    "#fde68a",
                    "#e0e7ff",
                    "#fecaca",
                    "#ccfbf1",
                    "#f3e8ff",
                    "#cffafe",
                    "#fef3c7",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBackgroundColor(c)}
                      className={`w-6 h-6 rounded-md border hover:scale-110 transition-transform ${c === "transparent" ? "border-dashed border-gray-300 bg-white" : "border-gray-200"}`}
                      style={c !== "transparent" ? { backgroundColor: c } : {}}
                      title={c === "transparent" ? "None" : c}
                    >
                      {c === "transparent" && (
                        <X className="w-3 h-3 text-gray-300 mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Alignment */}
          <ToolbarBtn
            onClick={() => exec("justifyLeft")}
            active={activeFormats.has("alignLeft")}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("justifyCenter")}
            active={activeFormats.has("alignCenter")}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("justifyRight")}
            active={activeFormats.has("alignRight")}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Lists */}
          <ToolbarBtn
            onClick={() => exec("insertUnorderedList")}
            active={activeFormats.has("ul")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => exec("insertOrderedList")}
            active={activeFormats.has("ol")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Insert */}
          <ToolbarBtn onClick={insertLink} title="Insert Link">
            <Link2 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={insertImage} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={insertHR} title="Horizontal Line">
            <Minus className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={insertBlockquote} title="Blockquote">
            <Quote className="w-4 h-4" />
          </ToolbarBtn>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Utility buttons */}
          <ToolbarBtn
            onClick={toggleSource}
            active={showSource}
            title={showSource ? "Visual Editor" : "View Source"}
          >
            <Code className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => setShowPreview(!showPreview)}
            active={showPreview}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={copyHtml} title="Copy HTML">
            <Copy className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </ToolbarBtn>
        </div>

        {/* ── Editor Area ────────────────────────────────── */}
        <div
          className={`relative ${isFullscreen ? "flex-1 overflow-hidden" : ""}`}
        >
          {/* Visual Editor */}
          {!showSource && !showPreview && (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={updateEditorState}
              className={`outline-none text-sm text-gray-800 leading-relaxed ${
                isFullscreen ? "h-full overflow-y-auto" : "min-h-[420px]"
              } px-6 py-5`}
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                wordBreak: "break-word",
              }}
              data-placeholder="Start writing your email…"
            />
          )}

          {/* Source View */}
          {showSource && !showPreview && (
            <textarea
              value={htmlSource}
              onChange={(e) => setHtmlSource(e.target.value)}
              className={`w-full outline-none text-xs text-gray-700 font-mono leading-relaxed px-6 py-5 bg-gray-50 resize-none ${
                isFullscreen ? "h-full" : "min-h-[420px]"
              }`}
              spellCheck={false}
            />
          )}

          {/* Preview */}
          {showPreview && (
            <div className={`${isFullscreen ? "h-full overflow-y-auto" : ""}`}>
              <div className="max-w-2xl mx-auto py-6 px-6">
                <div className="bg-gray-100 rounded-xl p-1">
                  {/* Simulated email chrome */}
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 px-5 py-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">To:</span>
                        <span>{to || "—"}</span>
                      </div>
                      {cc && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">Cc:</span>
                          <span>{cc}</span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900">
                        {subject || "(No Subject)"}
                      </p>
                    </div>
                    <div
                      className="px-5 py-4 text-sm text-gray-800 leading-relaxed"
                      style={{
                        fontFamily: "'Inter', -apple-system, sans-serif",
                      }}
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer / Status Bar ──────────────────────── */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-gray-400">
              {charCount} characters
            </span>
            {showSource && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Code className="w-3 h-3" />
                HTML Source
              </span>
            )}
            {showPreview && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3" />
                Preview Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Placeholder styling for empty contentEditable */}
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #d1d5db;
          pointer-events: none;
          display: block;
        }
        [contenteditable] a {
          color: #f97316;
          text-decoration: underline;
        }
        [contenteditable] h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #111827; }
        [contenteditable] h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.5rem; color: #1f2937; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.375rem; color: #374151; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] li { margin-bottom: 0.25rem; }
        [contenteditable] blockquote { border-left: 3px solid #f97316; padding: 8px 16px; margin: 12px 0; color: #4b5563; background: #fff7ed; border-radius: 0 8px 8px 0; }
        [contenteditable] pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 0.8rem; overflow-x: auto; }
        [contenteditable] table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #e5e7eb; padding: 8px 12px; }
        [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        [contenteditable] hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
      `}</style>
    </div>
  );
};

export default EmailEditor;
