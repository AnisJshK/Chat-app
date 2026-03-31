import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Search, Settings, LogOut, Phone, Video,
  MoreVertical, Send, Paperclip, Smile, ChevronRight,
  Bell, Moon, Shield, User, Edit3, Check, X, Hash,
  Circle, CheckCheck, Image as ImageIcon, Mic,
} from "lucide-react";

interface Message{
    id:string,
    senderId:string,
    text:string,
    time:string,
    status:"sent"|"delivered"|"read";
}

interface Chat{
    id:string,
    name:string,
    avatar:string,
    lastMessage:string,
    time:string;
    unread:string;
    online:boolean;
    messages:Message[];
}

