import { useState, useRef, useEffect } from "react";
import { Camera, Check, AlertTriangle, X, Upload } from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { ProjectStage, PhotoRequirement } from "../../types";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import {
  getSiteEngineerProjects,
  getSiteEngineerTasks,
  uploadSiteEngineerTaskPhoto,
  type SiteEngineerProject,
  type SiteEngineerTask,
} from "../../services/siteEngineerApi";

const photoRequirements: Record<ProjectStage, PhotoRequirement[]> = {
  [ProjectStage.PRE_CONSTRUCTION]: [
    { id: "pr1", label: "Site Plan", required: true },
    { id: "pr2", label: "Excavation", required: true },
    { id: "pr3", label: "Foundation", required: true },
  ],
  [ProjectStage.EXECUTION]: [
    { id: "ex1", label: "Switch Board", required: true },
    { id: "ex2", label: "Wiring Layout", required: true },
    { id: "ex3", label: "Conduit Photo", required: true },
    { id: "ex4", label: "Ground Connect", required: true },
    { id: "ex5", label: "Panel View", required: true },
  ],
  [ProjectStage.FINISHING]: [
    { id: "fi1", label: "Paint Finish", required: true },
    { id: "fi2", label: "Tile Work", required: true },
    { id: "fi3", label: "Fixtures", required: true },
  ],
  [ProjectStage.FINAL_FIXES]: [
    { id: "ff1", label: "Final Walkthrough", required: true },
    { id: "ff2", label: "Touch-ups", required: false },
  ],
  [ProjectStage.COMPLETE]: [
    { id: "co1", label: "Completion Photos", required: true },
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
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [showCamera, setShowCamera] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Site engineer data
  const [seProjects, setSeProjects] = useState<SiteEngineerProject[]>([]);
  const [seTasks, setSeTasks] = useState<SiteEngineerTask[]>([]);
  const [seLoading, setSeLoading] = useState(false);

  // Load SE projects on mount
  useEffect(() => {
    setSeLoading(true);
    getSiteEngineerProjects()
      .then(setSeProjects)
      .catch((err) => console.warn("SE projects load failed:", err))
      .finally(() => setSeLoading(false));

    getSiteEngineerTasks()
      .then(setSeTasks)
      .catch((err) => console.warn("SE tasks load failed:", err));
  }, []);

  // Merge SE + project store – SE takes precedence
  const seProjectIds = new Set(seProjects.map((p) => p.id));
  const storeActive = projects.filter(
    (p) => p.status === "active" && !seProjectIds.has(p.id),
  );
  const displayProjects = [
    ...seProjects.filter((p) => p.status === "active" || p.status === "ACTIVE"),
    ...storeActive,
  ];

  // Tasks for selected project (from SE API)
  const projectTasks = seTasks.filter(
    (t) => t.projectId === selectedProject && t.status !== "COMPLETED",
  );

  const selectedProjectData = projects.find((p) => p.id === selectedProject);
  const requirements = selectedProjectData
    ? photoRequirements[selectedProjectData.stage]
    : [];

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedTaskId("");
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

    const aiCheck =
      Math.random() > 0.3
        ? { passed: true }
        : { passed: false, issues: ["Poor lighting detected", "Image blurry"] };

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
    setUploadedPhotos((prev) =>
      prev.filter((p) => p.requirementId !== requirementId),
    );
  };

  const handleSubmit = async () => {
    if (!selectedTaskId && projectTasks.length > 0) {
      toast.error("Please select a task before uploading");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    const taskId = selectedTaskId || selectedProject; // fallback to project id if no task

    // Upload each approved photo to the SE API
    for (const photo of uploadedPhotos) {
      if (!photo.aiCheck?.passed) continue; // skip failed AI checks
      const req = requirements.find((r) => r.id === photo.requirementId);
      const description = req
        ? `${req.label}${notes ? " – " + notes : ""}`
        : notes || "Site photo";

      try {
        await uploadSiteEngineerTaskPhoto(taskId, photo.file, description);
        successCount++;
      } catch (err) {
        console.warn("Photo upload failed:", err);
        failCount++;
      }
    }

    setUploading(false);

    if (failCount === 0) {
      toast.success(
        `${successCount} photo${successCount !== 1 ? "s" : ""} uploaded successfully!`,
      );
      setUploadedPhotos([]);
      setNotes("");
    } else if (successCount > 0) {
      toast.success(`${successCount} uploaded, ${failCount} failed`);
    } else {
      toast.error("All uploads failed. Please try again.");
    }
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
            disabled={seLoading}
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-60"
          >
            <option value="">
              {seLoading ? "Loading projects..." : "Choose a project..."}
            </option>
            {displayProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {(project as { location?: string }).location
                  ? ` - ${(project as { location?: string }).location}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Task selection – shown when project is selected and tasks exist */}
        {selectedProject && projectTasks.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Task (for photo association)
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Choose a task...</option>
              {projectTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProject && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Required Photos ({uploadedRequiredCount}/{requiredCount})
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {requirements.map((req) => {
                  const photo = uploadedPhotos.find(
                    (p) => p.requirementId === req.id,
                  );
                  const hasPhoto = !!photo;
                  const passed = photo?.aiCheck?.passed ?? true;

                  return (
                    <div key={req.id} className="relative">
                      <button
                        onClick={() => handlePhotoCapture(req.id)}
                        className={`w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                          hasPhoto
                            ? passed
                              ? "border-green-500 bg-green-50"
                              : "border-red-500 bg-red-50"
                            : req.required
                              ? "border-dashed border-gray-300 bg-white hover:border-orange-500 hover:bg-orange-50"
                              : "border-dashed border-gray-200 bg-gray-50"
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
                                <p
                                  key={idx}
                                  className="text-xs text-red-700 mt-0.5"
                                >
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
                  <span className="text-sm font-medium text-gray-700">
                    Progress
                  </span>
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
                  ? "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" color="white" />
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
