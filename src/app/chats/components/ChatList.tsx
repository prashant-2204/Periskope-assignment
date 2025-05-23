import React from 'react';
import { FiFilter, FiSearch, FiTag, FiPlus, FiX } from 'react-icons/fi';
import { BiSolidMessageRoundedAdd } from 'react-icons/bi';
import Image from 'next/image';

// --- Types ---
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  avatar_url?: string;
  labels?: string[];
  membersUsernames?: string[];
  members?: User[];
  messages?: Message[];
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
  sender?: User;
  sender_name?: string;
}

// --- Props ---
interface ChatListProps {
  chats: Chat[];
  chatsLoading: boolean;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
  user: User;
  labelInputChatId: string | null;
  setLabelInputChatId: (id: string | null) => void;
  labelInputValue: string;
  setLabelInputValue: (v: string) => void;
  labelLoading: boolean;
  handleAddLabel: (chatId: string) => void;
  handleRemoveLabel: (chatId: string, label: string) => void;
  chatFilterValue: string;
  setShowChatFilter: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
  handleContextMenu: (e: React.MouseEvent, chat: Chat) => void;
  getLastMsg: (chat: Chat) => Message | null;
  showGreenMenu: boolean;
  setShowGreenMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewChatModal: (v: boolean) => void;
  setShowGroupModal: (v: boolean) => void;
  handleSidebarResize: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// Utility to get display name from user or chat
function getDisplayName(userOrChat: User | Chat): string {
  if ('full_name' in userOrChat && userOrChat.full_name) return userOrChat.full_name;
  if ('name' in userOrChat && userOrChat.name) return userOrChat.name;
  if ('email' in userOrChat && userOrChat.email) return userOrChat.email.split('@')[0];
  return 'Unknown';
}

// --- Component ---
const ChatList: React.FC<ChatListProps> = ({
  chats,
  chatsLoading,
  selectedChat,
  setSelectedChat,
  user,
  labelInputChatId,
  setLabelInputChatId,
  labelInputValue,
  setLabelInputValue,
  labelLoading,
  handleAddLabel,
  handleRemoveLabel,
  chatFilterValue,
  setShowChatFilter,
  sidebarWidth,
  handleContextMenu,
  getLastMsg,
  showGreenMenu,
  setShowGreenMenu,
  setShowNewChatModal,
  setShowGroupModal,
  handleSidebarResize,
}) => {
  return (
    <aside
      style={{ width: sidebarWidth }}
      className="flex flex-col bg-white transition-all duration-100 relative border-r-2 border-gray-200 h-full shadow-md"
    >
      {/* Filter row: fixed below header, responsive to sidebar width */}
      <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-gray-200 bg-white fixed z-40"
        style={{
          left: '56px',
          width: 'var(--sidebar-width, 340px)',
          top: 'var(--header-height)',
          height: 'var(--filter-height)'
        }}>
        <button className="flex items-center gap-1 px-3 py-1 rounded font-semibold text-xs bg-gray-100 text-green-700 hover:bg-green-100 hover:text-green-700"
          onClick={() => setShowChatFilter((prev: boolean) => !prev)}><FiFilter className="text-green-700" /> Custom filter</button>
        <button className="px-2 py-1 rounded font-semibold text-xs bg-gray-100 text-green-700 hover:bg-green-100 hover:text-green-700"
          onClick={() => setShowChatFilter((prev: boolean) => !prev)}>Save</button>
        <button className="flex items-center gap-1 px-3 py-1 rounded font-semibold text-xs bg-gray-100 text-green-700 hover:bg-green-100 hover:text-green-700"
          onClick={() => setShowChatFilter((prev: boolean) => !prev)}><FiSearch className="text-green-700" /> Search</button>
        <button className="flex items-center gap-1 px-3 py-1 rounded font-semibold text-xs bg-gray-100 text-green-700 hover:bg-green-100 hover:text-green-700"
          onClick={() => setShowChatFilter((prev: boolean) => !prev)}><FiTag className="text-green-700" /> Filtered</button>
      </div>
      {/* Chat List (scrollable, relative for button) */}
      <div className="flex-1 relative overflow-y-auto" style={{
        marginTop: `calc(var(--header-height) + var(--filter-height))`,
        height: `calc(100vh - var(--header-height) - var(--filter-height))`
      }}>
        <nav className="absolute inset-0 overflow-y-auto" aria-label="Chat list">
          {chatsLoading ? (
            <div className="p-4 text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-gray-500">No chats found.</div>
          ) : (
            chats
              .filter(chat => {
                if (!chatFilterValue) return true;
                const name = chat.name?.toLowerCase() || "";
                let otherUser = "";
                if (!chat.is_group && chat.membersUsernames && chat.membersUsernames.length > 0) {
                  otherUser = chat.membersUsernames.find((u: string) => u !== user.email)?.toLowerCase() || "";
                }
                return name.includes(chatFilterValue.toLowerCase()) || otherUser.includes(chatFilterValue.toLowerCase());
              })
              .map(chat => {
                const lastMsgObj = getLastMsg(chat);
                const lastMsg = lastMsgObj ? lastMsgObj.content : "No messages yet";
                const lastMsgTime = lastMsgObj ? new Date(lastMsgObj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                return (
                  <section
                    key={chat.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id ? "bg-gray-200" : ""}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    {/* Avatar or group icon */}
                    {chat.avatar_url ? (
                      <Image src={chat.avatar_url} alt={chat.name || 'avatar'} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {chat.name?.[0] || "C"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-gray-900 truncate max-w-[120px]">{getDisplayName(chat)}</span>
                        {/* Inline labels to the right of name */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {Array.isArray(chat.labels) && chat.labels.map((label: string) => (
                            <span key={label} className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1">
                              {label}
                              <button type="button" className="ml-1 text-blue-400 hover:text-red-500" onClick={e => { e.stopPropagation(); handleRemoveLabel(chat.id, label); }} disabled={labelLoading}><FiX size={12} /></button>
                            </span>
                          ))}
                          {labelInputChatId === chat.id ? (
                            <form onSubmit={e => { e.preventDefault(); handleAddLabel(chat.id); }} className="flex items-center gap-1">
                              <input
                                type="text"
                                className="px-1 py-0.5 rounded border border-gray-200 text-xs w-16"
                                value={labelInputValue}
                                onChange={e => setLabelInputValue(e.target.value)}
                                autoFocus
                                disabled={labelLoading}
                              />
                              <button type="submit" className="text-green-600" disabled={labelLoading}><FiPlus size={14} /></button>
                              <button type="button" className="text-gray-400" onClick={e => { e.stopPropagation(); setLabelInputChatId(null); setLabelInputValue(""); }}><FiX size={14} /></button>
                            </form>
                          ) : (
                            <button type="button" className="text-blue-400 hover:text-blue-700" onClick={e => { e.stopPropagation(); setLabelInputChatId(chat.id); setLabelInputValue(""); }}><FiTag size={14} /></button>
                          )}
                        </div>
                        {/* If group, show member count as +N */}
                        {chat.is_group && chat.membersUsernames && chat.membersUsernames.length > 2 && (
                          <span className="ml-1 text-xs text-gray-400 font-semibold">+{chat.membersUsernames.length - 1}</span>
                        )}
                      </div>
                      {/* WhatsApp-style last message and time */}
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="truncate text-gray-500 text-sm max-w-[70%]">
                          {lastMsg}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {lastMsgTime}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              })
          )}
        </nav>
        {/* Green sticky button (bottom right of chat list area) */}
        <div className="absolute z-20" style={{ right: '20px', bottom: '20px' }}>
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg focus:outline-none"
            title="New Chat"
            onClick={() => setShowGreenMenu((prev: boolean) => !prev)}
          >
            <BiSolidMessageRoundedAdd size={28} />
          </button>
          {/* Dropdown menu for green button */}
          {showGreenMenu && (
            <div className="absolute right-0 bottom-14 bg-white border border-gray-200 rounded shadow-lg py-2 w-40 z-30">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800" onClick={() => { setShowNewChatModal(true); setShowGreenMenu(false); }}>New Chat</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800" onClick={() => { setShowGroupModal(true); setShowGreenMenu(false); }}>New Group</button>
            </div>
          )}
        </div>
      </div>
      {/* Sidebar resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-30"
        onMouseDown={handleSidebarResize}
        style={{ background: 'transparent' }}
      />
    </aside>
  );
};

export default ChatList;