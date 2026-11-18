
-- Conversations: one per user (shared admin inbox)
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_for_user INTEGER NOT NULL DEFAULT 0,
  unread_for_admin INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversation"
ON public.support_conversations FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own conversation"
ON public.support_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins update conversation"
ON public.support_conversations FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user','admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_conv ON public.support_messages(conversation_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own conversation or admin"
ON public.support_messages FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Send message in own conversation or as admin"
ON public.support_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    (sender_role = 'admin' AND public.has_role(auth.uid(), 'admin'))
    OR (sender_role = 'user' AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    ))
  )
);

-- Trigger to update conversation summary + unread counters on new message
CREATE OR REPLACE FUNCTION public.handle_new_support_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message = NEW.content,
      last_message_at = NEW.created_at,
      updated_at = now(),
      unread_for_user = CASE WHEN NEW.sender_role = 'admin' THEN unread_for_user + 1 ELSE unread_for_user END,
      unread_for_admin = CASE WHEN NEW.sender_role = 'user' THEN unread_for_admin + 1 ELSE unread_for_admin END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_message_insert
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_support_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_conversations REPLICA IDENTITY FULL;
