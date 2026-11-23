"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function startChatWithSeller(listingId: string) {
  const session = await getSession();
  if (!session) {
    redirect(`/login?from=/listings/${listingId}`);
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: true, campus: true },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  // If user is the owner, redirect to their conversations
  if (listing.userId === session.userId) {
    redirect("/chats");
  }

  // Check if conversation already exists
  let conversation = await prisma.conversation.findUnique({
    where: {
      buyerId_sellerId_listingId: {
        buyerId: session.userId,
        sellerId: listing.userId,
        listingId: listing.id,
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        buyerId: session.userId,
        sellerId: listing.userId,
        listingId: listing.id,
        messages: {
          create: {
            senderId: session.userId,
            content: `Hi! I saw your listing for "${listing.title}" and would like to arrange a meetup at ${listing.pickupSpot}. Is it still available?`,
          },
        },
      },
    });
  }

  redirect(`/chats/${conversation.id}`);
}

export async function sendMessageAsync(conversationId: string, content: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "Message cannot be empty" };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return { error: "Conversation not found" };
  }

  if (
    conversation.buyerId !== session.userId &&
    conversation.sellerId !== session.userId
  ) {
    return { error: "Not authorized to send messages in this conversation" };
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.userId,
      content: trimmed,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Only revalidate the chats inbox summary list so it reflects the last message when navigating back.
  // DO NOT revalidate `/chats/${conversationId}` because that forces Next.js to re-render the active conversation page from the server!
  revalidatePath("/chats");

  return { success: true, message };
}

export async function fetchMessagesAsync(
  conversationId: string,
  lastMessageId?: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated", messages: [] };
  }

  // Single optimized query fetching conversation authorization and messages in one round-trip
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      sellerId: true,
      messages: {
        include: {
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return { error: "Conversation not found", messages: [] };
  }

  if (
    conversation.buyerId !== session.userId &&
    conversation.sellerId !== session.userId
  ) {
    return { error: "Not authorized", messages: [] };
  }

  const messages = conversation.messages;
  const latestMsg = messages[messages.length - 1];

  const hasUnreadFromOther = messages.some(
    (m) => !m.read && m.senderId !== session.userId
  );

  // If client already has latest message and nothing is unread, skip heavy work
  if (lastMessageId && latestMsg && latestMsg.id === lastMessageId && !hasUnreadFromOther) {
    return { success: true, notModified: true, messages: [] };
  }

  // Only perform update write query when there are actually unread messages
  if (hasUnreadFromOther) {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        read: false,
      },
      data: { read: true },
    });
    for (const msg of messages) {
      if (msg.senderId !== session.userId) {
        msg.read = true;
      }
    }
  }

  return { success: true, messages, currentUserId: session.userId };
}

export async function getConversationDetails(conversationId: string) {
  const session = await getSession();
  if (!session) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      buyer: { select: { id: true, name: true, email: true, campus: true, dormZone: true } },
      seller: { select: { id: true, name: true, email: true, campus: true, dormZone: true } },
      listing: {
        include: { campus: true },
      },
    },
  });

  if (!conversation) return null;

  if (
    conversation.buyerId !== session.userId &&
    conversation.sellerId !== session.userId
  ) {
    return null;
  }

  const otherParticipant =
    conversation.buyerId === session.userId
      ? conversation.seller
      : conversation.buyer;

  return {
    conversation,
    otherParticipant,
    currentUserId: session.userId,
  };
}

export async function getUserConversationsList() {
  const session = await getSession();
  if (!session) return [];

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { buyerId: session.userId },
        { sellerId: session.userId },
      ],
    },
    include: {
      buyer: { select: { id: true, name: true, campus: true } },
      seller: { select: { id: true, name: true, campus: true } },
      listing: { select: { id: true, title: true, price: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conv) => {
    const isBuyer = conv.buyerId === session.userId;
    const otherParticipant = isBuyer ? conv.seller : conv.buyer;
    const lastMessage = conv.messages[0] || null;

    return {
      id: conv.id,
      otherParticipant,
      listing: conv.listing,
      lastMessage,
      updatedAt: conv.updatedAt,
      isUnread: lastMessage && !lastMessage.read && lastMessage.senderId !== session.userId,
    };
  });
}
