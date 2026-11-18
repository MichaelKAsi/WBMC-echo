import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, LifeBuoy, MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  user_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_for_admin: number;
  user_name?: string | null;
  user_email?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  content: string;
  created_at: string;
}

interface Feedback {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

const AdminHelpdesk = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [tab, setTab] = useState<"chats" | "feedback">("chats");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading && (!user || !isAdmin)) navigate("/");
  }, [roleLoading, user, isAdmin, navigate]);

  const loadConversations = async () => {
    const { data: convs } = await supabase
      .from("support_conversations")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (!convs) return;
    const userIds = convs.map((c) => c.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds);
    const map = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    setConversations(
      convs.map((c) => ({
        ...c,
        user_name: map.get(c.user_id)?.full_name,
        user_email: map.get(c.user_id)?.email,
      }))
    );
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    const { data } = await supabase
      .from("support_feedback")
      .select("*")
      .order("created_at", { ascending: false });
    setFeedback((data as Feedback[]) || []);
    setFeedbackLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadConversations();
    loadFeedback();
    const convChannel = supabase
      .channel("admin-support-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => loadConversations())
      .subscribe();
    const fbChannel = supabase
      .channel("admin-feedback-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_feedback" }, () => loadFeedback())
      .subscribe();
    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(fbChannel);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    (async () => {
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      setMessages((msgs as Message[]) || []);
      setLoadingMsgs(false);
      await supabase.from("support_conversations").update({ unread_for_admin: 0 }).eq("id", activeId);
    })();

    const channel = supabase
      .channel(`admin-support-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
          if ((payload.new as Message).sender_role === "user") {
            supabase.from("support_conversations").update({ unread_for_admin: 0 }).eq("id", activeId);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeId || !user) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("support_messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      sender_role: "admin",
      content,
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setInput(content);
    }
    setSending(false);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);
  const avgRating = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => (activeId ? setActiveId(null) : navigate("/admin"))} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <LifeBuoy className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm truncate">
            {active ? active.user_name || active.user_email || "User" : "Helpdesk"}
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {active ? active.user_email : "Support chats & feedback"}
          </p>
        </div>
      </header>

      {active ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_role === "admin";
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={cn("text-[10px] mt-1", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border bg-card p-3 safe-area-pb">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Reply to user..."
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "chats" | "feedback")} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mx-4 mt-3">
            <TabsTrigger value="chats">
              Chats {conversations.length > 0 && `(${conversations.length})`}
            </TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback {feedback.length > 0 && `(${feedback.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="flex-1 overflow-y-auto mt-2">
            {conversations.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-16 px-6">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                No support conversations yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(c.user_name || c.user_email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-foreground truncate">
                            {c.user_name || c.user_email || "User"}
                          </p>
                          {c.last_message_at && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {new Date(c.last_message_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.last_message || "No messages yet"}
                        </p>
                      </div>
                      {c.unread_for_admin > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {c.unread_for_admin}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="flex-1 overflow-y-auto mt-2">
            {feedbackLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-16 px-6">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-40" />
                No feedback submitted yet.
              </div>
            ) : (
              <>
                <div className="mx-4 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "h-4 w-4",
                          avgRating >= n ? "fill-primary text-primary" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{avgRating.toFixed(1)}</span> avg from {feedback.length} responses
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {feedback.map((f) => (
                    <li key={f.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {(f.user_name || f.user_email || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {f.user_name || f.user_email || "User"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(f.created_at).toLocaleDateString()} · {new Date(f.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                "h-3.5 w-3.5",
                                f.rating >= n ? "fill-primary text-primary" : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {f.comment && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap pl-10">{f.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminHelpdesk;
