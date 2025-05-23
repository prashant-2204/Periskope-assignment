"use client";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import ChatList, { User, Chat, Message } from './components/ChatList';
import ChatArea from './components/ChatArea';
import Header from './components/Header';
import { GroupModal, NewChatModal, AddMembersModal } from './components/Modals';
import {
  FaHome, FaPuzzlePiece, FaChartLine, FaUsers, FaBook, FaRegImage, FaSlidersH, FaCog, FaStar, FaQuestionCircle, FaBullhorn
} from "react-icons/fa";
import {
  FiLogOut, FiUsers as FiUsersIcon, FiRefreshCw, FiSettings, FiMessageCircle, FiList, FiBell, FiTag, FiShare2, FiAtSign, FiImage, FiEdit2
} from "react-icons/fi";
import { BiSolidMessageRoundedDots } from "react-icons/bi";
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import {
  fetchUserChats,
  fetchChatMessagesWithSenders,
  sendMessage,
  fetchAllUsers,
  createGroupChat,
  createDirectChat
} from "@/lib/supabaseApi";

function ensureUser(obj: any, fallbackId: string = ''): User {
  if (obj && typeof obj.id === 'string' && typeof obj.email === 'string' && typeof obj.full_name === 'string') {
    return obj as User;
  }
  return {
    id: fallbackId,
    email: obj?.email || fallbackId,
    full_name: obj?.full_name || obj?.sender_name || fallbackId,
  };
}

