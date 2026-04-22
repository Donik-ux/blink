import { create } from 'zustand';

export const useFriendStore = create((set) => ({
  friends: [],
  requests: [],
  ghostMode: false,

  setFriends: (friends) => set({ friends }),
  setRequests: (requests) => set({ requests }),
  
  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),

  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    })),

  setGhostMode: (ghostMode) => set({ ghostMode }),

  updateFriendDistance: (friendId, distance) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === friendId ? { ...f, distance } : f
      ),
    })),
}));
