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
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string;
  sender?: {
    email: string;
    full_name: string;
  };
}

interface DatabaseChat {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  chat_labels: {
    id: string;
    label_id: string;
    labels: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}

interface DatabaseChatMember {
  chat_id: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface ChatMemberResponse {
  chat_id: string;
  chats: DatabaseChat;
}

interface ChatMemberWithUsers {
  chat_id: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string | null;
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

export async function fetchChatMessagesWithSenders(chatId: string, userId: string) {
  if (!chatId || typeof chatId !== "string") {
    console.error("Invalid chatId:", chatId);
    return [];
  }
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

export async function fetchUserChatsWithLabels(userId: string) {
  try {
    // First get all chats where user is a member
    const { data: chatMembers, error: membersError } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chats:chat_id (
          id,
          name,
          is_group,
          created_at,
          chat_labels (
            id,
            label_id,
            labels (
              id,
              name,
              color
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (membersError) throw membersError;

    // Get all members for these chats
    const chatIds = chatMembers?.map(cm => cm.chat_id) || [];
    const { data: allMembers, error: allMembersError } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        user_id,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .in('chat_id', chatIds);

    if (allMembersError) throw allMembersError;

    // Get latest message for each chat
    const { data: latestMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Process and structure the data
    const chats = (chatMembers as unknown as ChatMemberResponse[])?.map(cm => {
      const chat = cm.chats;
      const members = (allMembers as unknown as ChatMemberWithUsers[])
        ?.filter(m => m.chat_id === chat.id)
        .map(m => m.users) || [];
      
      const latestMessage = (latestMessages as unknown as DatabaseMessage[])
        ?.filter(m => m.chat_id === chat.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        ...chat,
        members,
        membersUsernames: members.map(m => m.email),
        messages: latestMessage ? [latestMessage] : [],
        chat_labels: chat.chat_labels || []
      };
    }) || [];

    // Transform null values to undefined
    return chats.map(chat => ({
      ...chat,
      name: chat.name || undefined,  // Convert null to undefined
      members: chat.members?.map(member => ({
        ...member,
        full_name: member?.full_name || undefined,  // Convert null to undefined
       
      }))
    }));
  } catch (error) {
    console.error('Error in fetchUserChatsWithLabels:', error);
    throw error;
  }
}

// Create a direct chat (1:1)
export async function createDirectChat(userA: string, userB: string) {
  // Check if chat already exists
  const { data: existing, error: existingError } = await supabase
    .from('chats')
    .select('id')
    .eq('is_group', false)
    .in('id', [
      supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', userA),
      supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', userB)
    ]);
  if (existing && existing.length > 0) return existing[0];
  // Create chat
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .insert([{ is_group: false }])
    .select()
    .single();
  if (chatError) throw chatError;
  // Add both users
  const members = [userA, userB].map(id => ({ chat_id: chatData.id, user_id: id, role: 'member', assigned_by: userA }));
  const { error: membersError } = await supabase
    .from('chat_members')
    .insert(members);
  if (membersError) throw membersError;
  return chatData;
}

// Update addLabelToChat to handle the new label structure
export async function addLabelToChat(chatId: string, labelName: string) {
  try {
    // Find or create label
    let { data: label, error } = await supabase
      .from('labels')
      .select('*')
      .eq('name', labelName)
      .single();

    if (!label) {
      const { data: newLabel, error: createError } = await supabase
        .from('labels')
        .insert({ name: labelName, color: '#3B82F6' }) // Default blue color
        .select()
        .single();
      
      if (createError) throw createError;
      label = newLabel;
    }

    // Insert into chat_labels
    const { error: insertError } = await supabase
      .from('chat_labels')
      .insert({ chat_id: chatId, label_id: label.id });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error in addLabelToChat:', error);
    throw error;
  }
}

// Update removeLabelFromChat to handle the new label structure
export async function removeLabelFromChat(chatId: string, labelId: string) {
  try {
    const { error } = await supabase
      .from('chat_labels')
      .delete()
      .eq('chat_id', chatId)
      .eq('label_id', labelId);

    if (error) throw error;
  } catch (error) {
    console.error('Error in removeLabelFromChat:', error);
    throw error;
  }
}