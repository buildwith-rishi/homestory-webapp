import { useState, useRef } from 'react';
import { Camera, X, Send } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { useProjectStore } from '../../stores/projectStore';
import { IssueCategory, IssueSeverity } from '../../types';

const categories = [
  { value: IssueCategory.MATERIAL, label: 'Material' },
  { value: IssueCategory.QUALITY, label: 'Quality' },
  { value: IssueCategory.SAFETY, label: 'Safety' },
  { value: IssueCategory.DELAY, label: 'Delay' },
  { value: IssueCategory.OTHER, label: 'Other' },
];

const severities = [
  { value: IssueSeverity.LOW, label: 'Low', color: 'bg-gray-500' },
  { value: IssueSeverity.MEDIUM, label: 'Medium', color: 'bg-orange-400' },
  { value: IssueSeverity.HIGH, label: 'High', color: 'bg-red-400' },
  { value: IssueSeverity.CRITICAL, label: 'Critical', color: 'bg-red-600' },
];

export function ReportIssue() {
  const { projects } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [severity, setSeverity] = useState<IssueSeverity | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const activeProjects = projects.filter((p) => p.status === 'active');

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !category || !severity || !description || description.length < 20) {
      alert('Please fill in all required fields');
      return;
    }

    if ((category === IssueCategory.QUALITY || category === IssueCategory.SAFETY) && photos.length === 0) {
      alert('Photos are required for quality and safety issues');
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setProjectId('');
    setCategory('');
    setSeverity('');
    setTitle('');
    setDescription('');
    setLocation('');
    setPhotos([]);
    setSubmitting(false);

    alert('Issue reported successfully!');
  };

  const canSubmit =
    projectId &&
    category &&
    severity &&
    description.length >= 20 &&
    !submitting;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Report Issue" showNotifications />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Select project...</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Issue Category <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {severities.map((sev) => (
              <label
                key={sev.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  severity === sev.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={sev.value}
                  checked={severity === sev.value}
                  onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-3 h-3 rounded-full ${sev.color}`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {sev.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Issue Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail... (minimum 20 characters)"
            className="w-full h-32 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/20 characters minimum
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location in Site
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Living room, north wall"
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos
            {(category === IssueCategory.QUALITY || category === IssueCategory.SAFETY) && (
              <span className="text-red-500"> *</span>
            )}
          </label>

          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo.preview}
                  alt={`Issue photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-gray-900 bg-opacity-60 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <button
                type="button"
                onClick={handleAddPhoto}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-600">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            canSubmit
              ? 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Report Issue</span>
            </>
          )}
        </button>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
