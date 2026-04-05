import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, Search, Settings, LogOut, Phone, Video,
  MoreVertical, Send, Paperclip, Smile, Bell, Moon, Shield,
  User, Edit3, Check, X, Circle, CheckCheck, ImageIcon, Mic,
  MicOff, Reply, Trash2, Copy, Download, File, Info, ArrowLeft,
  ChevronDown, Plus, UserPlus, Hash, RefreshCw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "http://localhost:3001";
const WS_URL = "ws://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────
type Reaction = "❤️" | "👍" | "😂" | "😮" | "😢" | "😡";
type Status = "sent" | "delivered" | "read";
type ActiveTab = "chats" | "settings";

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  fullTime: string;
  status: Status;
  reactions: Reaction[];
  replyTo?: string;
}

interface Room {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
  isGroup?: boolean;
}

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
  "from-sky-500 to-indigo-500",
  "from-fuchsia-500 to-purple-500",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMsg(m: any, meId: string): Message {
  // Normalise across different backend field names
  const text = m.content ?? m.message ?? m.text ?? "";
  const senderId = m.userId ?? m.senderId ?? m.user_id ?? "";
  const createdAt = m.createdAt ?? m.created_at ?? m.timestamp ?? null;
  const date = createdAt ? new Date(createdAt) : new Date();
  return {
    id: m.id ?? m._id ?? String(Math.random()),
    senderId,
    text,
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fullTime: date.toLocaleString(),
    status: (m.status || "sent").toLowerCase() as Status,
    reactions: [],
  };
}

function shouldGroup(msgs: Message[], idx: number) {
  if (idx === 0) return false;
  return msgs[idx - 1].senderId === msgs[idx].senderId;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  grad, size = "md", online, char,
}: { grad: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; online?: boolean; char?: string }) {
  const sz = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  }[size];
  const dot = size === "xs" || size === "sm" ? "w-2 h-2 border" : "w-2.5 h-2.5 border-2";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white`}>
        {char}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-gray-900 ${online ? "bg-emerald-500" : "bg-gray-600"}`} />
      )}
    </div>
  );
}

