import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { Users } from "lucide-react";

function GroupsList() {
  const {
    getMyGroups,
    groups,
    isUsersLoading,
    setSelectedGroup,
    getAllContacts,
    allContacts,
    createGroup,
  } = useChatStore();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMyGroups();
    getAllContacts();
  }, [getMyGroups, getAllContacts]);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createGroup({ name: name.trim(), members: selectedMembers, avatar: avatarPreview });
      // reset form
      setName("");
      setSelectedMembers([]);
      setAvatarPreview(null);
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  if (isUsersLoading && groups.length === 0) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-slate-400">Groups</h3>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="text-xs px-2 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-700"
        >
          {showCreate ? "Cancel" : "Create"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-3 rounded bg-slate-800/50 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 h-12 rounded">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700/50 text-slate-300">
                    <Users className="w-7 h-7" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                onChange={onPickAvatar}
                type="file"
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                Choose Avatar
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {allContacts.map((c) => (
              <label key={c._id} className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(c._id)}
                  onChange={() => toggleMember(c._id)}
                />
                <span>{c.fullName}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="w-full text-sm px-3 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="text-sm text-slate-400">No groups yet</div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div
              key={g._id}
              className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
              onClick={() => setSelectedGroup(g)}
            >
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="size-12 rounded">
                    {g.avatar ? (
                      <img src={g.avatar} alt={g.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-700/50 text-slate-300">
                        <Users className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="truncate">
                  <h4 className="text-slate-200 font-medium truncate">{g.name}</h4>
                  <p className="text-xs text-slate-400">{(g.members?.length || 0)} members</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupsList;
