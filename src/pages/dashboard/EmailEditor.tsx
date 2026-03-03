import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Mail,
  Send,
  Copy,
  Trash2,
  Sparkles,
  FileText,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Pen,
  Code,
  ChevronDown,
  AtSign,
  User,
  Type,
  Hash,
  Users,
  Clock,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEmailTemplateStore } from "../../stores/emailTemplateStore";
import { EmailTemplate } from "../../types";
import EmailSendAPI, {
  SendEmailRequest,
  SendTemplateEmailRequest,
} from "../../services/emailSendApi";
import EmailEditorCore, {
  EmailEditorCoreRef,
} from "../../components/email/EmailEditorCore";

// ── Constants ─────────────────────────────────────────────────────
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

const HIGHLIGHT_COLORS = [
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
];

const CATEGORY_EMOJI: Record<string, string> = {
  ONBOARDING: "\u{1f44b}",
  PROJECT_UPDATE: "\u{1f3d7}\ufe0f",
  PAYMENT: "\u{1f4b3}",
  COMPLETION: "\u{1f389}",
  OTHER: "\u{1f4e7}",
  OCCASION: "\u{1f382}",
  FOLLOW_UP: "\u{1f501}",
};

// ── Starter templates (pre-populated body + subject per category) ──
const STARTER_TEMPLATES: Record<
  string,
  { subject: string; category: string; html: string }