export default function ChatsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState<boolean>(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>("");
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupLoading, setGroupLoading] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(340);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [mainLabel, setMainLabel] = useState<string>("Chats");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showGreenMenu, setShowGreenMenu] = useState<boolean>(false);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatSearch, setNewChatSearch] = useState<string>("");
  const [newChatUsers, setNewChatUsers] = useState<User[]>([]);
  const [newChatLoading, setNewChatLoading] = useState<boolean>(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [showChatFilter, setShowChatFilter] = useState<boolean>(false);
  const [chatFilterValue, setChatFilterValue] = useState<string>("");
  const [labelInputChatId, setLabelInputChatId] = useState<string | null>(null);
  const [labelInputValue, setLabelInputValue] = useState<string>("");
  const [labelLoading, setLabelLoading] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; chatId: string | null; isGroup: boolean }>({ visible: false, x: 0, y: 0, chatId: null, isGroup: false });
  const [showAddMembersModal, setShowAddMembersModal] = useState<boolean>(false);
  const [messagesCache, setMessagesCache] = useState<{ [chatId: string]: Message[] }>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [userCache, setUserCache] = useState<{ [id: string]: User }>({});

  // Section icon mapping for header
  const sectionIcons: Record<string, any> = {
    Home: FaHome,
    Chats: FiMessageCircle,
    List: FiList,
    Tag: FiTag,
    Contacts: FiUsersIcon,
    Settings: FiSettings,
    Notifications: FiBell,
    Puzzle: FaPuzzlePiece,
    Chart: FaChartLine,
    Announcement: FaBullhorn,
    Network: FaUsers,
    Book: FaBook,
    Gallery: FaRegImage,
    Toggles: FaSlidersH,
  };

  // Define CSS variables for header, filter, and chat header heights at the top of the component (inside the function, before return):
  const HEADER_HEIGHT = 56; // px, main header
  const FILTER_HEIGHT = 48; // px, filter row
  const CHAT_HEADER_HEIGHT = 56; // px, chat area header

  // Fetch chats for user
  useEffect(() => {
    if (!authLoading && user) {
      setChatsLoading(true);
      fetchUserChats(user.id)
        .then(data => {
          setChats(data);
          setChatsLoading(false);
          if (data.length > 0) setSelectedChat(data[0]);
          // Build user cache from all chat members
          const cache: { [id: string]: User } = {};
          data.forEach((chat: any) => {
            (chat.members || []).forEach((member: User) => {
              if (member && member.id) cache[member.id] = member;
            });
          });
          setUserCache(cache);
        })
        .catch(() => {
          toast.error("Failed to load chats");
          setChatsLoading(false);
        });
    }
  }, [authLoading, user]);

  // On chat open, check cache before fetching
  useEffect(() => {
    if (!selectedChat || !user) return;
    const cached = messagesCache[selectedChat.id];
    if (cached) {
      //console.log('Using cached messages:', cached);
      setMessages(cached);
      setMessagesLoading(false);
    } else {
      setMessagesLoading(true);
      fetchChatMessagesWithSenders(selectedChat.id, user.id)
        .then(data => {
          //console.log('Fetched messages from backend:', data);
          const updated = (Array.isArray(data) ? data : [])
            .map(m => ({
              ...m,
              sender: ensureUser(m.sender, m.sender_id || '')
            } as Message));
          //console.log('Mapped messages to set:', updated);
          setMessages(updated);
          setMessagesCache(prev => ({ ...prev, [selectedChat.id]: updated }));
          setMessagesLoading(false);
        })
        .catch(() => {
          toast.error("Failed to load messages");
          setMessagesLoading(false);
        });
    }
  }, [selectedChat, user]);

  // Subscribe to all messages for all chats
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime-all-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async payload => {
          const msg = payload.new;
          // Enrich msg with sender info from userCache
          let sender: User | null = userCache[msg.sender_id] || null;
          if (!sender && selectedChat) {
            const found = (selectedChat.members || []).find((m: User) => m.id === msg.sender_id);
            sender = found ? found : null;
          }
          // If still not found, fetch from Supabase and update cache
          if (!sender) {
            sender = await fetchUserById(msg.sender_id);
            if (sender) {
              setUserCache(prev => ({ ...prev, [sender!.id]: sender! }));
            }
          }
          // Fallback to minimal User object if not found
          if (!sender) {
            sender = { id: msg.sender_id, email: msg.sender_id } as User;
          }
          const sender_name = sender.full_name?.trim()
            ? sender.full_name
            : sender.email?.includes('@')
              ? sender.email.split('@')[0]
              : sender.email || msg.sender_id;
          const enrichedMsg = { ...msg, sender, sender_name };
          setMessagesCache(prev => {
            const prevMsgs = (prev[msg.chat_id] || []).filter(isMessage);
            const updated = [...prevMsgs, enrichedMsg].filter(isMessage);
            if (selectedChat && msg.chat_id === selectedChat.id) {
              setMessages(updated);
            }
            return { ...prev, [msg.chat_id]: updated };
          });
          // Update chat list: move chat to top, update last message/time
          setChats(prevChats => {
            const idx = prevChats.findIndex(c => c.id === msg.chat_id);
            if (idx === -1) return prevChats;
            const updatedChat = { ...prevChats[idx] };
            updatedChat.messages = ([...(updatedChat.messages || []), enrichedMsg] as Message[]);
            const newChats = [updatedChat, ...prevChats.filter((c, i) => i !== idx)];
            return newChats;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedChat, userCache]);

  // Fetch all users for group creation
  useEffect(() => {
    if (showGroupModal && user) {
      fetchAllUsers(user.id)
        .then(setAllUsers)
        .catch(() => toast.error("Failed to load users"));
    }
  }, [showGroupModal, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupMembers.length === 0) {
      toast.error("Enter group name and select members");
      return;
    }
    setGroupLoading(true);
    try {
      await createGroupChat(groupName.trim(), [...groupMembers, user.id], user.id);
      setShowGroupModal(false);
      setGroupName("");
      setGroupMembers([]);
      // Refetch chats
      const data = await fetchUserChats(user.id);
      setChats(data);
      toast.success("Group created!");
    } catch (err) {
      toast.error("Failed to create group");
    } finally {
      setGroupLoading(false);
    }
  };

  // Set CSS variable for sidebar width on initial load and whenever sidebarWidth changes
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  const handleSidebarResize = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + moveEvent.clientX - startX, 260), 500);
      setSidebarWidth(newWidth);
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Handle file upload (general files)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${selectedChat.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      await sendMessage(selectedChat.id, user.id, `[File] ${file.name}`, publicUrl);
      const data = await fetchChatMessagesWithSenders(selectedChat.id, user.id);
      const updated = (Array.isArray(data) ? data : [])
        .map(m => ({
          ...m,
          sender: ensureUser(m.sender, m.sender_id || '')
        } as Message));
      setMessages(updated);
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${selectedChat.id}/images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      await sendMessage(selectedChat.id, user.id, `[Image] ${file.name}`, publicUrl);
      const data = await fetchChatMessagesWithSenders(selectedChat.id, user.id);
      const updated = (Array.isArray(data) ? data : [])
        .map(m => ({
          ...m,
          sender: ensureUser(m.sender, m.sender_id || '')
        } as Message));
      setMessages(updated);
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (audioBlob: Blob) => {
    if (!audioBlob || !selectedChat) {
      toast.error("No audio recorded");
      return;
    }
    if (audioBlob.size === 0) {
      toast.error("Audio recording is empty");
      return;
    }
    setIsUploading(true);
    try {
      const fileName = `${Math.random()}.webm`;
      const filePath = `${user.id}/${selectedChat.id}/audio/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, audioBlob);
      if (uploadError) {
        toast.error("Supabase audio upload error: " + uploadError.message);
      }
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      await sendMessage(selectedChat.id, user.id, `[Audio] ${fileName}`, publicUrl);
      const data = await fetchChatMessagesWithSenders(selectedChat.id, user.id);
      const updated = (Array.isArray(data) ? data : [])
        .map(m => ({
          ...m,
          sender: ensureUser(m.sender, m.sender_id || '')
        } as Message));
      setMessages(updated);
    } catch (err) {
      toast.error("Failed to upload audio");
    } finally {
      setIsUploading(false);
    }
  };

  // Start/stop audio recording
  const handleMicClick = async () => {
    if (isRecording) {
      if (mediaRecorder) mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Audio recording not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.ondataavailable = (e: BlobEvent) => {
        //console.log('Audio data available', e.data);
        setAudioChunks(prev => [...prev, e.data]);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        //console.log('Recorder stopped, audioBlob:', audioBlob);
        await handleAudioUpload(audioBlob);
        setAudioChunks([]);
      };
      recorder.start();
      setIsRecording(true);
      toast.success("Recording started. Click mic again to stop.");
    } catch (err) {
      toast.error("Failed to start recording");
    }
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  // Scroll to bottom logic (WhatsApp style)
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    const container = messagesContainerRef.current;
    // Always scroll to bottom when:
    // 1. Messages change and user is near bottom
    // 2. Selected chat changes
    // 3. New message arrives
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom || selectedChat) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100); // Small delay to ensure content is rendered
    }
  }, [messages, selectedChat]);

  // Fetch users for new chat modal or add members modal when opened
  useEffect(() => {
    if ((showNewChatModal || showAddMembersModal) && user) {
      setNewChatLoading(true);
      fetchAllUsers(user.id)
        .then(users => { setNewChatUsers(users); setNewChatLoading(false); })
        .catch(() => { setNewChatError("Failed to load users"); setNewChatLoading(false); });
    }
    if (!showNewChatModal && !showAddMembersModal) {
      setNewChatSearch("");
      setNewChatUsers([]);
      setNewChatError(null);
    }
  }, [showNewChatModal, showAddMembersModal, user]);

  // 1. Realtime chat list updates
  useEffect(() => {
    if (!user) return;
    // Subscribe to all message inserts/updates for chats the user is a member of
    const channel = supabase
      .channel('chats-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async payload => {
          // On any new/updated message, refetch chats
          const data = await fetchUserChats(user.id);
          setChats(data);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. Label management functions
  async function handleAddLabel(chatId: string) {
    const chat = chats.find((c: any) => c.id === chatId);
    const labels = Array.isArray(chat?.labels) ? chat.labels : [];
    const newLabel = labelInputValue.trim();
    if (!newLabel) {
      toast.error('Label cannot be empty');
      return;
    }
    if (labels.includes(newLabel)) {
      toast.error('Label already exists');
      return;
    }
    setLabelLoading(true);
    // Optimistically update local state for instant feedback
    setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, labels: [...labels, newLabel] } : c));
    setLabelInputValue("");
    setLabelInputChatId(null);
    try {
      await supabase.from('chats').update({ labels: [...labels, newLabel] }).eq('id', chatId);
      // Refetch chats in background to ensure sync
      fetchUserChats(user.id).then(setChats);
    } catch (err) {
      toast.error("Failed to add label");
    } finally {
      setLabelLoading(false);
    }
  }
  async function handleRemoveLabel(chatId: string, label: string) {
    setLabelLoading(true);
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) throw new Error('Chat not found');
      const newLabels = (chat.labels || []).filter(l => l !== label);
      await supabase.from('chats').update({ labels: newLabels }).eq('id', chatId);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, labels: newLabels } : c));
    } catch (err) {
      toast.error('Failed to remove label');
    } finally {
      setLabelLoading(false);
    }
  }

  // 2. In Settings, add a form to change username
  const handleUsernameChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLabelLoading(true);
    try {
      await supabase.from('users').update({ full_name: labelInputValue }).eq('id', user.id);
      toast.success('Username updated!');
      // Optionally update local user state if needed
    } catch (err) {
      toast.error('Failed to update username');
    } finally {
      setLabelLoading(false);
    }
  };

  // 3. Add right-click context menu to chat rows
  const handleContextMenu = (e: React.MouseEvent, chat: any) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, chatId: chat.id, isGroup: chat.is_group });
  };
  const handleDeleteChat = async () => {
    if (!contextMenu.chatId || !user) return;
    try {
      // For direct chats, delete the chat if only 2 members
      const chat = chats.find(c => c.id === contextMenu.chatId);
      if (!chat) return;

      if (!chat.is_group) {
        // For direct chats, remove both members
        await supabase.from('chat_members').delete().eq('chat_id', contextMenu.chatId);
        await supabase.from('chats').delete().eq('id', contextMenu.chatId);
      } else {
        // For groups, just remove the current user
        await supabase.from('chat_members').delete()
          .eq('chat_id', contextMenu.chatId)
          .eq('user_id', user.id);
      }

      // Update local state
      setChats(prev => prev.filter(c => c.id !== contextMenu.chatId));
      if (selectedChat?.id === contextMenu.chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      toast.success(chat.is_group ? "Left group successfully" : "Chat deleted successfully");
    } catch (err) {
      toast.error("Failed to delete chat");
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };
  const handleLeaveGroup = async () => {
    if (!contextMenu.chatId || !user) return;
    try {
      // Remove user from chat_members
      await supabase.from('chat_members').delete()
        .eq('chat_id', contextMenu.chatId)
        .eq('user_id', user.id);

      // Update local state
      setChats(prev => prev.filter(c => c.id !== contextMenu.chatId));
      if (selectedChat?.id === contextMenu.chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      toast.success("Left group successfully");
    } catch (err) {
      toast.error("Failed to leave group");
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  // Add this useEffect after the selectedChat/messages logic:
  useEffect(() => {
    if (!selectedChat || !user) return;
    // Subscribe to new messages for the selected chat only
    const channel = supabase
      .channel('messages-realtime-chat-' + selectedChat.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`
        },
        async payload => {
          const msg = payload.new;
          setMessages(prevMsgs => {
            if (prevMsgs.some(m => m.id === msg.id)) return prevMsgs;
            // Ensure msg has all required Message properties before adding
            if (msg && typeof msg.id === 'string' && typeof msg.sender_id === 'string' && 
                typeof msg.content === 'string' && typeof msg.created_at === 'string') {
              return [...prevMsgs, msg as Message];
            }
            return prevMsgs;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user]);

  // Update chat list rendering to use messagesCache
  const getLastMsg = (chat: Chat | undefined) => {
    if (!chat || !Array.isArray(chat.messages) || chat.messages.length === 0) return null;
    // Type guard: only return if last message has required fields
    const last = chat.messages[chat.messages.length - 1];
    if (last && typeof last.id === 'string' && typeof last.sender_id === 'string' && typeof last.content === 'string' && typeof last.created_at === 'string') {
      return last as Message;
    }
    return null;
  };

  // Add a handler for refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (user) {
        const chatsData = await fetchUserChats(user.id);
        setChats(chatsData);
        if (selectedChat) {
          const messagesData = await fetchChatMessagesWithSenders(selectedChat.id, user.id);
          const updated = (Array.isArray(messagesData) ? messagesData : [])
            .map(m => ({
              ...m,
              sender: ensureUser(m.sender, m.sender_id || '')
            } as Message));
          setMessages(updated);
          setMessagesCache(prev => ({ ...prev, [selectedChat.id]: updated }));
        }
      }
    } catch (err) {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (!selectedChat || !user || !selectedChat.is_group) return;
    try {
      // Add new members to chat_members
      const newMembers = memberIds.map(userId => ({
        chat_id: selectedChat.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('chat_members').insert(newMembers);
      if (error) throw error;

      // Refetch chats to update member list
      const data = await fetchUserChats(user.id);
      setChats(data);
      setSelectedChat(data.find(c => c.id === selectedChat.id));
      toast.success("Members added successfully");
    } catch (err) {
      toast.error("Failed to add members");
    } finally {
      setShowAddMembersModal(false);
    }
  };

  // Type guard for Message
  function isMessage(obj: any): obj is Message {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.sender_id === 'string' &&
      typeof obj.content === 'string' &&
      typeof obj.created_at === 'string' &&
      (obj.sender === undefined || (
        typeof obj.sender.id === 'string' &&
        typeof obj.sender.email === 'string' &&
        typeof obj.sender.full_name === 'string'
      ))
    );
  }

  // Helper to fetch a single user by id
  async function fetchUserById(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data;
  }

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Add a <style jsx global> block at the top of the return to set CSS variables on :root: */}
      <style jsx global>{`
        :root {
          --header-height: ${HEADER_HEIGHT}px;
          --filter-height: ${FILTER_HEIGHT}px;
          --chat-header-height: ${CHAT_HEADER_HEIGHT}px;
        }
      `}</style>
      {/* Main Header: fixed at top, no marginTop, full width, z-50 */}
      <Header
        mainLabel={mainLabel}
        sectionIcons={sectionIcons}
        handleRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Left Sidebar (Resizable) */}
        <nav className="flex flex-col items-center w-14 bg-white border-r border-gray-200 h-full justify-between">
          <div className="flex flex-col items-center gap-0.5 w-full">
            {/* Home icon */}
            <button className="w-10 h-10 flex items-center justify-center mt-2 mb-0.5" onClick={() => setMainLabel('Home')}><FaHome size={18} className={mainLabel === 'Home' ? 'text-blue-500' : 'text-gray-400'} /></button>
            {/* Green chat bubble */}
            <button
              className={`w-10 h-10 flex items-center justify-center mb-0.5`}
              onClick={() => setMainLabel('Chats')}
            >
              <BiSolidMessageRoundedDots size={22} className={mainLabel === 'Chats' ? 'text-green-600' : 'text-gray-400'} />
            </button>
            {/* Puzzle piece */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Puzzle')}><FaPuzzlePiece size={18} className="text-gray-400" /></button>
            {/* Graph/Analytics */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Chart')}><FaChartLine size={18} className="text-gray-400" /></button>
            {/* Menu/List */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('List')}><HiOutlineMenuAlt1 size={18} className="text-gray-400" /></button>
            {/* Loudspeaker/Announcement */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Announcement')}><FaBullhorn size={18} className="text-gray-400" /></button>
            {/* User Network + Yellow Star */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5 relative" onClick={() => setMainLabel('Network')}>
              <FaUsers size={18} className="text-gray-400" />
              <FaStar size={10} className="text-yellow-400 absolute top-1 right-1" />
            </button>
            {/* Notebook/Book */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Book')}><FaBook size={18} className="text-gray-400" /></button>
            {/* Gallery/Image */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Gallery')}><FaRegImage size={18} className="text-gray-400" /></button>
            {/* Toggle Controls */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Toggles')}><FaSlidersH size={18} className="text-gray-400" /></button>
            {/* Settings/Gear */}
            <button className="w-10 h-10 flex items-center justify-center mb-0.5" onClick={() => setMainLabel('Settings')}><FaCog size={18} className="text-gray-400" /></button>
          </div>
          {/* Bottom: Three stars in a single line and question mark in a circle */}
          <div className="flex flex-col items-center gap-0.5 mb-2">
            <div className="flex flex-row gap-0.5 w-10 h-10 items-center justify-center">
              <FaStar size={13} className="text-gray-400" />
              <FaStar size={13} className="text-gray-400" />
              <FaStar size={13} className="text-gray-400" />
            </div>
            <button className="w-10 h-10 flex items-center justify-center"><FaQuestionCircle size={18} className="text-gray-400" /></button>
          </div>
        </nav>
        {/* Sidebar (Chat List, resizable) - only show for Chats */}
        {mainLabel === "Chats" && (
          <ChatList
            chats={chats}
            chatsLoading={chatsLoading}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            user={user}
            labelInputChatId={labelInputChatId}
            setLabelInputChatId={setLabelInputChatId}
            labelInputValue={labelInputValue}
            setLabelInputValue={setLabelInputValue}
            labelLoading={labelLoading}
            handleAddLabel={handleAddLabel}
            handleRemoveLabel={handleRemoveLabel}
            chatFilterValue={chatFilterValue}
            setShowChatFilter={setShowChatFilter}
            sidebarWidth={sidebarWidth}
            handleContextMenu={handleContextMenu}
            getLastMsg={getLastMsg}
            showGreenMenu={showGreenMenu}
            setShowGreenMenu={setShowGreenMenu}
            setShowNewChatModal={setShowNewChatModal}
            setShowGroupModal={setShowGroupModal}
            handleSidebarResize={handleSidebarResize}
          />
        )}
        {/* Main Content: Section Switching */}
        <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full overflow-hidden">
          {mainLabel === "Chats" && (
            <ChatArea
              messages={messages}
              messagesLoading={messagesLoading}
              selectedChat={selectedChat}
              user={user}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessageHandler={async e => {
                e.preventDefault();
                if (!selectedChat || !newMessage.trim()) return;
                try {
                  await sendMessage(selectedChat.id, user.id, newMessage.trim());
                  setNewMessage("");
                  // No need to refetch messages; real-time will update
                } catch (err) {
                  toast.error("Failed to send message");
                }
              }}
              isUploading={isUploading}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              imageInputRef={imageInputRef as React.RefObject<HTMLInputElement>}
              handleFileUpload={handleFileUpload}
              handleImageUpload={handleImageUpload}
              isRecording={isRecording}
              handleMicClick={handleMicClick}
              messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
              messagesContainerRef={messagesContainerRef as React.RefObject<HTMLDivElement>}
              formatMessageDate={formatMessageDate}
              setShowAddMembersModal={setShowAddMembersModal}
            />
          )}
          {mainLabel === "Settings" && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                <FiSettings className="text-2xl" /> Settings
              </div>
              <button
                onClick={handleLogout}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-150"
              >
                <FiLogOut className="inline-block mr-2 text-xl align-middle" /> Logout
              </button>
              <form onSubmit={handleUsernameChange} className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold">Change Username</label>
                <input type="text" value={labelInputValue} onChange={e => setLabelInputValue(e.target.value)} className="px-3 py-2 rounded border" />
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold" disabled={labelLoading}>{labelLoading ? 'Saving...' : 'Save'}</button>
              </form>
            </div>
          )}
          {mainLabel !== "Chats" && mainLabel !== "Settings" && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                {sectionIcons[mainLabel] ? sectionIcons[mainLabel]({ size: 32 }) : null}
                {mainLabel}
              </div>
              <div className="text-gray-500 text-lg">This is a placeholder for the {mainLabel} section.</div>
            </div>
          )}
        </main>
        {/* Right Sidebar */}
        <nav className="flex flex-col items-center gap-5 w-14 py-6 bg-white border-l border-gray-200 transition-all duration-200 h-full" style={{ boxShadow: 'none' }}>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiRefreshCw size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiEdit2 size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiList size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiTag size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiShare2 size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FaUsers size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiAtSign size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiImage size={22} className="text-gray-400" /></button>
          <button className="p-0 flex items-center justify-center" style={{ background: 'none' }}><FiList size={22} className="text-gray-400" /></button>
        </nav>
      </div>
      <GroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        allUsers={allUsers}
        groupMembers={groupMembers}
        setGroupMembers={setGroupMembers}
        groupLoading={groupLoading}
        handleCreateGroup={handleCreateGroup}
      />
      <NewChatModal
        open={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        newChatSearch={newChatSearch}
        setNewChatSearch={setNewChatSearch}
        newChatUsers={newChatUsers}
        newChatLoading={newChatLoading}
        newChatError={newChatError}
        handleStartChat={async (u: any) => {
          setNewChatLoading(true);
          setNewChatError(null);
          try {
            const chat = await createDirectChat(user.id, u.id);
            const data = await fetchUserChats(user.id);
            setChats(data);
            setSelectedChat(data.find((c: any) => c.id === chat.id));
            setShowNewChatModal(false);
          } catch (err) {
            setNewChatError("Failed to start chat");
          } finally {
            setNewChatLoading(false);
          }
        }}
      />
      <AddMembersModal
        open={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        newChatSearch={newChatSearch}
        setNewChatSearch={setNewChatSearch}
        newChatUsers={newChatUsers}
        newChatLoading={newChatLoading}
        newChatError={newChatError}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        handleAddMembers={handleAddMembers}
        selectedChat={selectedChat}
      />
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            width: '200px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 className="font-semibold mb-2">Context Menu</h3>
          {contextMenu.isGroup ? (
            <>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleLeaveGroup}>Leave Group</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleDeleteChat}>Delete Conversation</button>
            </>
          ) : (
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Delete Conversation</button>
          )}
        </div>
      )}
    </div>
  );
}