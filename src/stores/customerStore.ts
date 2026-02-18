import { create } from "zustand";

interface CurrentCustomer {
  id: string;
  name: string;
}

interface CustomerStoreState {
  currentCustomer: CurrentCustomer | null;
  setCurrentCustomer: (customer: CurrentCustomer | null) => void;
}

export const useCustomerStore = create<CustomerStoreState>((set) => ({
  currentCustomer: null,
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
}));
