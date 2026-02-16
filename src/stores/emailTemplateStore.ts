import { create } from "zustand";
import {
  EmailTemplate,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from "../types";
import EmailTemplateAPI from "../services/emailTemplateApi";

interface EmailTemplateState {
  templates: EmailTemplate[];
  currentTemplate: EmailTemplate | null;
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  getTemplateById: (id: string) => Promise<EmailTemplate | null>;
  setCurrentTemplate: (template: EmailTemplate | null) => void;
  createTemplate: (data: CreateEmailTemplateRequest) => Promise<EmailTemplate>;
  updateTemplate: (
    id: string,
    data: UpdateEmailTemplateRequest,
  ) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useEmailTemplateStore = create<EmailTemplateState>((set, get) => ({
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await EmailTemplateAPI.listTemplates();
      console.log("Fetched email templates from API:", templates);
      set({ templates, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch email templates:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch templates";
      set({ templates: [], isLoading: false, error: errorMessage });
    }
  },

  getTemplateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const template = await EmailTemplateAPI.getTemplateById(id);
      console.log("Fetched template by ID:", template);
      set({ currentTemplate: template, isLoading: false });
      return template;
    } catch (error) {
      console.error("Failed to fetch template by ID:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch template";
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  setCurrentTemplate: (template: EmailTemplate | null) => {
    set({ currentTemplate: template });
  },

  createTemplate: async (data: CreateEmailTemplateRequest) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Creating email template via API:", data);
      const newTemplate = await EmailTemplateAPI.createTemplate(data);
      console.log("Template created:", newTemplate);

      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));

      return newTemplate;
    } catch (error) {
      console.error("Failed to create template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create template";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateEmailTemplateRequest) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Updating email template via API:", id, data);
      const updatedTemplate = await EmailTemplateAPI.updateTemplate(id, data);
      console.log("Template updated:", updatedTemplate);

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? updatedTemplate : t,
        ),
        currentTemplate:
          state.currentTemplate?.id === id
            ? updatedTemplate
            : state.currentTemplate,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update template";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Deleting email template via API:", id);
      await EmailTemplateAPI.deleteTemplate(id);
      console.log("Template deleted:", id);

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        currentTemplate:
          state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to delete template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete template";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useEmailTemplateStore;
