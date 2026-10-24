import { notFound, redirect } from "next/navigation";
import { getConversationDetails, fetchMessagesAsync } from "@/server/chat-actions";
import { getSession } from "@/lib/auth";
import { WhatsAppChatView } from "./whatsapp-chat-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Campus Chat | Local Loop",
  description: "Direct real-time WhatsApp style chat with campus student buyer/seller",
};

export default async function ConversationPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const details = await getConversationDetails(id);

  if (!details) {
    notFound();
  }

  const messagesResult = await fetchMessagesAsync(id);

  return (
    <WhatsAppChatView
      conversationId={id}
      initialMessages={messagesResult.messages || []}
      currentUserId={session.userId}
      otherParticipant={details.otherParticipant}
      listing={details.conversation.listing}
    />
  );
}
