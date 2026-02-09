import { useState, useEffect, useCallback } from "react";
import type {
  OptionItem,
  OptionItemWithDescription,
  StageOption,
  PropertySubtypeOptions,
  ProjectOptions,
} from "../types";
import {
  getProjectCategories,
  getBudgetTiers,
  getScopeTypes,
  getPipelineTypes,
  getPropertySubtypes,
  getProjectStatuses,
  getProjectStageOptions,
  getStageStatuses,
  getReferenceCategories,
} from "../services/projectApi";

interface UseProjectOptionsReturn {
  options: ProjectOptions;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  getSubtypesForCategory: (category: string) => OptionItem[];
  getLabelForValue: (
    optionType: keyof Omit<
      ProjectOptions,
      "propertySubtypes" | "referenceCategories"
    >,
    value: string,
  ) => string;
}

// Cache the options so we don't refetch on every mount
let cachedOptions: ProjectOptions | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const DEFAULT_OPTIONS: ProjectOptions = {
  categories: [],
  budgetTiers: [],
  scopeTypes: [],
  pipelineTypes: [],
  propertySubtypes: {},
  statuses: [],
  stages: [],
  stageStatuses: [],
  referenceCategories: [],
};

export function useProjectOptions(): UseProjectOptionsReturn {
  const [options, setOptions] = useState<ProjectOptions>(
    cachedOptions || DEFAULT_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(!cachedOptions);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOptions = useCallback(async (force = false) => {
    // Use cache if available and not expired
    if (
      !force &&
      cachedOptions &&
      Date.now() - cacheTimestamp < CACHE_DURATION
    ) {
      setOptions(cachedOptions);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        categories,
        budgetTiers,
        scopeTypes,
        pipelineTypes,
        propertySubtypes,
        statuses,
        stages,
        stageStatuses,
        referenceCategories,
      ] = await Promise.all([
        getProjectCategories().catch(() => [] as OptionItem[]),
        getBudgetTiers().catch(() => [] as OptionItem[]),
        getScopeTypes().catch(() => [] as OptionItem[]),
        getPipelineTypes().catch(() => [] as OptionItem[]),
        getPropertySubtypes().catch(() => ({}) as PropertySubtypeOptions),
        getProjectStatuses().catch(() => [] as OptionItemWithDescription[]),
        getProjectStageOptions().catch(() => [] as StageOption[]),
        getStageStatuses().catch(() => [] as OptionItem[]),
        getReferenceCategories().catch(() => [] as string[]),
      ]);

      const newOptions: ProjectOptions = {
        categories,
        budgetTiers,
        scopeTypes,
        pipelineTypes,
        propertySubtypes,
        statuses,
        stages,
        stageStatuses,
        referenceCategories,
      };

      cachedOptions = newOptions;
      cacheTimestamp = Date.now();
      setOptions(newOptions);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch project options";
      setError(msg);
      console.error("Error fetching project options:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOptions();
  }, [fetchAllOptions]);

  const refetch = useCallback(() => {
    fetchAllOptions(true);
  }, [fetchAllOptions]);

  const getSubtypesForCategory = useCallback(
    (category: string): OptionItem[] => {
      return options.propertySubtypes[category] || [];
    },
    [options.propertySubtypes],
  );

  const getLabelForValue = useCallback(
    (
      optionType: keyof Omit<
        ProjectOptions,
        "propertySubtypes" | "referenceCategories"
      >,
      value: string,
    ): string => {
      const items = options[optionType];
      const found = items.find((item) => item.value === value);
      return (
        found?.label ||
        value?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "N/A"
      );
    },
    [options],
  );

  return {
    options,
    isLoading,
    error,
    refetch,
    getSubtypesForCategory,
    getLabelForValue,
  };
}
