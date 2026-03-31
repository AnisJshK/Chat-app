import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Search,
  Settings,
  LogOut,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  ChevronRight,
  Bell,
  Moon,
  Shield,
  User,
  Edit3,
  Check,
  X,
  Hash,
  Circle,
  CheckCheck,
  Image as ImageIcon,
  Mic,
} from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const ME = "me";

const gradients = [
  "from-indigo-500 to-violet-500",
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to amber-500",
];

function getGradient(id: string) {
  return gradients[id.charCodeAt(0) % gradients.length];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 60) return "now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";

  return date.toLocaleDateString();
}

function formatMsg(m: any): Message {
  return {
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    time: formatTime(m.createdAt),
    status: m.status.toLowerCase(),
  };
}

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await fetch("http://localhost:3001/user/rooms", {
        headers: {
          Authorization: localStorage.getItem("token") || "",
        },
      });

      const data = await res.json();

      setChats(
        data.rooms.map((r: any) => ({
          id: r.roomId,
          name: r.name,
          avatar: getGradient(r.roomId),
          lastMessage: r.lastMessage,
          time: formatTime(r.time),
          unread: r.unread,
          online: false,
          messages: [],
        })),
      );
      setLoading(false);
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = new WebSocket(`ws://localhost:8080?token=${token}`);
    socketRef.current = socket;

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "chat") {
        const msg = data.message;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id === activeChatId) {
              return {
                ...chat,
                messages: [...chat.messages, formatMsg(msg)],
                lastMessage: msg.text,
                time: "now",
              };
            } else {
              return {
                ...chat,
                unread: chat.unread + 1,
                lastMessage: msg.text,
                time: "now",
              };
            }
          }),
        );
      }
      if (data.type === "online") {
        setChats((prev) =>
          prev.map((c) => (c.id === data.userId ? { ...c, online: true } : c)),
        );
      }
      if (data.type === "offline") {
        setChats((prev) =>
          prev.map((c) => (c.id === data.userId ? { ...c, online: false } : c)),
        );
      }
    };
    return ()=>socket.close();
  }, [activeChatId]);

  async function openChat(id:string){
    setActiveChatId(id);

    socketRef.current?.send(JSON.stringify({
        type:"join_room",
        roomId:id,
    }));

    const res = await fetch(`http://localhost:3001/messages/${id}`,{
        headers:{
            Authorization:localStorage.getItem("token")||"",
        },
    });
    const data = await res.json();

    setChats(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              messages: data.messages.map(formatMsg),
              unread: 0,
            }
          : c
      )
    );

    socketRef.current?.send(JSON.stringify({
        type:"read",
        roomId:id,
    }));
  };

  function sendMessage(){
    if(!input.trim()||!socketRef.current)return;

    socketRef.current.send(JSON.stringify({
        type:"chat",
        message:input,
    }));
    setInput("");
  };

  return (
    <div className="h-screen flex bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="w-72 border-r border-gray-800 p-3">
        <h2 className="font-bold mb-3">Messages</h2>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full p-2 bg-gray-800 rounded mb-3"
        />

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : chats.length === 0 ? (
          <p className="text-gray-500 text-sm">No chats</p>
        ) : (
          chats
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .map(chat => (
              <div
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className="p-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex justify-between">
                  <span>{chat.name}</span>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="bg-indigo-600 text-xs px-2 rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">

        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              {activeChat.name}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {activeChat.messages.map(m => (
                <div
                  key={m.id}
                  className={`flex ${m.senderId === ME ? "justify-end" : ""}`}
                >
                  <div className="bg-gray-800 p-2 rounded">
                    {m.text}
                    <div className="text-xs text-gray-500 flex gap-1">
                      {m.time}
                      {m.senderId === ME && (
                        m.status === "read" ? <CheckCheck size={12} /> :
                        m.status === "delivered" ? <CheckCheck size={12} /> :
                        <Check size={12} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-gray-800 p-2 rounded"
              />
              <button onClick={sendMessage}>
                <Send />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat
          </div>
        )}

      </div>
    </div>
  );
}