// ─── Emoji Reaction Bar ───────────────────────────────────────────────────────
const EMOJI_LIST: Reaction[] = ["❤️", "👍", "😂", "😮", "😢", "😡"];
function ReactionBar({ onPick, onClose }: { onPick: (r: Reaction) => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl px-2 py-1.5 shadow-xl shadow-black/40">
      {EMOJI_LIST.map((e) => (
        <button key={e} onClick={() => { onPick(e); onClose(); }}
          className="text-lg hover:scale-125 transition-transform duration-150 px-1">{e}</button>
      ))}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ grad }: { grad: string }) {
  return (
    <div className="flex items-end gap-2 mt-4">
      <Avatar grad={grad} size="sm" />
      <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({
  msg, isMe, grouped, replySource, contactGrad,
  onReply, onDelete, onReact,
}: {
  msg: Message; isMe: boolean; grouped: boolean;
  replySource?: Message; contactGrad: string;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, r: Reaction) => void;
}) {
  const [showCtx, setShowCtx] = useState(false);
  const [showReact, setShowReact] = useState(false);

  return (
    <div className={`flex ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2 ${grouped ? "mt-0.5" : "mt-4"}`}>
      <div className="w-8 flex-shrink-0">
        {!grouped && !isMe && <Avatar grad={contactGrad} size="sm" />}
      </div>

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-xs lg:max-w-md xl:max-w-lg relative`}>
        {/* Reply preview */}
        {msg.replyTo && replySource && (
          <div className={`flex items-start gap-2 mb-1 px-3 py-2 rounded-xl bg-gray-800/50 border-l-2 border-indigo-500/60 text-xs text-gray-400 max-w-full ${isMe ? "self-end" : "self-start"}`}>
            <Reply className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-400" />
            <p className="truncate text-gray-500">{replySource.text}</p>
          </div>
        )}

        <div className="relative group" onContextMenu={(e) => { e.preventDefault(); setShowCtx(true); }}>
          {/* Hover actions */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-full mr-2" : "left-full ml-2"} hidden group-hover:flex items-center gap-1 z-10`}>
            <button onClick={() => setShowReact(true)}
              className="w-7 h-7 rounded-lg bg-gray-800/90 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white">
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onReply(msg.id)}
              className="w-7 h-7 rounded-lg bg-gray-800/90 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white">
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(msg.id)}
              className="w-7 h-7 rounded-lg bg-gray-800/90 border border-gray-700/40 flex items-center justify-center text-red-500/60 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reaction picker */}
          {showReact && (
            <div className={`absolute -top-12 ${isMe ? "right-0" : "left-0"} z-50`}>
              <ReactionBar onPick={(r) => onReact(msg.id, r)} onClose={() => setShowReact(false)} />
            </div>
          )}

          {/* Context menu */}
          {showCtx && (
            <div className={`absolute ${isMe ? "right-0" : "left-0"} -top-2 -translate-y-full z-50 flex flex-col bg-gray-800/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl overflow-hidden shadow-xl min-w-[150px]`}
              onMouseLeave={() => setShowCtx(false)}>
              {[
                { icon: <Smile className="w-3.5 h-3.5" />, label: "React", action: () => { setShowReact(true); setShowCtx(false); } },
                { icon: <Reply className="w-3.5 h-3.5" />, label: "Reply", action: () => { onReply(msg.id); setShowCtx(false); } },
                { icon: <Copy className="w-3.5 h-3.5" />, label: "Copy", action: () => { navigator.clipboard?.writeText(msg.text); setShowCtx(false); } },
                { icon: <Trash2 className="w-3.5 h-3.5" />, label: "Delete", action: () => { onDelete(msg.id); setShowCtx(false); }, danger: true },
              ].map((item) => (
                <button key={item.label} onClick={item.action}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${(item as any).danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Text bubble */}
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMe
            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20"
            : "bg-gray-800/80 border border-gray-700/40 text-gray-100 rounded-bl-sm"}`}>
            {msg.text}
            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
              <span className="text-[10px] opacity-40">{msg.time}</span>
              {isMe && (msg.status === "read"
                ? <CheckCheck className="w-3 h-3 text-indigo-200 opacity-80" />
                : msg.status === "delivered"
                ? <CheckCheck className="w-3 h-3 opacity-40" />
                : <Check className="w-3 h-3 opacity-40" />)}
            </div>
          </div>
        </div>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className={`flex items-center gap-0.5 mt-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <div className="flex items-center gap-0.5 bg-gray-800/80 border border-gray-700/40 rounded-full px-2 py-0.5 text-xs">
              {[...new Set(msg.reactions)].map((r) => <span key={r} className="text-sm leading-none">{r}</span>)}
              {msg.reactions.length > 1 && <span className="text-gray-500 ml-1 text-[10px]">{msg.reactions.length}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Room Modal ─────────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 bg-gray-900 border border-gray-700/60 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white font-bold mb-4">New Chat Room</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name..."
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate(name)}
          className="w-full bg-gray-800/60 border border-gray-700/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-gray-800/60 text-gray-400 text-sm hover:text-white">Cancel</button>
          <button onClick={() => name.trim() && onCreate(name)}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [me] = useState<string>(() => localStorage.getItem("userId") || "me");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chats");
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = localStorage.getItem("token");
  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id || data.userId || me,
            username: data.username || data.name || "You",
            email: data.email || "",
            avatar: getGradient(data.id || me),
          });
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Fetch rooms ──────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/user/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(
        (data.rooms || []).map((r: any) => ({
          id: r.roomId,
          name: r.name,
          avatar: getGradient(r.roomId),
          lastMessage: r.lastMessage || "",
          time: r.time ? formatTime(r.time) : "",
          unread: r.unread || 0,
          online: false,
          messages: [],
        }))
      );
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Keep a ref so WS handler always reads the latest activeRoomId without reconnecting
  const activeRoomIdRef = useRef<string | null>(null);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "chat") {
        const msg = data.message;
        const formatted = formatMsg(msg, me);
        const currentRoom = activeRoomIdRef.current;
        setRooms((prev) =>
          prev.map((room) => {
            // match by roomId on the payload first, fall back to current active room
            const isTarget = msg.roomId ? room.id === msg.roomId : room.id === currentRoom;
            if (!isTarget) return room;
            return {
              ...room,
              messages: room.messages.find((m) => m.id === formatted.id)
                ? room.messages
                : [...room.messages, formatted],
              lastMessage: formatted.text,
              time: "now",
              unread: room.id === currentRoom ? 0 : room.unread + 1,
            };
          })
        );
      }

      if (data.type === "typing" && data.userId !== me) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }

      if (data.type === "online") {
        setRooms((prev) => prev.map((r) => r.id === data.userId ? { ...r, online: true } : r));
      }
      if (data.type === "offline") {
        setRooms((prev) => prev.map((r) => r.id === data.userId ? { ...r, online: false } : r));
      }
    };

    return () => { ws.close(); socketRef.current = null; };
  }, [me, token]); // ← activeRoomId removed — ref keeps it fresh without reconnecting

  // ── Open chat ────────────────────────────────────────────────────────────
  const openRoom = useCallback(async (id: string) => {
    setActiveRoomId(id);
    setReplyTo(null);
    setShowInfo(false);

    // Join room via WS
    socketRef.current?.send(JSON.stringify({ type: "join_room", roomId: id }));

    // Fetch messages
    try {
      const res = await fetch(`${API}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, messages: data.messages.map((m: any) => formatMsg(m, me)), unread: 0 }
              : r
          )
        );
      }
    } catch { /* ignore */ }

    // Mark as read
    socketRef.current?.send(JSON.stringify({ type: "read", roomId: id }));
  }, [me, token]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages.length, isTyping]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!atBottom);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || !socketRef.current || !activeRoomId) return;
    const ws = socketRef.current;
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "chat", message: input, roomId: activeRoomId }));
    setInput("");
    setReplyTo(null);
  }, [input, activeRoomId]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (activeRoomId && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing", roomId: activeRoomId }));
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  // ── Local message actions ─────────────────────────────────────────────────
  const addReaction = (msgId: string, r: Reaction) => {
    setRooms((prev) => prev.map((room) =>
      room.id !== activeRoomId ? room : {
        ...room,
        messages: room.messages.map((m) =>
          m.id === msgId ? { ...m, reactions: [...m.reactions, r] } : m
        ),
      }
    ));
  };

  const deleteMessage = (msgId: string) => {
    setRooms((prev) => prev.map((room) =>
      room.id !== activeRoomId ? room : {
        ...room,
        messages: room.messages.filter((m) => m.id !== msgId),
      }
    ));
  };

  // ── Create room ───────────────────────────────────────────────────────────
  const createRoom = async (name: string) => {
    setShowCreateRoom(false);
    try {
      const res = await fetch(`${API}/user/createroom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) fetchRooms();
    } catch { /* ignore */ }
  };

  const replySource = replyTo ? activeRoom?.messages.find((m) => m.id === replyTo) : undefined;
  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen w-full flex bg-gray-950 overflow-hidden font-sans">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/6 blur-[140px]" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-violet-700/6 blur-[100px]" />
      </div>

      {/* ── Sidebar ── */}
      <div className="relative z-10 w-80 flex-shrink-0 flex flex-col border-r border-gray-800/60 bg-gray-900/70 backdrop-blur-xl">

        {/* User profile header */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            {profile ? (
              <Avatar grad={profile.avatar} size="md" char={profile.username[0]?.toUpperCase()} online />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.username ?? "…"}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateRoom(true)}
                title="New room"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150">
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "settings" ? "chats" : "settings")}
                title="Settings"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${activeTab === "settings" ? "text-indigo-400 bg-indigo-500/10" : "text-gray-500 hover:text-white hover:bg-gray-800/60"}`}>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {activeTab === "chats" ? (
          <>
            {/* Search */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2.5 bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-2 focus-within:border-indigo-500/40 transition-all">
                <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col gap-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-800" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-800 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-800/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 h-40 text-center px-6">
                  <MessageCircle className="w-8 h-8 text-gray-700" />
                  <p className="text-xs text-gray-600">No chats yet. Create one with the <Plus className="w-3 h-3 inline" /> button.</p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => openRoom(room.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group relative ${
                        activeRoomId === room.id
                          ? "bg-indigo-500/10 border-r-2 border-indigo-500"
                          : "hover:bg-gray-800/40"
                      }`}
                    >
                      <Avatar grad={room.avatar} size="md" char={room.name[0]?.toUpperCase()} online={room.online} />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-white truncate">{room.name}</span>
                          <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">{room.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate flex-1">{room.lastMessage || "No messages yet"}</p>
                          {room.unread > 0 && (
                            <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                              {room.unread > 99 ? "99+" : room.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Settings panel */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-1 mb-4">Preferences</p>
            {[
              { icon: <Bell className="w-4 h-4" />, label: "Notifications", desc: "Manage alerts" },
              { icon: <Moon className="w-4 h-4" />, label: "Appearance", desc: "Dark mode active" },
              { icon: <Shield className="w-4 h-4" />, label: "Privacy", desc: "Who can message you" },
              { icon: <User className="w-4 h-4" />, label: "Account", desc: profile?.email ?? "" },
            ].map((item) => (
              <button key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:border-gray-700/60 hover:bg-gray-800/60 transition-all duration-150 text-left group">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-xs text-gray-600 truncate">{item.desc}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-700 -rotate-90 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}

            <div className="pt-4 border-t border-gray-800/60">
              <button
                onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-150">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Chat area ── */}
      <div className="relative z-10 flex-1 flex min-w-0">
        {activeRoom ? (
          <>
            {/* Chat column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/60">
                <button
                  onClick={() => setActiveRoomId(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800/60 transition-all lg:hidden">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar grad={activeRoom.avatar} char={activeRoom.name[0]?.toUpperCase()} size="md" online={activeRoom.online} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">{activeRoom.name}</h2>
                  <div className="flex items-center gap-1.5">
                    {isTyping ? (
                      <span className="text-xs text-indigo-400 font-medium animate-pulse">typing…</span>
                    ) : activeRoom.online ? (
                      <>
                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                        <span className="text-xs text-emerald-400 font-medium">Online</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600">Offline</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { icon: <Phone className="w-4 h-4" />, label: "Call" },
                    { icon: <Video className="w-4 h-4" />, label: "Video" },
                    { icon: <Search className="w-4 h-4" />, label: "Search" },
                  ].map((b) => (
                    <button key={b.label} title={b.label}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800/60 transition-all duration-150">
                      {b.icon}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowInfo((v) => !v)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${showInfo ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-white hover:bg-gray-800/60"}`}>
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
                style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.03) 0%, transparent 60%)" }}
              >
                {activeRoom.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeRoom.avatar} flex items-center justify-center text-white font-bold text-xl`}>
                      {activeRoom.name[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-semibold">{activeRoom.name}</p>
                    <p className="text-xs text-gray-600">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  activeRoom.messages.map((msg, idx) => (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.senderId === me}
                      grouped={shouldGroup(activeRoom.messages, idx)}
                      replySource={msg.replyTo ? activeRoom.messages.find((m) => m.id === msg.replyTo) : undefined}
                      contactGrad={activeRoom.avatar}
                      onReply={setReplyTo}
                      onDelete={deleteMessage}
                      onReact={addReaction}
                    />
                  ))
                )}

                {isTyping && <TypingIndicator grad={activeRoom.avatar} />}
                <div ref={messagesEndRef} className="h-2" />

                {showScrollBtn && (
                  <div className="sticky bottom-0 flex justify-end pointer-events-none">
                    <button
                      onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="pointer-events-auto w-10 h-10 rounded-full bg-gray-800/90 backdrop-blur border border-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white shadow-xl">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Reply bar */}
              {replyTo && replySource && (
                <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-900/80 border-t border-gray-800/40 backdrop-blur">
                  <div className="flex-1 flex items-start gap-2 pl-3 border-l-2 border-indigo-500 min-w-0">
                    <Reply className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-indigo-400 mb-0.5">
                        Replying to {replySource.senderId === me ? "yourself" : activeRoom.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{replySource.text}</p>
                    </div>
                  </div>
                  <button onClick={() => setReplyTo(null)}
                    className="w-6 h-6 rounded-lg bg-gray-800/60 flex items-center justify-center text-gray-500 hover:text-white transition-colors flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Input bar */}
              <div className="px-4 md:px-6 py-4 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800/60">
                <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/40 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200">
                  <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0">
                    <Paperclip className="w-[18px] h-[18px]" />
                  </button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={`Message ${activeRoom.name}…`}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none min-w-0"
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors">
                      <ImageIcon className="w-[18px] h-[18px]" />
                    </button>
                    {input.trim() ? (
                      <button onClick={sendMessage}
                        className="ml-1 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-150 shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95">
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => setRecording((v) => !v)}
                        className={`ml-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${recording ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" : "text-gray-600 hover:text-gray-300 hover:bg-gray-700/40"}`}>
                        {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-center text-[10px] text-gray-700 mt-2">
                  Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[9px] font-mono">Enter</kbd> to send ·{" "}
                  <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[9px] font-mono">Esc</kbd> to cancel reply
                </p>
              </div>
            </div>

            {/* Info sidebar */}
            {showInfo && (
              <div className="w-72 flex-shrink-0 border-l border-gray-800/60 bg-gray-900/80 backdrop-blur-xl flex flex-col hidden lg:flex">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
                  <span className="text-sm font-bold text-white">Room Info</span>
                  <button onClick={() => setShowInfo(false)}
                    className="w-7 h-7 rounded-lg bg-gray-800/60 flex items-center justify-center text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col items-center gap-3 px-5 py-8 border-b border-gray-800/60">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeRoom.avatar} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {activeRoom.name[0]?.toUpperCase()}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-white">{activeRoom.name}</h3>
                      <p className={`text-xs mt-1 ${activeRoom.online ? "text-emerald-400" : "text-gray-600"}`}>
                        {activeRoom.online ? "Online" : "Offline"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        { icon: <Phone className="w-4 h-4" />, label: "Call" },
                        { icon: <Video className="w-4 h-4" />, label: "Video" },
                        { icon: <Search className="w-4 h-4" />, label: "Search" },
                      ].map((a) => (
                        <button key={a.label}
                          className="flex flex-col items-center gap-1 w-14 py-2 rounded-xl bg-gray-800/60 border border-gray-700/40 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all group">
                          <span className="text-gray-500 group-hover:text-indigo-400 transition-colors">{a.icon}</span>
                          <span className="text-[9px] text-gray-600 group-hover:text-gray-400">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-widest">Room ID</p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-800/40 rounded-lg px-3 py-2 break-all">{activeRoom.id}</p>
                    <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-widest mt-4">Messages</p>
                    <p className="text-sm text-gray-300">{activeRoom.messages.length} messages</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-indigo-500/60" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Your messages</h3>
              <p className="text-gray-600 text-sm max-w-xs">Select a conversation from the sidebar or create a new room to get started.</p>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4" />
              New Chat Room
            </button>
          </div>
        )}
      </div>

      {/* Create room modal */}
      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} onCreate={createRoom} />}
    </div>
  );
}