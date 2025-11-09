import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Check, CheckCheck, ChevronRight } from "lucide-react";

function ChatContainer() {
  const {
    selectedUser,
    selectedGroup,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    groupTypingUsers,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!selectedGroup) return;
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, [selectedGroup, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative group ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                  )}
                  {msg.text && <p className="mt-2">{msg.text}</p>}
                  <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {msg.senderId === authUser._id && !selectedGroup && (
                    <div className="absolute -bottom-2 right-2 flex items-center gap-0.5">
                      {msg.seen ? (
                        <CheckCheck className="w-4 h-4 text-white" />
                      ) : onlineUsers?.includes(selectedUser._id) ? (
                        <CheckCheck className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Check className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}

                  {selectedGroup && msg.senderId === authUser._id && (
                    <GroupHoverPanel msg={msg} selectedGroup={selectedGroup} />
                  )}
                </div>

              </div>
            ))}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={(selectedUser && selectedUser.fullName) || (selectedGroup && selectedGroup.name) || ""} />
        )}
      </div>
      {selectedGroup && groupTypingUsers.length > 0 && (
        <TypingNames selectedGroup={selectedGroup} typingIds={groupTypingUsers} />
      )}
      <MessageInput />
    </>
  );
}

function TypingNames({ selectedGroup, typingIds }) {
  const { onlineUsers } = useAuthStore();
  // map ids to names from selectedGroup.members (populated in backend)
  const names = (selectedGroup.members || [])
    .filter((m) => typingIds.includes(m._id))
    .map((m) => m.fullName);
  if (names.length === 0) return null;
  return (
    <div className="px-6 text-xs text-slate-400">
      {names.join(", ")} typing…
    </div>
  );
}

function GroupHoverPanel({ msg, selectedGroup }) {
  const { onlineUsers, authUser } = useAuthStore();
  const members = (selectedGroup.members || []).filter((m) => m._id !== authUser._id);
  const seenSet = new Set(Array.isArray(msg.seenBy) ? msg.seenBy.map(String) : []);

  return (
    <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
      <div className="bg-slate-900/95 border border-slate-700 rounded-md shadow-lg p-2 min-w-[220px]">
        <div className="max-h-56 overflow-y-auto space-y-1">
          {members.map((m) => {
            const isOnline = onlineUsers.includes(m._id);
            const hasSeen = seenSet.has(m._id);
            return (
              <div key={m._id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-slate-800/60">
                {hasSeen ? (
                  <CheckCheck className="w-4 h-4 text-white" />
                ) : isOnline ? (
                  <CheckCheck className="w-4 h-4 text-gray-400" />
                ) : (
                  <Check className="w-4 h-4 text-gray-400" />
                )}
                <div className="avatar">
                  <div className="w-6 h-6 rounded-full">
                    <img src={m.profilePic || "/avatar.png"} alt={m.fullName} />
                  </div>
                </div>
                <div className="flex-1 truncate text-sm text-slate-200">{m.fullName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;
