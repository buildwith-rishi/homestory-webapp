import { useState, useRef } from 'react';
import { Camera, Check, AlertTriangle, X, Upload } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectStage, PhotoRequirement } from '../../types';

const photoRequirements: Record<ProjectStage, PhotoRequirement[]> = {
  [ProjectStage.PRE_CONSTRUCTION]: [
    { id: 'pr1', label: 'Site Plan', required: true },
    { id: 'pr2', label: 'Excavation', required: true },
    { id: 'pr3', label: 'Foundation', required: true },
  ],
  [ProjectStage.EXECUTION]: [
    { id: 'ex1', label: 'Switch Board', required: true },
    { id: 'ex2', label: 'Wiring Layout', required: true },
    { id: 'ex3', label: 'Conduit Photo', required: true },
    { id: 'ex4', label: 'Ground Connect', required: true },
    { id: 'ex5', label: 'Panel View', required: true },
  ],
  [ProjectStage.FINISHING]: [
    { id: 'fi1', label: 'Paint Finish', required: true },
    { id: 'fi2', label: 'Tile Work', required: true },
    { id: 'fi3', label: 'Fixtures', required: true },
  ],
  [ProjectStage.FINAL_FIXES]: [
    { id: 'ff1', label: 'Final Walkthrough', required: true },
    { id: 'ff2', label: 'Touch-ups', required: false },
  ],
  [ProjectStage.COMPLETE]: [
    { id: 'co1', label: 'Completion Photos', required: true },
  ],
};

interface UploadedPhotoData {
  requirementId: string;
  file: File;
  preview: string;
  aiCheck?: {
    passed: boolean;
    issues?: string[];
  };
}

export function PhotoUpload() {
  const { projects } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showCamera, setShowCamera] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const selectedProjectData = projects.find((p) => p.id === selectedProject);
  const requirements = selectedProjectData
    ? photoRequirements[selectedProjectData.stage]
    : [];

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setUploadedPhotos([]);
  };

  const handlePhotoCapture = (requirementId: string) => {
    setShowCamera(requirementId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !showCamera) return;

    const preview = URL.createObjectURL(file);

    const aiCheck = Math.random() > 0.3
      ? { passed: true }
      : { passed: false, issues: ['Poor lighting detected', 'Image blurry'] };

    const newPhoto: UploadedPhotoData = {
      requirementId: showCamera,
      file,
      preview,
      aiCheck,
    };

    setUploadedPhotos((prev) => [...prev, newPhoto]);
    setShowCamera(null);
  };

  const handleRemovePhoto = (requirementId: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.requirementId !== requirementId));
  };

  const handleSubmit = async () => {
    setUploading(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setUploading(false);
    setUploadedPhotos([]);
    setNotes('');
    alert('Photos uploaded successfully!');
  };

  const requiredCount = requirements.filter((r) => r.required).length;
  const uploadedRequiredCount = uploadedPhotos.filter((p) => {
    const req = requirements.find((r) => r.id === p.requirementId);
    return req?.required && p.aiCheck?.passed;
  }).length;

  const canSubmit = uploadedRequiredCount >= requiredCount && !uploading;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Upload Photos" showNotifications />

      <div className="p-4 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Choose a project...</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.location}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Required Photos ({uploadedRequiredCount}/{requiredCount})
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {requirements.map((req) => {
                  const photo = uploadedPhotos.find((p) => p.requirementId === req.id);
                  const hasPhoto = !!photo;
                  const passed = photo?.aiCheck?.passed ?? true;

                  return (
                    <div key={req.id} className="relative">
                      <button
                        onClick={() => handlePhotoCapture(req.id)}
                        className={`w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                          hasPhoto
                            ? passed
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : req.required
                            ? 'border-dashed border-gray-300 bg-white hover:border-orange-500 hover:bg-orange-50'
                            : 'border-dashed border-gray-200 bg-gray-50'
                        }`}
                      >
                        {hasPhoto ? (
                          <>
                            <img
                              src={photo.preview}
                              alt={req.label}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            {passed ? (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(req.id);
                              }}
                              className="absolute top-2 left-2 w-6 h-6 bg-gray-900 bg-opacity-60 rounded-full flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-600 text-center px-2">
                              {req.label}
                            </span>
                            {!req.required && (
                              <span className="text-[10px] text-gray-500 mt-1">
                                Optional
                              </span>
                            )}
                          </>
                        )}
                      </button>

                      {photo && !photo.aiCheck?.passed && (
                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-red-900">
                                Quality Issue
                              </p>
                              {photo.aiCheck?.issues?.map((issue, idx) => (
                                <p key={idx} className="text-xs text-red-700 mt-0.5">
                                  {issue}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the photos..."
                className="w-full h-24 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {uploadedRequiredCount} of {requiredCount} required
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(uploadedRequiredCount / requiredCount) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                canSubmit
                  ? 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