> = {
  ONBOARDING: {
    subject: "Welcome to GoodHomeStory, {{customerName}}! \ud83c\udfe0",
    category: "ONBOARDING",
    html: [
      "<h2>Welcome aboard, {{customerName}}! \ud83d\udc4b</h2>",
      "<p>We\u2019re thrilled to have you with us. Your project <strong>{{projectName}}</strong> has been set up and our team is ready to get started.</p>",
      "<p>Here\u2019s what happens next:</p>",
      "<ul>",
      "<li>Our project manager will reach out within <strong>24 hours</strong> to confirm the schedule.</li>",
      "<li>You\u2019ll receive a detailed project timeline by end of week.</li>",
      "<li>Feel free to reply to this email with any questions.</li>",
      "</ul>",
      "<p>We look forward to transforming your space!<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  PROJECT_UPDATE: {
    subject: "Project Update: {{projectName}} \ud83d\udcd0",
    category: "PROJECT_UPDATE",
    html: [
      "<h2>Project Update \ud83c\udfd7\ufe0f</h2>",
      "<p>Hi {{customerName}},</p>",
      "<p>Here\u2019s the latest update on <strong>{{projectName}}</strong>:</p>",
      "<p><strong>Completed this week:</strong><br/>{{completedWork}}</p>",
      "<p><strong>Upcoming next:</strong><br/>{{upcomingWork}}</p>",
      "<p><strong>Current completion:</strong> {{completionPercentage}}%</p>",
      "<p>Reach out any time if you have questions.<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  PAYMENT: {
    subject: "Payment Confirmation \u2014 {{projectName}}",
    category: "PAYMENT",
    html: [
      "<h2>Payment Received \ud83d\udcb3</h2>",
      "<p>Hi {{customerName}},</p>",
      "<p>We\u2019ve successfully received your payment of <strong>{{amount}}</strong> for <strong>{{projectName}}</strong>.</p>",
      "<p><strong>Transaction ID:</strong> {{transactionId}}<br/>",
      "<strong>Date:</strong> {{paymentDate}}</p>",
      "<p>A detailed invoice has been attached to this email for your records.</p>",
      "<p>Thank you for your trust.<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  COMPLETION: {
    subject: "\ud83c\udf89 Your Project is Complete \u2014 {{projectName}}",
    category: "OTHER",
    html: [
      "<h2>Project Complete! \ud83c\udf89</h2>",
      "<p>Hi {{customerName}},</p>",
      "<p>We\u2019re excited to let you know that <strong>{{projectName}}</strong> is officially complete!</p>",
      "<p>It was a pleasure working with you. We\u2019d love to hear your feedback \u2014 a quick review helps us serve future clients better.</p>",
      '<p>\ud83d\udc49 <a href="{{reviewLink}}">Leave a review</a></p>',
      "<p>Don\u2019t hesitate to reach out for future projects.<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  FOLLOW_UP: {
    subject: "Following up on {{projectName}}",
    category: "FOLLOW_UP",
    html: [
      "<h2>Quick Follow-up \ud83d\udd01</h2>",
      "<p>Hi {{customerName}},</p>",
      "<p>Just checking in on <strong>{{projectName}}</strong>. We wanted to make sure everything is going smoothly and you\u2019re happy with the progress so far.</p>",
      "<p>If you have any questions, concerns, or feedback, please don\u2019t hesitate to reply to this email.</p>",
      "<p>Looking forward to hearing from you!<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  OCCASION: {
    subject: "\ud83c\udf82 Happy {{occasion}}, {{customerName}}!",
    category: "OCCASION",
    html: [
      "<h2>Happy {{occasion}}, {{customerName}}! \ud83c\udf82</h2>",
      "<p>From all of us at GoodHomeStory, we wish you a wonderful {{occasion}}!</p>",
      "<p>As a valued client, we\u2019re grateful for your trust and look forward to serving you again soon.</p>",
      "<p>Warm wishes,<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
  OTHER: {
    subject: "Hello {{customerName}}",
    category: "OTHER",
    html: [
      "<h2>Hi {{customerName}},</h2>",
      "<p>Thank you for being a valued GoodHomeStory client.</p>",
      "<p>{{messageBody}}</p>",
      "<p>Feel free to reply to this email if you have any questions.<br/>\u2014 The GoodHomeStory Team</p>",
    ].join(""),
  },
};

// ── Sub-components ────────────────────────────────────────────────

const FieldRow: React.FC<{
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
  focused?: boolean;
}> = ({ label, icon, children, last, focused }) => (
  <div
    className={`group flex items-center transition-all duration-150 ${
      focused ? "bg-gray-50/70" : "hover:bg-gray-50/60"
    } ${last ? "" : "border-b border-gray-100"}`}
  >
    <div
      className={`w-14 shrink-0 flex items-center justify-center py-4 transition-colors duration-150 ${
        focused ? "text-gray-500" : "text-gray-300 group-hover:text-gray-400"
      }`}
    >
      {icon}
    </div>
    <label
      className={`w-[52px] shrink-0 text-[10px] font-bold uppercase tracking-wider select-none transition-colors duration-150 ${
        focused ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
      }`}
    >
      {label}
    </label>
    <div className="flex-1 flex items-center">{children}</div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────
export const EmailEditor: React.FC = () => {
  const editorRef = useRef<EmailEditorCoreRef>(null);
  const templateEditorRef = useRef<EmailEditorCoreRef>(null);

  // Form state
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);

  // UI state
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [currentHtml, setCurrentHtml] = useState("");

  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [templateVarValues, setTemplateVarValues] = useState<
    Record<string, string>
  >({});
  const [showVarFillModal, setShowVarFillModal] = useState(false);
  const [emailType, setEmailType] = useState("");
  const [templateEditMode, setTemplateEditMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    category: "OTHER" as
      | "ONBOARDING"
      | "PROJECT_UPDATE"
      | "PAYMENT"
      | "FOLLOW_UP"
      | "OCCASION"
      | "OTHER",
    description: "",
    subject: "",
  });
  const [templateBodyHtml, setTemplateBodyHtml] = useState("");

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

  // ── Effects ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchTemplates().catch(() => toast.error("Failed to load email templates"));
  }, [fetchTemplates]);

  // Populate embedded template editor after modal opens
  useEffect(() => {
    if (!showTemplateModal) return;
    const timer = setTimeout(() => {
      templateEditorRef.current?.setHtml(templateBodyHtml);
    }, 80);
    return () => clearTimeout(timer);
  }, [showTemplateModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle editor content changes
  const handleEditorChange = useCallback((html: string, text: string) => {
    setCurrentHtml(html);
    setCharCount(text.trim().length);
  }, []);

  // ── Template actions ────────────────────────────────────────────

  const applyTemplate = (template: EmailTemplate) => {
    if (editorRef.current) {
      editorRef.current.setHtml(template.htmlBody);
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

  // ── Source / Preview toggles ────────────────────────────────────

  const toggleSource = () => {
    if (showSource) {
      if (editorRef.current) editorRef.current.setHtml(htmlSource);
      setShowSource(false);
    } else {
      if (editorRef.current) setHtmlSource(editorRef.current.getHtml());
      setShowSource(true);
    }
  };

  const getPreviewHtml = () => currentHtml;

  // ── Clear / Copy / Send ─────────────────────────────────────────

  const clearEditor = () => {
    if (editorRef.current) {
      editorRef.current.clear();
    }
    setTo("");
    setToName("");
    setCc("");
    setSubject("");
    setShowCc(false);
    setAppliedTemplate(null);
    setTemplateVarValues({});
    setEmailType("");
    setCurrentHtml("");
    setCharCount(0);
    toast("Editor cleared", { icon: "\ud83d\uddd1\ufe0f" });
  };

  const copyHtml = () => {
    const html = editorRef.current?.getHtml() || "";
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
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
    const body = editorRef.current?.getHtml() || "";
    const textBody = editorRef.current?.getTextContent() || "";
    if (!body.trim() || body === "<br>") {
      toast.error("Email body cannot be empty");
      return;
    }

    setSending(true);
    try {
      if (appliedTemplate) {
        const payload: SendTemplateEmailRequest = {
          templateName: appliedTemplate.name.toLowerCase().replace(/\s+/g, "_"),
          to: to.trim(),
          toName: toName.trim() || undefined,
          variables:
            Object.keys(templateVarValues).length > 0
              ? templateVarValues
              : undefined,
          emailType: emailType || appliedTemplate.category || "OTHER",
          subject: subject.trim(),
        };
        await EmailSendAPI.sendTemplateEmail(payload);
      } else {
        const payload: SendEmailRequest = {
          to: to.trim(),
          toName: toName.trim() || undefined,
          subject: subject.trim(),
          htmlBody: body,
          textBody: textBody,
          cc: cc.trim() || undefined,
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

  // ── Template modal helpers ──────────────────────────────────────

  const resetTemplateModal = () => {
    setShowTemplateModal(false);
    setTemplateFormData({
      name: "",
      category: "OTHER",
      description: "",
      subject: "",
    });
    setTemplateBodyHtml("");
    setEditingTemplateId(null);
  };

  const openCreateTemplateModal = () => {
    setTemplateEditMode("create");
    setEditingTemplateId(null);

    // If the composer already has content, use that; otherwise load a starter
    const capturedHtml = editorRef.current?.getHtml().trim() || "";
    const isEmpty =
      !capturedHtml ||
      capturedHtml === "<br>" ||
      capturedHtml === "<p></p>" ||
      capturedHtml === "<p><br></p>";

    // Pick the best-guess category from a starter based on current subject keywords
    const guessCategory = (): keyof typeof STARTER_TEMPLATES => {
      const s = (subject || "").toLowerCase();
      if (s.includes("welcome") || s.includes("onboard")) return "ONBOARDING";
      if (s.includes("update") || s.includes("progress"))
        return "PROJECT_UPDATE";
      if (s.includes("payment") || s.includes("invoice")) return "PAYMENT";
      if (s.includes("complet") || s.includes("done") || s.includes("finish"))
        return "COMPLETION";
      if (s.includes("follow")) return "FOLLOW_UP";
      if (
        s.includes("happy") ||
        s.includes("birthday") ||
        s.includes("occasion")
      )
        return "OCCASION";
      return "ONBOARDING"; // default to most common
    };

    const defaultCategory = guessCategory();
    const starter = STARTER_TEMPLATES[defaultCategory];

    setTemplateBodyHtml(isEmpty ? starter.html : capturedHtml);
    setTemplateFormData({
      name: "",
      category: defaultCategory as typeof templateFormData.category,
      description: "",
      subject: subject.trim() || starter.subject,
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateFormData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!templateFormData.subject.trim()) {
      toast.error("Please add a subject line");
      return;
    }

    try {
      const htmlBody =
        templateEditorRef.current?.getHtml().trim() ||
        templateBodyHtml ||
        `<p>Template: ${templateFormData.name.trim()}</p>`;
      const textBody =
        templateEditorRef.current?.getTextContent().trim() ||
        `Template: ${templateFormData.name.trim()}`;

      // Auto-detect {{variable}} placeholders from subject + body
      const varRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      const detected = new Set<string>();
      let m;
      const combined = htmlBody + " " + templateFormData.subject;
      while ((m = varRegex.exec(combined)) !== null) detected.add(m[1]);
      const variables =
        detected.size > 0
          ? Array.from(detected).map((name) => ({
              name,
              required: false,
              description: "",
            }))
          : undefined;

      const templateData = {
        name: templateFormData.name.trim(),
        category: templateFormData.category,
        subject: templateFormData.subject.trim(),
        htmlBody,
        textBody,
        variables,
      };

      if (templateEditMode === "create") {
        await createTemplate(templateData);
        toast.success("Template created!");
      } else if (editingTemplateId) {
        await updateTemplate(editingTemplateId, templateData);
        toast.success("Template updated!");
      }

      await fetchTemplates();
      resetTemplateModal();
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${templateEditMode} template`);
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  // Track focused field for FieldRow highlight
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const readingTimeMinutes = Math.max(1, Math.ceil(charCount / 1000));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* PAGE HEADER */}
      <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl px-7 py-5 shadow-sm">
        {/* Subtle decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-orange-300/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Email Composer
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-semibold text-orange-600">
                  <Sparkles className="w-2.5 h-2.5" />
                  Pro
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Craft beautifully formatted emails for your clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Stats pill */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold text-gray-700">
                  {templates.length}
                </span>
                <span>templates</span>
              </div>
              <div className="w-px h-3.5 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Hash className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold text-gray-700">{charCount}</span>
                <span>chars</span>
              </div>
            </div>

            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                showTemplates
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <Layers className="w-4 h-4" />
              Templates
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${showTemplates ? "rotate-180" : ""}`}
              />
            </button>

            <button
              onClick={openCreateTemplateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
            >
              <Plus className="w-4 h-4" />
              Save as Template
            </button>
          </div>
        </div>
      </div>

      {/* TEMPLATE PICKER */}
      {showTemplates && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Quick Templates
                </h3>
                <p className="text-[11px] text-gray-400">
                  {templates.length} templates available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateTemplateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Template
              </button>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500 mr-2" />
                <span className="text-sm text-gray-500">
                  Loading templates...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500 text-sm gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  No templates yet
                </p>
                <p className="text-xs mt-1 text-gray-400">
                  Save your first email template to see it here
                </p>
                <button
                  onClick={openCreateTemplateModal}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {templates.map((t) => {
                  const categoryColors: Record<string, string> = {
                    ONBOARDING: "from-blue-50 to-indigo-50 border-blue-100",
                    PROJECT_UPDATE:
                      "from-amber-50 to-yellow-50 border-amber-100",
                    PAYMENT: "from-green-50 to-emerald-50 border-green-100",
                    COMPLETION: "from-purple-50 to-violet-50 border-purple-100",
                    OCCASION: "from-pink-50 to-rose-50 border-pink-100",
                    FOLLOW_UP: "from-cyan-50 to-teal-50 border-cyan-100",
                    OTHER: "from-gray-50 to-slate-50 border-gray-100",
                  };
                  const colorClass =
                    categoryColors[t.category] || categoryColors.OTHER;
                  return (
                    <div
                      key={t.id}
                      className={`relative group bg-gradient-to-br ${colorClass} rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer`}
                      onClick={() => applyTemplate(t)}
                    >
                      <div className="p-3.5 flex flex-col items-center gap-2 text-center">
                        <span className="text-2xl">
                          {CATEGORY_EMOJI[t.category] || "📧"}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-700 line-clamp-2 leading-tight">
                          {t.name}
                        </span>
                        {t.subject && (
                          <span className="text-[10px] text-gray-400 line-clamp-1 w-full">
                            {t.subject}
                          </span>
                        )}
                      </div>
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 rounded-xl">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            applyTemplate(t);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-md"
                        >
                          Apply
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplateEditMode("edit");
                            setEditingTemplateId(t.id);
                            setTemplateFormData({
                              name: t.name,
                              category: t.category as any,
                              description: t.description || "",
                              subject: t.subject || "",
                            });
                            setTemplateBodyHtml(t.htmlBody || "");
                            setShowTemplateModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pen className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(`Delete template "${t.name}"?`)
                            ) {
                              try {
                                await deleteTemplate(t.id);
                                toast.success("Template deleted");
                                await fetchTemplates();
                              } catch {
                                toast.error("Failed to delete template");
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN EDITOR CARD */}
      <div
        className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""
        }`}
      >
        {isFullscreen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
            onClick={() => setIsFullscreen(false)}
          />
        )}

        {/* Addressing Section */}
        <div className="divide-y divide-gray-100">
          <FieldRow
            label="To"
            icon={<AtSign className="w-4 h-4" />}
            focused={focusedField === "to"}
          >
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onFocus={() => setFocusedField("to")}
              onBlur={() => setFocusedField(null)}
              placeholder="recipient@email.com"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="mr-4 text-[11px] font-bold text-gray-400 hover:text-orange-500 transition-colors px-2.5 py-1 rounded-lg hover:bg-orange-50"
              >
                + Cc
              </button>
            )}
          </FieldRow>

          <FieldRow
            label="Name"
            icon={<User className="w-4 h-4" />}
            focused={focusedField === "name"}
          >
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder="Recipient name (optional)"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
            />
          </FieldRow>

          {showCc && (
            <FieldRow
              label="Cc"
              icon={<Users className="w-4 h-4" />}
              focused={focusedField === "cc"}
            >
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                onFocus={() => setFocusedField("cc")}
                onBlur={() => setFocusedField(null)}
                placeholder="cc@email.com"
                className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
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

          <FieldRow
            label="Subject"
            icon={<Type className="w-4 h-4" />}
            focused={focusedField === "subject"}
            last
          >
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setFocusedField("subject")}
              onBlur={() => setFocusedField(null)}
              placeholder="What's this email about?"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-300 font-semibold"
            />
            {subject && (
              <span className="mr-4 text-[10px] font-medium text-gray-300 tabular-nums">
                {subject.length} chars
              </span>
            )}
          </FieldRow>
        </div>

        {/* Applied Template Badge */}
        {appliedTemplate && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border-y border-orange-100 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-orange-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-700">
                  Template:
                </span>
                <span className="text-xs font-semibold text-orange-600 bg-white border border-orange-200 px-2.5 py-0.5 rounded-full">
                  {appliedTemplate.name}
                </span>
                {appliedTemplate.variables &&
                  appliedTemplate.variables.length > 0 && (
                    <button
                      onClick={() => setShowVarFillModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <Code className="w-3 h-3" />
                      {Object.values(templateVarValues).filter(Boolean).length}/
                      {appliedTemplate.variables.length} vars filled
                    </button>
                  )}
              </div>
            </div>
            <button
              onClick={() => {
                setAppliedTemplate(null);
                setTemplateVarValues({});
                setEmailType("");
                toast("Template detached", { icon: "📧" });
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        )}

        {/* Editor Area with Toolbar and Mode Switches */}
        <div>
          {/* Top Editor Meta Bar */}
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/80 px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] text-gray-400 font-medium">
                Composing
              </span>
              {charCount > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-[11px] text-gray-400 tabular-nums">
                    {charCount} chars
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-[11px] text-gray-400">
                    ~{readingTimeMinutes} min read
                  </span>
                </>
              )}
            </div>

            {/* Mode switcher */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => {
                  if (showSource) toggleSource();
                  setShowPreview(false);
                }}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${!showPreview && !showSource ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Edit
              </button>
              <button
                onClick={toggleSource}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${showSource ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                HTML
              </button>
              <button
                onClick={() => {
                  setShowPreview(!showPreview);
                  if (showSource) toggleSource();
                }}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${showPreview ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Preview
              </button>
            </div>

            {/* Utility buttons */}
            <button
              onClick={copyHtml}
              title="Copy HTML"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Editor Core */}
          <EmailEditorCore
            ref={editorRef}
            onChange={handleEditorChange}
            isFullscreen={isFullscreen}
            showPreview={showPreview}
            showSource={showSource}
            htmlSource={htmlSource}
            onHtmlSourceChange={setHtmlSource}
          />

          {/* Preview Mode */}
          {showPreview && (
            <div
              className={`bg-gradient-to-br from-slate-50 to-gray-100 ${isFullscreen ? "h-full overflow-y-auto" : "min-h-[500px]"}`}
            >
              <div className="max-w-xl mx-auto py-8 px-6">
                {/* Email client chrome */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
                  {/* Fake toolbar */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[11px] font-medium text-gray-400">
                        Email Preview
                      </span>
                    </div>
                  </div>
                  {/* Email header */}
                  <div className="px-6 py-4 border-b border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-gray-900">
                        {subject || "(No Subject)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        A
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">
                          Admin User{" "}
                          <span className="font-normal text-gray-400">
                            &lt;admin@example.com&gt;
                          </span>
                        </div>
                        <div className="text-gray-400">
                          to <span className="text-gray-600">{to || "—"}</span>
                          {cc && (
                            <span>
                              {" "}
                              · cc <span className="text-gray-600">{cc}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Email body */}
                  <div
                    className="px-6 py-5 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                    style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-gray-100 bg-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <Hash className="w-3 h-3" />
                {charCount} chars
              </span>
              {charCount > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <Clock className="w-3 h-3" />~{readingTimeMinutes} min read
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearEditor}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* VARIABLE FILL MODAL */}
      {showVarFillModal &&
        appliedTemplate?.variables &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowVarFillModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Fill Template Variables
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Customize values for &ldquo;{appliedTemplate.name}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => setShowVarFillModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {appliedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {variable.name}
                      {variable.required && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </label>
                    {variable.description && (
                      <p className="text-xs text-gray-400 mb-1.5">
                        {variable.description}
                      </p>
                    )}
                    <input
                      type="text"
                      value={templateVarValues[variable.name] || ""}
                      onChange={(e) =>
                        setTemplateVarValues({
                          ...templateVarValues,
                          [variable.name]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${variable.name}...`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Type
                  </label>
                  <select
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
                  >
                    {Object.entries(CATEGORY_EMOJI).map(([key, emoji]) => (
                      <option key={key} value={key}>
                        {emoji}{" "}
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => setShowVarFillModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const missing = appliedTemplate.variables!.filter(
                      (v) => v.required && !templateVarValues[v.name]?.trim(),
                    );
                    if (missing.length > 0) {
                      toast.error(
                        `Please fill: ${missing.map((m) => m.name).join(", ")}`,
                      );
                      return;
                    }
                    setShowVarFillModal(false);
                    toast.success("Variables saved");
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all shadow-md shadow-orange-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Variables
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* TEMPLATE CREATE/EDIT MODAL */}
      {showTemplateModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={resetTemplateModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col"
              style={{ height: "min(88vh, 820px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {templateEditMode === "create"
                        ? "Save as Template"
                        : "Edit Template"}
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      {templateEditMode === "create"
                        ? "Give it a name, subject and write the email body"
                        : "Update the template name, subject or body"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetTemplateModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compact Meta Fields */}
              <div className="px-6 py-4 border-b border-gray-100 shrink-0 space-y-3 bg-gray-50/40">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Template Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={templateFormData.name}
                      onChange={(e) =>
                        setTemplateFormData({
                          ...templateFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., Welcome Email"
                      autoFocus
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Category
                      </label>
                      {templateEditMode === "create" && (
                        <button
                          type="button"
                          onClick={() => {
                            const starter =
                              STARTER_TEMPLATES[templateFormData.category] ||
                              STARTER_TEMPLATES["OTHER"];
                            setTemplateFormData((prev) => ({
                              ...prev,
                              subject: starter.subject,
                            }));
                            setTemplateBodyHtml(starter.html);
                            templateEditorRef.current?.setHtml(starter.html);
                          }}
                          className="text-[10px] font-semibold text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2 py-0.5 rounded-md transition-colors"
                        >
                          ↺ Load example
                        </button>
                      )}
                    </div>
                    <select
                      value={templateFormData.category}
                      onChange={(e) => {
                        const newCat = e.target
                          .value as typeof templateFormData.category;
                        const starter =
                          STARTER_TEMPLATES[newCat] ||
                          STARTER_TEMPLATES["OTHER"];
                        // Auto-swap subject if it still matches any starter (not custom-typed)
                        const isStillStarter = Object.values(
                          STARTER_TEMPLATES,
                        ).some((s) => s.subject === templateFormData.subject);
                        setTemplateFormData((prev) => ({
                          ...prev,
                          category: newCat,
                          subject:
                            templateEditMode === "create" && isStillStarter
                              ? starter.subject
                              : prev.subject,
                        }));
                        if (templateEditMode === "create") {
                          setTemplateBodyHtml(starter.html);
                          templateEditorRef.current?.setHtml(starter.html);
                        }
                      }}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none bg-white transition-colors"
                    >
                      <option value="ONBOARDING">👋 Onboarding</option>
                      <option value="PROJECT_UPDATE">🏗️ Project Update</option>
                      <option value="PAYMENT">💳 Payment</option>
                      <option value="FOLLOW_UP">🔁 Follow Up</option>
                      <option value="OCCASION">🎂 Occasion</option>
                      <option value="OTHER">🎉 Completion / Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={templateFormData.subject}
                      onChange={(e) =>
                        setTemplateFormData({
                          ...templateFormData,
                          subject: e.target.value,
                        })
                      }
                      placeholder="e.g., Welcome, {{customerName}}! 🏠"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none bg-white transition-colors pr-44"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 flex items-center gap-1 pointer-events-none select-none">
                      <Code className="w-3 h-3" />
                      {"{{variable}} auto-detected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embedded Email Body Editor */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="px-6 pt-3 pb-1.5 shrink-0 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Email Body
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Use{" "}
                    <code className="font-mono text-orange-500 bg-orange-50 px-1 rounded">
                      {"{{name}}"}
                    </code>{" "}
                    placeholders — they are auto-saved as variables
                  </span>
                </div>
                <div className="flex-1 overflow-auto border-t border-gray-100">
                  <EmailEditorCore
                    ref={templateEditorRef}
                    onChange={(html: string) => setTemplateBodyHtml(html)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/40">
                <p className="text-xs text-gray-400">
                  {templateEditMode === "create"
                    ? "Starter content pre-loaded · switch category to load a different example"
                    : "Edit fields or body then save to update the template"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetTemplateModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all shadow-md shadow-orange-500/20"
                  >
                    {templateEditMode === "create"
                      ? "Create Template"
                      : "Update Template"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* EDITOR STYLES */}
      <style>{`
        .lexical-editor-root { position: relative; }
        .lexical-content-editable { caret-color: #f97316; }
        .lexical-content-editable:focus { box-shadow: none; }
        .lexical-paragraph { margin-bottom: 0.6em; }
        .lexical-paragraph:last-child { margin-bottom: 0; }
        .lexical-h1 { font-size: 1.8em; font-weight: 800; margin: 1.25em 0 0.5em; color: #0f172a; line-height: 1.2; letter-spacing: -0.025em; }
        .lexical-h2 { font-size: 1.35em; font-weight: 700; margin: 1.1em 0 0.45em; color: #1e293b; line-height: 1.3; letter-spacing: -0.015em; }
        .lexical-h3 { font-size: 1.1em; font-weight: 600; margin: 0.9em 0 0.35em; color: #334155; line-height: 1.4; }
        .lexical-ul, .lexical-ol { padding-left: 1.6em; margin: 0.6em 0; }
        .lexical-li { margin-bottom: 0.35em; line-height: 1.7; color: #374151; }
        .lexical-li:last-child { margin-bottom: 0; }
        .lexical-blockquote { border-left: 3px solid #f97316; padding: 12px 20px; margin: 16px 0; color: #6b7280; background: linear-gradient(to right, #fff7ed, transparent); border-radius: 0 12px 12px 0; font-style: italic; }
        .lexical-code-block { background: #0f172a; color: #e2e8f0; padding: 16px 20px; border-radius: 12px; font-size: 0.82em; overflow-x: auto; line-height: 1.7; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .lexical-code-inline { background: #f1f5f9; color: #be185d; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .lexical-link { color: #ea580c; text-decoration: underline; text-underline-offset: 2px; text-decoration-thickness: 1px; transition: color 0.15s; }
        .lexical-link:hover { color: #c2410c; }
        .lexical-bold { font-weight: 700; }
        .lexical-italic { font-style: italic; }
        .lexical-underline { text-decoration: underline; text-underline-offset: 2px; }
        .lexical-strikethrough { text-decoration: line-through; }

        /* selection highlight for readability */
        .lexical-content-editable ::selection { background: rgba(249,115,22,0.12); }
      `}</style>
    </div>
  );
};

export default EmailEditor;
