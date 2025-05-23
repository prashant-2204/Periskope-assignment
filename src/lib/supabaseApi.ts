import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
  sender?: {
    email: string;
    full_name: string;
  };
  sender_name?: string;
}

interface DatabaseMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
  sender: {
    email: string;
    full_name: string;
  };
}

export async function fetchUserChats(userId: string) {
  // Get all chats where the user is a member
  const { data, error } = await supabase
    .from("chat_members")
    .select(`chat_id, chats:chat_id (id, name, is_group, created_at)`) // join with chats
    .eq("user_id", userId);
  if (error) throw error;
  return data?.map((row: any) => row.chats) || [];
}

export async function fetchChatMessages(chatId: string, userId: string): Promise<Message[]> {
  try {
    // First verify the chat exists and user has access
    console.log('[fetchChatMessages] Checking access for chatId:', chatId, 'userId:', userId);
    const { data: chatAccess, error: accessError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();
    console.log('[fetchChatMessages] chatAccess:', chatAccess, 'accessError:', accessError);

    if (accessError || !chatAccess) {
      throw new Error("Chat not found or access denied");
    }

    // Fetch messages with sender information (join sender_id to users)
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        content,
        created_at,
        file_url,
        sender:sender_id (
          email,
          full_name
        )
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform the data to match our Message interface
    return (data as unknown as DatabaseMessage[]).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
      file_url: msg.file_url,
      sender: msg.sender,
      sender_name: msg.sender?.full_name || msg.sender?.email
    }));
  } catch (error) {
    console.error("Error in fetchChatMessages:", error);
    throw error;
  }
}

export async function sendMessage(chatId: string, senderId: string, content: string, file_url?: string) {
  try {
    // Verify chat access before sending
    const { data: chatAccess, error: accessError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("chat_id", chatId)
      .eq("user_id", senderId)
      .single();

    if (accessError || !chatAccess) {
      throw new Error("Chat not found or access denied");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{
        chat_id: chatId,
        sender_id: senderId,
        content,
        file_url,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}

export async function fetchAllUsers(excludeUserId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name")
    .neq("id", excludeUserId);
  if (error) throw error;
  return data || [];
}

export async function createGroupChat(groupName: string, memberIds: string[], creatorId: string) {
  // 1. Create chat
  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .insert([{ name: groupName, is_group: true, created_by: creatorId }])
    .select()
    .single();
  if (chatError) throw chatError;
  // 2. Add members (including creator as admin)
  const members = memberIds.map(id => ({ chat_id: chatData.id, user_id: id, role: id === creatorId ? "admin" : "member", assigned_by: creatorId }));
  const { error: membersError } = await supabase
    .from("chat_members")
    .insert(members);
  if (membersError) throw membersError;
  return chatData;
}

export async function fetchUsersForChat(chatId: string) {
  const { data, error } = await supabase
    .from("chat_members")
    .select("user_id, users:user_id (email, full_name)")
    .eq("chat_id", chatId);
  if (error) throw error;
  const userMap: Record<string, { email: string; full_name: string }> = {};
  data?.forEach((row: any) => {
    if (row.users) userMap[row.user_id] = row.users;
  });
  return userMap;
}

export async function fetchChatMessagesWithSenders(chatId: string, userId: string): Promise<Message[]> {
  try {
    // Log types and values
    console.log('[fetchChatMessagesWithSenders] chatId:', chatId, typeof chatId, 'userId:', userId, typeof userId);
    // Trim IDs
    const trimmedChatId = chatId.trim();
    const trimmedUserId = userId.trim();
    // First verify the chat exists and user has access
    const { data: chatAccess, error: accessError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("chat_id", trimmedChatId)
      .eq("user_id", trimmedUserId)
      .single();
    console.log('[fetchChatMessagesWithSenders] chatAccess:', chatAccess, 'accessError:', accessError);
    // Also log all chat_members for this chat
    const { data: allMembers, error: allMembersError } = await supabase
      .from("chat_members")
      .select("*")
      .eq("chat_id", trimmedChatId);
    console.log('[fetchChatMessagesWithSenders] all chat_members for chat:', allMembers, 'error:', allMembersError);
    if (accessError || !chatAccess) {
      throw new Error("Chat not found or access denied");
    }
    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", trimmedChatId)
      .order("created_at", { ascending: true });
    if (msgError) {
      console.error("Error fetching messages:", msgError);
      throw msgError;
    }
    if (!messages) return [];
    // Fetch user info for all members
    const userMap = await fetchUsersForChat(trimmedChatId);
    // Map sender info onto each message
    return messages.map((msg: any) => ({
      ...msg,
      sender: userMap[msg.sender_id] || null,
      sender_name: userMap[msg.sender_id]?.full_name || userMap[msg.sender_id]?.email || 'Unknown'
    }));
  } catch (error) {
    console.error("Error in fetchChatMessagesWithSenders:", error);
    throw error;
  }
} 