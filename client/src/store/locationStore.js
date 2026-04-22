import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  myLocation: null,
  friendLocations: new Map(),

  setMyLocation: (location) => set({ myLocation: location }),
  
  updateFriendLocation: (userId, location) =>
    set((state) => {
      const newLocations = new Map(state.friendLocations);
      newLocations.set(userId, location);
      return { friendLocations: newLocations };
    }),

  removeFriendLocation: (userId) =>
    set((state) => {
      const newLocations = new Map(state.friendLocations);
      newLocations.delete(userId);
      return { friendLocations: newLocations };
    }),

  clearLocations: () => set({ myLocation: null, friendLocations: new Map() }),
}));
