CREATE TABLE public.support_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback"
ON public.support_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id AND rating BETWEEN 1 AND 5);

CREATE POLICY "Users view own feedback or admin"
ON public.support_feedback FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete feedback"
ON public.support_feedback FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_support_feedback_created_at ON public.support_feedback(created_at DESC);