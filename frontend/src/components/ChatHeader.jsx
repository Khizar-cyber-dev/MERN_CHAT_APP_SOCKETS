import { XIcon, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const {
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    isPartnerTyping,
    groupTypingUsers,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (selectedGroup) setSelectedGroup(null);
        else setSelectedUser(null);
      }
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, setSelectedGroup, selectedGroup]);

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b
   border-slate-700/50 max-h-[84px] px-6 flex-1"
    >
      <div className="flex items-center space-x-3">
        {selectedUser && (
          <>
            <div className={`avatar ${isOnline ? "online" : "offline"}`}>
              <div className="w-12 rounded-full">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>
            <div>
              <h3 className="text-slate-200 font-medium">{selectedUser.fullName}</h3>
              <p className="text-slate-400 text-sm">
                {isPartnerTyping ? "typing…" : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </>
        )}

        {selectedGroup && (
          <>
            <div className="avatar online">
              <div className="w-12 rounded">
                {selectedGroup.avatar ? (
                  <img src={selectedGroup.avatar} alt={selectedGroup.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700/50 text-slate-300">
                    <Users className="w-7 h-7" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-slate-200 font-medium">{selectedGroup.name}</h3>
              <p className="text-slate-400 text-sm">
                {(() => {
                  const names = (selectedGroup.members || [])
                    .filter((m) => groupTypingUsers?.includes(m._id) && m._id !== authUser._id)
                    .map((m) => m.fullName);
                  if (names.length === 0) return `${(selectedGroup.members?.length || 0)} members`;
                  const display = names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} others`;
                  return `${display} typing…`;
                })()}
              </p>
            </div>
          </>
        )}
      </div>

      <button onClick={() => (selectedGroup ? setSelectedGroup(null) : setSelectedUser(null))}>
        <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
      </button>
    </div>
  );
}
export default ChatHeader;
