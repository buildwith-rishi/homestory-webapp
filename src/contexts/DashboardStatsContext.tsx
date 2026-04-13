import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getDashboardStats,
  type DashboardStatsResponse,
} from "../services/api";

interface DashboardStatsContextValue {
  stats: DashboardStatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DashboardStatsContext = createContext<DashboardStatsContextValue>({
  stats: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export const DashboardStatsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <DashboardStatsContext.Provider
      value={{ stats, loading, error, refetch: fetch }}
    >
      {children}
    </DashboardStatsContext.Provider>
  );
};

export const useDashboardStats = (): DashboardStatsContextValue => {
  return useContext(DashboardStatsContext);
};
