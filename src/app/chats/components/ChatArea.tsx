import React, { RefObject, useEffect, useState } from 'react';
import { IoMdSend } from 'react-icons/io';
import { FiPaperclip, FiImage, FiMic, FiSmile, FiClock, FiStar, FiChevronDown, FiSearch, FiUsers } from 'react-icons/fi';
import Image from 'next/image';
import { Chat, User, Message } from './ChatList';

// Utility to get display name from user or chat
function getDisplayName(userOrChat: User | Chat): string {
  if ('full_name' in userOrChat && userOrChat.full_name) return userOrChat.full_name;
  if ('name' in userOrChat && userOrChat.name) return userOrChat.name;
  if ('email' in userOrChat && userOrChat.email) return userOrChat.email.split('@')[0];
  return 'Unknown';
}

interface ChatAreaProps {
  messages: Message[];
  messagesLoading: boolean;
  selectedChat: Chat | null;
  user: User;
  newMessage: string;
  setNewMessage: (v: string) => void;
  sendMessageHandler: (e: React.FormEvent<HTMLFormElement>) => void;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  imageInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  handleMicClick: () => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  messagesContainerRef: RefObject<HTMLDivElement>;
  formatMessageDate: (date: string) => string;
  setShowAddMembersModal: (show: boolean) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  messagesLoading,
  selectedChat,
  user,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  isUploading,
  fileInputRef,
  imageInputRef,
  handleFileUpload,
  handleImageUpload,
  isRecording,
  handleMicClick,
  messagesEndRef,
  messagesContainerRef,
  formatMessageDate,
  setShowAddMembersModal,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!selectedChat) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
      Select a chat to start messaging
    </div>
  );

  // Format time helper
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <>
      {/* Chat Area Header: fixed below filter row, full width, z-40 */}
      <header className="flex items-center px-6 py-3 border-b border-gray-200 bg-white fixed z-40"
        style={{
          left: 'calc(56px + var(--sidebar-width, 340px))',
          right: 0,
          top: 'var(--header-height)',
          height: 'var(--chat-header-height)',
          width: 'calc(100vw - 56px - var(--sidebar-width, 340px) - 56px)',
          borderLeft: '2px solid #e5e7eb',
          zIndex: 40
        }}>
        {/* Group avatar */}
        <div className="flex items-center gap-3">
          {selectedChat?.avatar_url ? (
            <img 
              src={selectedChat.avatar_url || ''} 
              alt={selectedChat.name || 'Chat'} 
              className="w-10 h-10 rounded-full object-cover" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-900 text-lg truncate">
              {!selectedChat.is_group && selectedChat.members ? 
                // For direct chats, show the other person's name
                selectedChat.members.find(m => m.id !== user.id)?.full_name || 
                selectedChat.members.find(m => m.id !== user.id)?.email?.split('@')[0] || 
                'Chat' : 
                // For groups, show group name
                selectedChat.name || 'Group Chat'}
            </span>
            {/* Member usernames, up to 5 */}
            <span className="text-xs text-gray-500 truncate">
              {(selectedChat?.members || []).slice(0, 5).map((m: any) => getDisplayName(m)).join(", ")}
              {selectedChat?.members && selectedChat.members.length > 5 &&
                `, +${selectedChat.members.length - 5}`}
            </span>
          </div>
        </div>
        {/* Right: member avatars, star, search */}
        <div className="flex items-center gap-2 ml-auto">
          {selectedChat.is_group && (
            <button
              onClick={() => setShowAddMembersModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100"
            >
              <FiUsers className="text-base" /> Add Members
            </button>
          )}
          <div className="flex -space-x-3 cursor-pointer">
            {(selectedChat.members || []).slice(0, 5).map((m: any, idx: number) =>
              m.avatar_url ? (
                <img key={idx} src={m.avatar_url} alt={getDisplayName(m)} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              ) : (
                <div key={idx} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center font-bold text-gray-700">
                  {getDisplayName(m)[0]?.toUpperCase()}
                </div>
              )
            )}
            {selectedChat.members && selectedChat.members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                +{selectedChat.members.length - 5}
              </div>
            )}
          </div>
          <button className="p-2 rounded hover:bg-gray-100"><FiStar className="text-yellow-500" size={22} /></button>
          <button className="p-2 rounded hover:bg-gray-100"><FiSearch className="text-gray-500" size={22} /></button>
        </div>
      </header>
      {/* Message list: scrollable, starts below all fixed headers */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-gray-50 messages-container"
        style={{
          backgroundImage: 'url("/whatsapp-bg.jpg")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          marginTop: `calc(var(--header-height) + var(--chat-header-height))`,
          height: `calc(100vh - var(--header-height) - var(--chat-header-height))`,
          borderLeft: '2px solid #e5e7eb' // Tailwind gray-200
        }}
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => {
              const showDateDivider = index === 0 || 
                formatMessageDate(messages[index - 1].created_at) !== formatMessageDate(msg.created_at);
              const isOwn = msg.sender_id === user.id;
              // Fallback display name for sender
              const senderDisplayName = msg.sender
                ? getDisplayName(msg.sender)
                : msg.sender_name || msg.sender_id || 'Unknown';
              return (
                <div key={msg.id} className="flex flex-col gap-2">
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="px-4 py-1 bg-gray-200 rounded-full text-sm text-gray-600">
                        {formatMessageDate(msg.created_at)}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex items-end max-w-[70%] ${
                      isOwn ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    {/* Avatar: only for others' messages */}
                    {!isOwn && (msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt={senderDisplayName} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white">{senderDisplayName[0]}</div>
                    ))}
                    <div
                      className={`ml-2 px-4 py-2 rounded-2xl shadow ${
                        isOwn
                          ? "bg-green-100 text-gray-900 rounded-br-none"
                          : "bg-white text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700 text-sm">{senderDisplayName}</span>
                      </div>
                      <div>
                        {msg.file_url && msg.content.startsWith('[Image]') ? (
                          <>
                            <img
                              src={msg.file_url}
                              alt={msg.content.replace('[Image]', '').trim()}
                              className="max-w-xs max-h-60 rounded-lg mb-1"
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                console.error('Image failed to load:', msg.file_url);
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'block';
                              }}
                            />
                            <div style={{display: 'none'}} className="text-red-500 text-xs">
                              Image failed to load. <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="underline">Open directly</a>
                            </div>
                          </>
                        ) : msg.file_url && msg.content.startsWith('[Audio]') ? (
                          <audio controls className="my-1">
                            <source src={msg.file_url} type="audio/webm" />
                            Your browser does not support the audio element.
                          </audio>
                        ) : msg.file_url && msg.content.startsWith('[File]') ? (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline break-all"
                            download
                          >
                            {msg.content.replace('[File]', '').trim() || 'Download file'}
                          </a>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                      <div className="text-xs mt-1 flex gap-2 items-center text-gray-500 justify-end">
                        {isClient 
                          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : formatTime(msg.created_at)
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Message Input */}
      <form
        className="w-full flex flex-col gap-0 px-4 py-2 border-t border-gray-200 bg-white"
        onSubmit={sendMessageHandler}
        style={{ boxShadow: '0 -1px 0 0 #e5e7eb' }}
      >
        {/* Top row: input and send button */}
        <div className="flex items-center w-full gap-2 mb-1">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="*/*"
          />
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 bg-white text-gray-900 outline-none border-none focus:ring-0 focus:outline-none px-3 py-2"
            disabled={!selectedChat || isUploading}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <button
            type="submit"
            className="flex items-center justify-center text-green-700 hover:text-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedChat || !newMessage.trim() || isUploading}
            style={{ height: '32px', width: '32px' }}
          >
            <IoMdSend size={24} />
          </button>
        </div>
        {/* Bottom row: icons left, Periskope dropdown right */}
        <div className="flex items-center w-full justify-between px-1">
          <div className="flex items-center gap-4">
            <button type="button" className="p-0" onClick={() => { fileInputRef.current?.click(); }} title="Attach file"><FiPaperclip size={18} className="text-gray-600" /></button>
            <button type="button" className="p-0" onClick={() => { imageInputRef.current?.click(); }} title="Attach image"><FiImage size={18} className="text-gray-600" /></button>
            <button type="button" className={`p-0 ${isRecording ? 'text-red-600 animate-pulse' : ''}`} onClick={handleMicClick} title="Record audio"><FiMic size={18} className="text-gray-600" /></button>
            <button type="button" className="p-0" title="Emoji"><FiSmile size={18} className="text-gray-600" /></button>
            <button type="button" className="p-0" title="Schedule message"><FiClock size={18} className="text-gray-600" /></button>
            <button type="button" className="p-0" title="Star message"><FiStar size={18} className="text-gray-600" /></button>
          </div>
          <div className="flex items-center px-2 py-1 bg-white border border-gray-200 rounded cursor-pointer min-w-[90px]">
            <Image src="/periskope-icon.webp" alt="Periskope" width={16} height={16} />
            <span className="ml-1 font-semibold text-sm text-gray-800">Periskope</span>
            <FiChevronDown className="ml-1 text-gray-500 text-sm" />
          </div>
        </div>
      </form>
    </>
  );
};

export default ChatArea;