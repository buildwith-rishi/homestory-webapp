import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Send } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import {
  getSiteEngineerProjects,
  submitDailySiteReport,
  type SiteEngineerProject,
} from "../../services/siteEngineerApi";

const today = new Date().toISOString().split("T")[0];

export function DailySiteReport() {
  const [projects, setProjects] = useState<SiteEngineerProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [reportDate, setReportDate] = useState(today);
  const [workSummary, setWorkSummary] = useState("");
  const [workProgress, setWorkProgress] = useState("");
  const [manpowerCount, setManpowerCount] = useState("");
  const [materialUsed, setMaterialUsed] = useState("");
  const [blockers, setBlockers] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");

  useEffect(() => {
    setProjectsLoading(true);
    getSiteEngineerProjects()
      .then((list) => setProjects(list))
      .catch((err) => {
        console.warn("Failed to load projects for DSR:", err);
        toast.error("Could not load projects");
      })
      .finally(() => setProjectsLoading(false));
  }, []);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (p) => (p.status || "").toUpperCase() === "ACTIVE" || !p.status,
      ),
    [projects],
  );

  const canSubmit =
    !!projectId && workSummary.trim().length >= 20 && !isSubmitting;

  const resetForm = () => {
    setProjectId("");
    setReportDate(today);
    setWorkSummary("");
    setWorkProgress("");
    setManpowerCount("");
    setMaterialUsed("");
    setBlockers("");
    setTomorrowPlan("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (workSummary.trim().length < 20) {
      toast.error("Work summary should be at least 20 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDailySiteReport({
        projectId,
        reportDate,
        workSummary: workSummary.trim(),
        workProgress: workProgress ? Number(workProgress) : undefined,
        manpowerCount: manpowerCount ? Number(manpowerCount) : undefined,
        materialUsed: materialUsed.trim() || undefined,
        blockers: blockers.trim() || undefined,
        tomorrowPlan: tomorrowPlan.trim() || undefined,
      });

      toast.success("DSR submitted successfully");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit DSR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Daily Site Report" showNotifications />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading}
              className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-60"
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "Select project"}
              </option>
              {(activeProjects.length > 0 ? activeProjects : projects).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Work Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="Describe completed activities, inspections, and updates (min 20 chars)"
              className="w-full h-28 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{workSummary.length}/20 minimum</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Progress %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={workProgress}
                onChange={(e) => setWorkProgress(e.target.value)}
                placeholder="0-100"
                className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Manpower
              </label>
              <input
                type="number"
                min={0}
                value={manpowerCount}
                onChange={(e) => setManpowerCount(e.target.value)}
                placeholder="No. of workers"
                className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Materials Used
            </label>
            <textarea
              value={materialUsed}
              onChange={(e) => setMaterialUsed(e.target.value)}
              placeholder="Cement, wire, switches, etc."
              className="w-full h-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Blockers / Risks
            </label>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any delays, dependencies, or concerns"
              className="w-full h-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Plan For Tomorrow
            </label>
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="What is planned for next working day"
              className="w-full h-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            canSubmit
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <ClipboardCheck className="w-5 h-5" />
              <span>Submit DSR</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
