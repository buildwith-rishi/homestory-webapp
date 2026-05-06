const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/EngineerDetails.tsx', 'utf-8');

// 1. Add imports to the top
const importsToInject = `
import {
  uploadKycDocument,
  type KycDocType,
  type KycDocument,
} from "../../services/customerApi";
import {
  listAttachments,
  getAttachment,
  deleteAttachment,
  type Attachment,
} from "../../services/attachmentApi";
import { Shield, Upload, FileText, Download } from "lucide-react";
`;

code = code.replace(
  'import { useParams',
  importsToInject + '\nimport { useParams'
);

// 2. Add the KYC component code right above \`export const EngineerDetails\`
const kycComponent = `
const KYC_DOCS = [
  { key: "AADHAR", label: "Aadhar Card" },
  { key: "PAN", label: "PAN Card" },
  { key: "GST_CERTIFICATE", label: "GST Certificate" },
];

const MemberKycPanel = ({ memberId }: { memberId: string }) => {
  const kycFileInputRef = React.useRef<HTMLInputElement>(null);
  const hasFetchedKyc = React.useRef(false);
  const [kycUploadTarget, React_useState] = React.useState<string | null>(null);
  const [kycAttachments, setKycAttachments] = React.useState<KycDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = React.useState(false);
  const [kycUploading, setKycUploading] = React.useState<string | null>(null);
  const [kycDeleting, setKycDeleting] = React.useState<string | null>(null);

  const kycUploadTargetReact = kycUploadTarget;
  const setKycUploadTargetReact = React_useState;

  React.useEffect(() => {
    if (hasFetchedKyc.current || !memberId) return;
    hasFetchedKyc.current = true;
    
    const fetchKyc = async () => {
      setLoadingKyc(true);
      try {
        const allAttachments = await listAttachments("ACCOUNT", memberId, 200).catch(err => {
          console.error("Failed to fetch kyc", err);
          return [];
        });
        const kycTypes = ["AADHAR", "PAN", "GST_CERTIFICATE"];
        const kycDocs = allAttachments.filter((a: any) => kycTypes.includes(a.attachmentType));
        
        const refreshedDocsPromises = kycDocs.map(async (doc: any) => {
          try {
            const fresh = await getAttachment("ACCOUNT", memberId, doc.id);
            return { ...fresh, attachmentType: fresh.attachmentType as KycDocType } as KycDocument;
          } catch {
            return { ...doc, attachmentType: doc.attachmentType as KycDocType } as KycDocument;
          }
        });
        const refreshedDocs = await Promise.all(refreshedDocsPromises);
        setKycAttachments(refreshedDocs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingKyc(false);
      }
    };
    fetchKyc();
  }, [memberId]);

  const handleKycFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !kycUploadTargetReact || !memberId) return;
    const docType = kycUploadTargetReact as KycDocType;
    setKycUploadTargetReact(null);
    setKycUploading(docType);
    try {
      const uploaded = await uploadKycDocument(memberId, file, docType);
      setKycAttachments((prev) => [
        ...prev.filter(a => a.attachmentType !== docType),
        { ...uploaded, attachmentType: uploaded.attachmentType as KycDocType } as KycDocument
      ]);
      toast.success(\`\${KYC_DOCS.find(d => d.key === docType)?.label ?? docType} uploaded successfully\`);
    } catch (err) {
      toast.error("Failed to upload document");
    } finally {
      setKycUploading(null);
      if (kycFileInputRef.current) kycFileInputRef.current.value = "";
    }
  };

  const handleKycDelete = async (doc: KycDocument) => {
    if (!window.confirm("Remove this document?")) return;
    setKycDeleting(doc.id);
    try {
      await deleteAttachment(doc.id);
      setKycAttachments(p => p.filter(a => a.id !== doc.id));
      toast.success("Document removed");
    } catch (e) {
      toast.error("Failed to remove document");
    } finally {
      setKycDeleting(null);
    }
  };

  return (
    <Card className="rounded-2xl p-6">
      <input type="file" ref={kycFileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleKycFileChange} />
      <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">KYC Documents</h3></div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <select value={kycUploadTargetReact ?? ""} onChange={(e) => setKycUploadTargetReact(e.target.value)} className="flex-1 min-w-[150px] px-3 py-2 text-sm border rounded-xl focus:ring-1 focus:ring-orange-400">
          <option value="">Select document type</option>
          {KYC_DOCS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <button onClick={() => kycUploadTargetReact && kycFileInputRef.current?.click()} disabled={!kycUploadTargetReact || !!kycUploading} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
          {kycUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
        </button>
      </div>
      {kycAttachments.length > 0 && <div className="space-y-2 mt-4">
        {kycAttachments.map(doc => {
          const l = KYC_DOCS.find(x => x.key === doc.attachmentType)?.label ?? doc.attachmentType;
          return <div key={doc.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400"/> <span className="text-sm font-medium text-gray-800">{l}</span></div>
            <div className="flex items-center gap-2">
              {doc.downloadUrl && (
                  <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-orange-500 text-gray-500 transition-colors"><Download className="w-4 h-4" /></a>
              )}
              <button title="Remove" onClick={() => handleKycDelete(doc)} disabled={kycDeleting === doc.id} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                {kycDeleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin border-red-500 border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        })}
      </div>}
    </Card>
  );
};
`;

code = code.replace(
  'export const EngineerDetails: React.FC = () => {',
  kycComponent + '\nexport const EngineerDetails: React.FC = () => {'
);

const stringToReplace = '        {/* Role & Department */}';

code = code.replace(
  stringToReplace,
  `        {/* KYC Panel */}
        <MemberKycPanel memberId={member.id} />
        
` + stringToReplace
);

fs.writeFileSync('src/pages/dashboard/EngineerDetails.tsx', code);
console.log("Patched successfully");
