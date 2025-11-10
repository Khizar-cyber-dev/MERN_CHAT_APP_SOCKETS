import { Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function GroupHoverPanel({ msg, selectedGroup }) {
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