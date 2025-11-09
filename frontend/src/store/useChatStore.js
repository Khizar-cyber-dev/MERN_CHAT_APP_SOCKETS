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

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  markGroupMessagesAsSeen: async (groupId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/seen`);
      const { messageIds } = res.data || {};
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      const { authUser } = useAuthStore.getState();
      const current = get().messages;
      const updated = current.map((m) =>
        messageIds.includes(m._id)
          ? { ...m, seenBy: Array.isArray(m.seenBy) ? Array.from(new Set([...m.seenBy, authUser._id])) : [authUser._id] }
          : m
      );
      set({ messages: updated });
    } catch (error) {
      // silent fail to avoid UI noise
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) set({ selectedGroup: null });
    if (selectedUser) {
      get().markMessagesAsSeen(selectedUser._id);
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group, selectedUser: null });
    if (group) {
      get().getMessagesByGroupId(group._id);
      get().markGroupMessagesAsSeen(group._id);
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
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
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  createGroup: async ({ name, members, avatar }) => {
    try {
      const res = await axiosInstance.post("/groups", { name, members, avatar });
      const newGroup = res.data;
      const current = get().groups || [];
      set({ groups: [newGroup, ...current], selectedGroup: newGroup, selectedUser: null });
      return newGroup;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      get().markMessagesAsSeen(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // GROUP: fetch messages
  getMessagesByGroupId: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
      get().markGroupMessagesAsSeen(groupId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  markMessagesAsSeen: async (otherUserId) => {
    try {
      await axiosInstance.put(`/messages/seen/${otherUserId}`);
      const current = get().messages;
      const updated = current.map((m) =>
        m.senderId === otherUserId ? { ...m, seen: true, seenAt: new Date().toISOString() } : m
      );
      set({ messages: updated });
    } catch (error) {
      // no toast to avoid noise; optional to log
    }
  },

  // typing indicator: emit helpers
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

  // GROUP: typing helpers
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
      isOptimistic: true, // flag to identify optimistic messages (optional)
      seen: false,
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      let res;
      if (selectedGroup) {
        res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
      } else if (selectedUser) {
        res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      } else {
        throw new Error("No recipient selected");
      }
      set({ messages: messages.concat(res.data) });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      // Immediately mark as seen so sender gets real-time read receipt
      get().markMessagesAsSeen(selectedUser._id);

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");

        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });

    socket.on("messagesSeen", ({ byUserId, messageIds }) => {
      const { authUser } = useAuthStore.getState();
      const currentSelected = get().selectedUser;
      if (!currentSelected || currentSelected._id !== byUserId) return;
      const current = get().messages;
      const idSet = new Set((messageIds || []).map((id) => String(id)));
      const updated = current.map((m) => {
        const mid = String(m._id);
        const isMine = String(m.senderId) === String(authUser._id);
        return idSet.has(mid) && isMine ? { ...m, seen: true, seenAt: new Date().toISOString() } : m;
      });
      set({ messages: updated });
    });

     socket.on("typing", ({ fromUserId }) => {
       const currentSelected = get().selectedUser;
       if (currentSelected && currentSelected._id === fromUserId) {
         set({ isPartnerTyping: true });
       }
     });
     socket.on("stopTyping", ({ fromUserId }) => {
       const currentSelected = get().selectedUser;
       if (currentSelected && currentSelected._id === fromUserId) {
         set({ isPartnerTyping: false });
       }
     });
  },

  // GROUP: subscribe to group events for current selectedGroup
  subscribeToGroupMessages: () => {
    const { selectedGroup, isSoundEnabled } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newGroupMessage", (newMessage) => {
      const isCurrentGroup = newMessage.groupId === selectedGroup._id;
      if (!isCurrentGroup) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      // mark as seen for read receipts
      get().markGroupMessagesAsSeen(selectedGroup._id);

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
      }
    });

    // seen-by updates
    socket.on("groupMessagesSeen", ({ userId, messageIds, groupId }) => {
      const currentSelected = get().selectedGroup;
      if (!currentSelected || currentSelected._id !== groupId) return;
      const current = get().messages;
      const idSet = new Set((messageIds || []).map((id) => String(id)));
      const updated = current.map((m) => {
        const mid = String(m._id);
        if (!idSet.has(mid)) return m;
        const seenArr = Array.isArray(m.seenBy) ? m.seenBy.map(String) : [];
        if (seenArr.includes(String(userId))) return m;
        return { ...m, seenBy: [...seenArr, String(userId)] };
      });
      set({ messages: updated });
    });

    // typing in group uses generic event names with payload { userId }
    socket.on("typing", ({ userId }) => {
      if (!userId) return; // ignore DM typing events with different payload
      const currentSelected = get().selectedGroup;
      const { authUser } = useAuthStore.getState();
      if (!currentSelected || userId === authUser._id) return;
      const setUsers = new Set(get().groupTypingUsers);
      setUsers.add(userId);
      set({ groupTypingUsers: Array.from(setUsers) });
    });
    socket.on("stopTyping", ({ userId }) => {
      if (!userId) return;
      const currentSelected = get().selectedGroup;
      if (!currentSelected) return;
      const setUsers = new Set(get().groupTypingUsers);
      setUsers.delete(userId);
      set({ groupTypingUsers: Array.from(setUsers) });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newGroupMessage");
    socket.off("groupMessagesSeen");
    socket.off("typing");
    socket.off("stopTyping");
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("typing");
    socket.off("stopTyping");
  },
}));
