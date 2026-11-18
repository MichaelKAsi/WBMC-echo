import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, LifeBuoy, MessageCircle, Star, MessageSquareHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  content: string;
  created_at: string;
}

type View = "hub" | "chat" | "feedback";

const Helpdesk = () => {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [view, setView] = useState<View>("hub");

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Feedback state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!roleLoading && !user) navigate("/login");
  }, [roleLoading, user, navigate]);

  // Load chat when entering chat view
  useEffect(() => {
    if (view !== "chat" || !user) return;
    setChatLoading(true);
    (async () => {
      let { data: convo } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!convo) {
        const { data: created, error } = await supabase
          .from("support_conversations")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (error) {
          toast({ title: "Failed to start chat", description: error.message, variant: "destructive" });
          setChatLoading(false);
          return;
        }
        convo = created;
      }
      setConversationId(convo.id);

      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: true });
      setMessages((msgs as Message[]) || []);
      setChatLoading(false);

      await supabase
        .from("support_conversations")
        .update({ unread_for_user: 0 })
        .eq("id", convo.id);
    })();
  }, [view, user, toast]);

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`support-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
          if ((payload.new as Message).sender_role === "admin") {
            supabase.from("support_conversations").update({ unread_for_user: 0 }).eq("id", conversationId);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("support_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: "user",
      content,
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setInput(content);
    }
    setSending(false);
  };

  const handleSubmitFeedback = async () => {
    if (!user || rating === 0) {
      toast({ title: "Please rate your experience", description: "Tap a star to set your rating.", variant: "destructive" });
      return;
    }
    setSubmittingFeedback(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("support_feedback").insert({
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
      user_name: profile?.full_name ?? null,
      user_email: profile?.email ?? user.email ?? null,
    });
    setSubmittingFeedback(false);
    if (error) {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thank you!", description: "Your feedback has been submitted." });
    setRating(0);
    setComment("");
    setView("hub");
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const headerTitle = view === "chat" ? "Live Chat" : view === "feedback" ? "Feedback" : "Helpdesk";
  const headerSubtitle =
    view === "chat" ? "Chat with our support team" : view === "feedback" ? "Tell us about your experience" : "How can we help?";

  const handleBack = () => {
    if (view === "hub") navigate("/");
    else setView("hub");
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={handleBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <LifeBuoy className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground text-sm">{headerTitle}</h1>
          <p className="text-[11px] text-muted-foreground">{headerSubtitle}</p>
        </div>
      </header>

      {view === "hub" && (
        <div className="flex-1 px-4 py-6 space-y-3">
          <button
            onClick={() => setView("chat")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-left"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Live Chat</p>
              <p className="text-xs text-muted-foreground">Chat with our support team in real time</p>
            </div>
          </button>

          <button
            onClick={() => setView("feedback")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-left"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Feedback Box</p>
              <p className="text-xs text-muted-foreground">Rate your experience and leave a comment</p>
            </div>
          </button>
        </div>
      )}

      {view === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {chatLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                Send a message to start the conversation. Our team will reply soon.
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_role === "user";
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

          <div className="border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
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
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === "feedback" && (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">How was your experience?</p>
            <p className="text-xs text-muted-foreground">Tap a star to rate</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="p-1 transition-transform active:scale-90"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      filled ? "fill-primary text-primary" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Comments (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length}/1000</p>
          </div>

          <Button onClick={handleSubmitFeedback} disabled={submittingFeedback || rating === 0} className="w-full">
            {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
};

export default Helpdesk;
