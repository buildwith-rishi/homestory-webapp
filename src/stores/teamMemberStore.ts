import { create } from "zustand";

interface CurrentTeamMember {
  id: string;
  name: string;
}

interface TeamMemberStoreState {
  currentTeamMember: CurrentTeamMember | null;
  setCurrentTeamMember: (member: CurrentTeamMember | null) => void;
}

export const useTeamMemberStore = create<TeamMemberStoreState>((set) => ({
  currentTeamMember: null,
  setCurrentTeamMember: (member) => set({ currentTeamMember: member }),
}));
