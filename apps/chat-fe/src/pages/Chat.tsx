import { useState, useRef, useEffect, useCallback } from "react";
import {
  Phone, Video, Info, Send, Paperclip, Smile,
  Check, CheckCheck, ArrowLeft, Search,
  MoreVertical, Reply, Trash2, Copy, Heart,
  ThumbsUp, Laugh, Angry, X, Mic, MicOff,
  Image as ImageIcon, File, Download, ChevronDown,
  Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reaction = "❤️" | "👍" | "😂" | "😮" | "😢" | "😡";
type Status = "sent" | "delivered" | "read";

interface Attachment {
  type: "image" | "file";
  name: string;
  size?: string;
  preview?: string; // gradient placeholder color class
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  fullTime: string;
  status: Status;
  reactions: Reaction[];
  replyTo?: string; // id of replied message
  attachment?: Attachment;
  isSystem?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ME = "me";
const CONTACT = {
  id: "aria",
  name: "Aria Patel",
  role: "Product Designer",
  avatar: "from-indigo-500 to-violet-500",
  online: true,
  lastSeen: "Just now",
  mutualGroups: 3,
  phone: "+91 98765 43210",
  email: "aria@chatnova.app",
};

const SHARED_IMAGES = [
  "from-indigo-600 to-violet-700",
  "from-violet-600 to-pink-600",
  "from-blue-600 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-purple-600 to-violet-700",
  "from-cyan-600 to-blue-600",
];

const EMOJI_LIST: Reaction[] = ["❤️", "👍", "😂", "😮", "😢", "😡"];

const INIT_MESSAGES: Message[] = [
  {
    id: "m1", senderId: "aria", text: "Hey! Are you free tomorrow?",
    time: "10:28 AM", fullTime: "10:28 AM", status: "read", reactions: [],
  },
  {
    id: "m2", senderId: ME, text: "Yeah, I think so. What's up?",
    time: "10:29 AM", fullTime: "10:29 AM", status: "read", reactions: ["❤️"],
  },
  {
    id: "m3", senderId: "aria",
    text: "Want to catch up over coffee? I have some exciting news to share 😊",
    time: "10:30 AM", fullTime: "10:30 AM", status: "read", reactions: [],
  },
  {
    id: "m4", senderId: "aria",
    text: "I got promoted to Lead Designer! 🎉",
    time: "10:30 AM", fullTime: "10:30 AM", status: "read", reactions: ["❤️", "👍"],
  },
  {
    id: "m5", senderId: ME, text: "Oh wow, that's AMAZING! Congrats Aria!! 🎊",
    time: "10:31 AM", fullTime: "10:31 AM", status: "read", reactions: [],
    replyTo: "m4",
  },
  {
    id: "m6", senderId: ME, text: "11am at the usual spot? Coffee's on me!",
    time: "10:32 AM", fullTime: "10:32 AM", status: "read", reactions: [],
  },
  {
    id: "m7", senderId: "aria", text: "Sounds perfect! See you then 👋",
    time: "10:33 AM", fullTime: "10:33 AM", status: "read", reactions: [],
    attachment: {
      type: "image", name: "coffee_spot.jpg", preview: "from-amber-600 to-orange-700",
    },
  },
  {
    id: "msys1", senderId: "system", text: "You matched on ChatNova · 3 months ago",
    time: "", fullTime: "", status: "read", reactions: [], isSystem: true,
  },
  {
    id: "m8", senderId: ME,
    text: "Also, can you share the design files from last week's sprint?",
    time: "2:14 PM", fullTime: "2:14 PM", status: "read", reactions: [],
  },
  {
    id: "m9", senderId: "aria", text: "Sure! Here you go 📁",
    time: "2:16 PM", fullTime: "2:16 PM", status: "read", reactions: [],
    attachment: { type: "file", name: "Sprint_07_Designs.fig", size: "8.4 MB" },
  },
  {
    id: "m10", senderId: "aria", text: "Let me know if you need anything else!",
    time: "2:16 PM", fullTime: "2:16 PM", status: "read", reactions: ["👍"],
  },
  {
    id: "m11", senderId: ME, text: "Perfect, thanks!",
    time: "2:18 PM", fullTime: "2:18 PM", status: "delivered", reactions: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shouldGroup(msgs: Message[], idx: number) {
  if (idx === 0) return false;
  const prev = msgs[idx - 1];
  const curr = msgs[idx];
  return prev.senderId === curr.senderId && !prev.isSystem && !curr.isSystem;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  grad, size = "md", online,
}: { grad: string; size?: "xs" | "sm" | "md" | "lg"; online?: boolean }) {
  const sz = size === "xs" ? "w-6 h-6" : size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const dot = size === "xs" || size === "sm" ? "w-2 h-2 border" : "w-2.5 h-2.5 border-2";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${grad}`} />
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-gray-900 ${online ? "bg-emerald-500" : "bg-gray-600"}`} />
      )}
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

function ReactionBar({ onPick, onClose }: { onPick: (r: Reaction) => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl px-2 py-1.5 shadow-xl shadow-black/40">
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          onClick={() => { onPick(e); onClose(); }}
          className="text-lg hover:scale-125 transition-transform duration-150 px-1"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({
  isMe, onReply, onCopy, onDelete, onReact, onClose,
}: {
  isMe: boolean;
  onReply: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onReact: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={`absolute ${isMe ? "right-0" : "left-0"} -top-2 -translate-y-full z-50 flex flex-col bg-gray-800/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl overflow-hidden shadow-xl shadow-black/40 min-w-[160px]`}
      onMouseLeave={onClose}
    >
      {[
        { icon: <Smile className="w-3.5 h-3.5" />, label: "React", action: onReact },
        { icon: <Reply className="w-3.5 h-3.5" />, label: "Reply", action: onReply },
        { icon: <Copy className="w-3.5 h-3.5" />, label: "Copy", action: onCopy },
        { icon: <Trash2 className="w-3.5 h-3.5" />, label: "Delete", action: onDelete, danger: true },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-gray-300 hover:bg-gray-700/60 hover:text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({
  msg, isMe, grouped, replySource, messages,
  onReply, onDelete, onReact,
}: {
  msg: Message;
  isMe: boolean;
  grouped: boolean;
  replySource?: Message;
  messages: Message[];
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, r: Reaction) => void;
}) {
  const [showCtx, setShowCtx] = useState(false);
  const [showReact, setShowReact] = useState(false);

  if (msg.isSystem) {
    return (
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-gray-800/60" />
        <span className="text-[10px] text-gray-600 font-medium px-3 py-1 bg-gray-800/40 rounded-full border border-gray-700/30">
          {msg.text}
        </span>
        <div className="flex-1 h-px bg-gray-800/60" />
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2 ${grouped ? "mt-0.5" : "mt-4"}`}>
      {/* Avatar — only for first in group */}
      <div className="w-8 flex-shrink-0">
        {!grouped && !isMe && <Avatar grad={CONTACT.avatar} size="sm" />}
      </div>

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-xs lg:max-w-md xl:max-w-lg relative`}>
        {/* Reply preview */}
        {msg.replyTo && replySource && (
          <div className={`flex items-start gap-2 mb-1 px-3 py-2 rounded-xl bg-gray-800/50 border-l-2 border-indigo-500/60 text-xs text-gray-400 max-w-full ${isMe ? "self-end" : "self-start"}`}>
            <Reply className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="text-indigo-400 font-medium text-[10px] mb-0.5">
                {replySource.senderId === ME ? "You" : CONTACT.name}
              </p>
              <p className="truncate text-gray-500">{replySource.text}</p>
            </div>
          </div>
        )}

        {/* Bubble + context */}
        <div
          className="relative group"
          onContextMenu={(e) => { e.preventDefault(); setShowCtx(true); }}
        >
          {/* Hover actions */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-full mr-2" : "left-full ml-2"} hidden group-hover:flex items-center gap-1`}>
            <button
              onClick={() => setShowReact(true)}
              className="w-7 h-7 rounded-lg bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReply(msg.id)}
              className="w-7 h-7 rounded-lg bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCtx(true)}
              className="w-7 h-7 rounded-lg bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
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
            <ContextMenu
              isMe={isMe}
              onReply={() => onReply(msg.id)}
              onCopy={() => navigator.clipboard?.writeText(msg.text)}
              onDelete={() => onDelete(msg.id)}
              onReact={() => setShowReact(true)}
              onClose={() => setShowCtx(false)}
            />
          )}

          {/* Image attachment */}
          {msg.attachment?.type === "image" && (
            <div className={`mb-1.5 w-52 h-36 rounded-xl bg-gradient-to-br ${msg.attachment.preview} overflow-hidden relative group/img`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 bg-black/30 transition-opacity rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-full">
                {msg.attachment.name}
              </div>
            </div>
          )}

          {/* File attachment */}
          {msg.attachment?.type === "file" && (
            <div className={`mb-1.5 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/40 w-64`}>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <File className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{msg.attachment.name}</p>
                <p className="text-xs text-gray-500">{msg.attachment.size}</p>
              </div>
              <button className="text-gray-500 hover:text-indigo-400 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Text bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
              isMe
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20"
                : "bg-gray-800/80 border border-gray-700/40 text-gray-100 rounded-bl-sm"
            }`}
          >
            {msg.text}
            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
              <span className="text-[10px] opacity-40">{msg.time}</span>
              {isMe && (
                msg.status === "read"
                  ? <CheckCheck className="w-3 h-3 text-indigo-200 opacity-80" />
                  : msg.status === "delivered"
                  ? <CheckCheck className="w-3 h-3 opacity-40" />
                  : <Check className="w-3 h-3 opacity-40" />
              )}
            </div>
          </div>
        </div>

        {/* Reactions display */}
        {msg.reactions.length > 0 && (
          <div className={`flex items-center gap-0.5 mt-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <div className="flex items-center gap-0.5 bg-gray-800/80 border border-gray-700/40 rounded-full px-2 py-0.5 text-xs">
              {[...new Set(msg.reactions)].map((r) => (
                <span key={r} className="text-sm leading-none">{r}</span>
              ))}
              {msg.reactions.length > 1 && (
                <span className="text-gray-500 ml-1 text-[10px]">{msg.reactions.length}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Emoji Picker (simple grid) ───────────────────────────────────────────────

const COMMON_EMOJIS = [
  "😀","😂","🥰","😍","🤩","😎","🥳","🎉",
  "👍","❤️","🔥","✨","💯","🙌","👏","🎊",
  "😢","😭","😅","🤔","😮","😱","🙏","💪",
  "🚀","⭐","💎","🌟","💫","🎯","🏆","✅",
];

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 bg-gray-800/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-3 shadow-xl shadow-black/40 w-56">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-gray-400">Quick Emoji</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-0.5">
        {COMMON_EMOJIS.map((e) => (
          <button key={e} onClick={() => onPick(e)}
            className="text-xl hover:scale-125 transition-transform duration-100 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/60">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Info Sidebar ─────────────────────────────────────────────────────────────

function InfoSidebar({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"about" | "media" | "files">("about");

  return (
    <div className="w-72 h-full flex flex-col bg-gray-900/95 backdrop-blur-xl border-l border-gray-800/60">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
        <span className="text-sm font-bold text-white">Contact Info</span>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-800/60 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-gray-800/60">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25" />
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-white">{CONTACT.name}</h3>
            <p className="text-sm text-indigo-400">{CONTACT.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: <Phone className="w-4 h-4" />, label: "Call" },
              { icon: <Video className="w-4 h-4" />, label: "Video" },
              { icon: <Search className="w-4 h-4" />, label: "Search" },
            ].map((a) => (
              <button key={a.label}
                className="flex flex-col items-center gap-1 w-14 py-2 rounded-xl bg-gray-800/60 border border-gray-700/40 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all duration-150 group">
                <span className="text-gray-500 group-hover:text-indigo-400 transition-colors">{a.icon}</span>
                <span className="text-[9px] text-gray-600 group-hover:text-gray-400">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="px-5 py-4 border-b border-gray-800/60 space-y-3">
          {[
            { label: "Phone", value: CONTACT.phone },
            { label: "Email", value: CONTACT.email },
            { label: "Mutual groups", value: `${CONTACT.mutualGroups} groups` },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[10px] text-gray-600 uppercase font-semibold tracking-widest mb-0.5">{r.label}</p>
              <p className="text-sm text-gray-300">{r.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800/60">
          {(["media", "files"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-all duration-150 relative ${tab === t ? "text-white" : "text-gray-600 hover:text-gray-400"}`}>
              {t}
              {tab === t && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Media grid */}
        {tab === "media" && (
          <div className="p-3 grid grid-cols-3 gap-1.5">
            {SHARED_IMAGES.map((g, i) => (
              <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${g} cursor-pointer hover:scale-105 transition-transform duration-150 shadow-md`} />
            ))}
          </div>
        )}

        {/* Files */}
        {tab === "files" && (
          <div className="p-3 space-y-2">
            {["Sprint_07_Designs.fig", "Wireframes_v2.pdf", "Assets.zip"].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:border-gray-700/60 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <File className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate font-medium">{f}</p>
                  <p className="text-[10px] text-gray-600">{["8.4 MB", "2.1 MB", "14 MB"][i]}</p>
                </div>
                <Download className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mt-4">
      <Avatar grad={CONTACT.avatar} size="sm" />
      <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scroll-to-bottom button ──────────────────────────────────────────────────

function ScrollBtn({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-gray-800/90 backdrop-blur border border-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/90 shadow-xl transition-all duration-200 hover:scale-105"
    >
      {count > 0 ? (
        <span className="text-xs font-bold text-indigo-400">{count}</span>
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [params] = useSearchParams();
  const roomId = params.get("roomId");

  const ME = localStorage.getItem("userId") || "me";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const [recording, setRecording] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── FETCH MESSAGES ─────────────────
  const fetchMessages = async () => {
    if (!roomId) return;

    const res = await fetch(`${API}/messages/${roomId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    const formatted = (data.messages || []).map((msg: any) => ({
      id: msg.id,
      senderId: msg.userId,
      text: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fullTime: new Date(msg.createdAt).toLocaleString(),
      status: msg.status.toLowerCase(),
      reactions: [],
    }));

    setMessages(formatted);
  };

  // ─── CONNECT WS ─────────────────────
  const connectWS = () => {
    if (socketRef.current) return;

    const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("token")}`);

    ws.onopen = () => {
      if (roomId) {
        ws.send(JSON.stringify({ type: "join_room", roomId }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;

          return [
            ...prev,
            {
              id: data.message.id,
              senderId: data.message.userId,
              text: data.message.content,
              time: new Date(data.message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullTime: new Date(data.message.createdAt).toLocaleString(),
              status: data.message.status.toLowerCase(),
              reactions: [],
            },
          ];
        });
      }

      if (data.type === "typing") {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1000);
      }
    };

    socketRef.current = ws;
  };

  // ─── SEND MESSAGE ───────────────────
  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !roomId) return;

    socketRef.current.send(JSON.stringify({
      type: "chat",
      message: input,
      roomId,
    }));

    setInput("");
    setReplyTo(null);
    setShowEmoji(false);
  };

  // ─── EFFECTS ────────────────────────
  useEffect(() => {
    if (!roomId) return;

    connectWS();
    fetchMessages();

    socketRef.current?.send(JSON.stringify({
      type: "join_room",
      roomId,
    }));
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen w-full flex bg-gray-950 overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-violet-700/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-600/4 blur-[80px]" />
      </div>

      {/* ── Main chat column ── */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-5 py-3.5 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/60">
          {/* Back */}
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800/60 transition-all duration-150 lg:hidden">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Contact info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{CONTACT.name}</h2>
              <div className="flex items-center gap-1.5">
                {isTyping ? (
                  <span className="text-xs text-indigo-400 font-medium animate-pulse">typing…</span>
                ) : (
                  <>
                    <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                    <span className="text-xs text-emerald-400 font-medium">Online</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[
              { icon: <Phone className="w-4 h-4" />, label: "Call" },
              { icon: <Video className="w-4 h-4" />, label: "Video" },
              { icon: <Search className="w-4 h-4" />, label: "Search" },
            ].map((b) => (
              <button key={b.label}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800/60 transition-all duration-150"
                title={b.label}>
                {b.icon}
              </button>
            ))}
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                showInfo ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-white hover:bg-gray-800/60"
              }`}
              title="Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-4 relative"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.03) 0%, transparent 60%)" }}
        >
          {/* Date pill */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-800/60" />
            <span className="text-[10px] text-gray-600 font-medium px-3 py-1 bg-gray-800/40 rounded-full border border-gray-700/30">
              Today
            </span>
            <div className="flex-1 h-px bg-gray-800/60" />
          </div>

          {/* Bubble list */}
          {messages.map((msg, idx) => (
            <Bubble
              key={msg.id}
              msg={msg}
              isMe={msg.senderId === ME}
              grouped={shouldGroup(messages, idx)}
              replySource={msg.replyTo ? getMsg(msg.replyTo) : undefined}
              messages={messages}
              onReply={setReplyTo}
              onDelete={deleteMessage}
              onReact={addReaction}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} className="h-2" />

          {/* Scroll button */}
          {showScrollBtn && (
            <div className="sticky bottom-0 flex justify-end pointer-events-none">
              <div className="pointer-events-auto">
                <ScrollBtn onClick={scrollToBottom} count={unreadBelow} />
              </div>
            </div>
          )}
        </div>

        {/* ── Reply preview bar ── */}
        {replyTo && replySource && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-900/80 border-t border-gray-800/40 backdrop-blur">
            <div className="flex-1 flex items-start gap-2 pl-3 border-l-2 border-indigo-500 min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-indigo-400 mb-0.5">
                  Replying to {replySource.senderId === ME ? "yourself" : CONTACT.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{replySource.text}</p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="w-6 h-6 rounded-lg bg-gray-800/60 flex items-center justify-center text-gray-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="px-4 md:px-6 py-4 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800/60">
          <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/40 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200 relative">

            {/* Emoji */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${showEmoji ? "bg-indigo-500/20 text-indigo-400" : "text-gray-600 hover:text-gray-300"}`}
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmoji && (
                <EmojiPicker
                  onPick={(e) => { setInput((v) => v + e); inputRef.current?.focus(); }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${CONTACT.name}…`}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none min-w-0"
            />

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors">
                <Paperclip className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </button>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors">
                <ImageIcon className="w-[18px] h-[18px]" />
              </button>

              {input.trim() ? (
                <button
                  onClick={sendMessage}
                  className="ml-1 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-150 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setRecording((v) => !v)}
                  className={`ml-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    recording
                      ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                      : "text-gray-600 hover:text-gray-300 hover:bg-gray-700/40"
                  }`}
                >
                  {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-2">
            Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[9px] font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[9px] font-mono">Esc</kbd> to cancel reply
          </p>
        </div>
      </div>

      {/* ── Info Sidebar ── */}
      {showInfo && (
        <div className="relative z-10 hidden lg:block">
          <InfoSidebar onClose={() => setShowInfo(false)} />
        </div>
      )}
    </div>
  );
}