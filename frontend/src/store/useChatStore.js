import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  groups: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  isPartnerTyping: false,
  groupTypingUsers: [],

  // =====================
  // General Actions
  // =====================
  toggleSound: () => {
    const newState = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newState);
    set({ isSoundEnabled: newState });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, selectedGroup: null });
    if (selectedUser) get().markMessagesAsSeen(selectedUser._id);
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group, selectedUser: null });
    if (group) {
      get().getMessagesByGroupId(group._id);
      get().markGroupMessagesAsSeen(group._id);
    }
  },

  // =====================
  // Fetch Functions
  // =====================
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyGroups: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/groups/mine");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      get().markMessagesAsSeen(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getMessagesByGroupId: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
      get().markGroupMessagesAsSeen(groupId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // =====================
  // Message Seen Handlers
  // =====================
  markMessagesAsSeen: async (otherUserId) => {
    try {
      await axiosInstance.put(`/messages/seen/${otherUserId}`);
      const updated = get().messages.map((m) =>
        m.senderId === otherUserId
          ? { ...m, seen: true, seenAt: new Date().toISOString() }
          : m
      );
      set({ messages: updated });
    } catch (_) {}
  },

  markGroupMessagesAsSeen: async (groupId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/seen`);
      const { messageIds } = res.data || {};
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;

      const { authUser } = useAuthStore.getState();
      const updated = get().messages.map((m) =>
        messageIds.includes(m._id)
          ? {
              ...m,
              seenBy: Array.isArray(m.seenBy)
                ? Array.from(new Set([...m.seenBy, authUser._id]))
                : [authUser._id],
            }
          : m
      );
      set({ messages: updated });
    } catch (_) {}
  },

  // =====================
  // Group Management
  // =====================
  createGroup: async ({ name, members, avatar }) => {
    try {
      const res = await axiosInstance.post("/groups", { name, members, avatar });
      const newGroup = res.data;
      set((state) => ({
        groups: [newGroup, ...(state.groups || [])],
        selectedGroup: newGroup,
        selectedUser: null,
      }));
      return newGroup;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  // =====================
  // Typing Indicators
  // =====================
  emitTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("typing", { toUserId: selectedUser._id });
  },

  emitStopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("stopTyping", { toUserId: selectedUser._id });
  },

  emitGroupTyping: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("group:typing", { groupId: selectedGroup._id });
  },

  emitGroupStopTyping: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("group:stopTyping", { groupId: selectedGroup._id });
  },

  // =====================
  // Message Sending
  // =====================
  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser?._id,
      groupId: selectedGroup?._id || null,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      seen: false,
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const url = selectedGroup
        ? `/groups/${selectedGroup._id}/messages`
        : `/messages/send/${selectedUser._id}`;
      const res = await axiosInstance.post(url, messageData);
      set({ messages: messages.concat(res.data) });
    } catch (error) {
      set({ messages });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // =====================
  // Realtime Subscriptions
  // =====================
  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (msg) => {
      if (msg.senderId !== selectedUser._id) return;
      set({ messages: [...get().messages, msg] });
      get().markMessagesAsSeen(selectedUser._id);

      if (isSoundEnabled) {
        const sound = new Audio("/sounds/notification.mp3");
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    });

    socket.on("messagesSeen", ({ byUserId, messageIds }) => {
      const { authUser } = useAuthStore.getState();
      const current = get().selectedUser;
      if (!current || current._id !== byUserId) return;

      const idSet = new Set(messageIds?.map(String));
      const updated = get().messages.map((m) =>
        idSet.has(String(m._id)) && m.senderId === authUser._id
          ? { ...m, seen: true, seenAt: new Date().toISOString() }
          : m
      );
      set({ messages: updated });
    });

    socket.on("typing", ({ fromUserId }) => {
      if (selectedUser._id === fromUserId) set({ isPartnerTyping: true });
    });
    socket.on("stopTyping", ({ fromUserId }) => {
      if (selectedUser._id === fromUserId) set({ isPartnerTyping: false });
    });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup, isSoundEnabled } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;

    socket.on("newGroupMessage", (msg) => {
      if (msg.groupId !== selectedGroup._id) return;
      set({ messages: [...get().messages, msg] });
      get().markGroupMessagesAsSeen(selectedGroup._id);

      if (isSoundEnabled) {
        const sound = new Audio("/sounds/notification.mp3");
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    });

    socket.on("groupMessagesSeen", ({ userId, messageIds, groupId }) => {
      const current = get().selectedGroup;
      if (!current || current._id !== groupId) return;

      const idSet = new Set(messageIds?.map(String));
      const updated = get().messages.map((m) => {
        if (!idSet.has(String(m._id))) return m;
        const seen = new Set(m.seenBy?.map(String) || []);
        if (seen.has(String(userId))) return m;
        return { ...m, seenBy: [...seen, String(userId)] };
      });
      set({ messages: updated });
    });

    socket.on("typing", ({ userId }) => {
      const { authUser } = useAuthStore.getState();
      if (!userId || userId === authUser._id) return;
      const users = new Set(get().groupTypingUsers);
      users.add(userId);
      set({ groupTypingUsers: [...users] });
    });

    socket.on("stopTyping", ({ userId }) => {
      const users = new Set(get().groupTypingUsers);
      users.delete(userId);
      set({ groupTypingUsers: [...users] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    ["newMessage", "messagesSeen", "typing", "stopTyping"].forEach((ev) =>
      socket.off(ev)
    );
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    ["newGroupMessage", "groupMessagesSeen", "typing", "stopTyping"].forEach(
      (ev) => socket.off(ev)
    );
  },
}));
