import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";

function formatEnumLabel(value?: string | null): string {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EngineerProjects() {
  const navigate = useNavigate();
  const { projects, isLoading, error, fetchProjects, clearError } =
    useProjectStore();

  useEffect(() => {
    clearError();
    void fetchProjects();
  }, [fetchProjects, clearError]);

  const list = projects || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader showNotifications />

      <div className="p-4 space-y-4">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" />
            My Projects
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Overview and stages only — payment details are not shown here.
          </p>
        </div>

        {isLoading && list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-500">Loading projects…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void fetchProjects()}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-700 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No projects assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((p) => {
              const name =
                p.projectName?.trim() || p.name?.trim() || "Untitled Project";
              const status = formatEnumLabel(
                (p.status as string | undefined) || undefined,
              );
              const stage = p.currentStageCode
                ? formatEnumLabel(p.currentStageCode)
                : "—";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/app/projects/${p.id}`)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 active:scale-[0.99] transition-shadow hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {name}
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                      <span>{status}</span>
                      <span className="text-gray-300">·</span>
                      <span className="truncate">Stage: {stage}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
