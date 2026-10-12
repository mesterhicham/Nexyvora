-- Create typing indicators table
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can see typing indicators in their conversations
CREATE POLICY "Users can view typing indicators in their conversations"
ON public.typing_indicators
FOR SELECT
USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- Users can insert/update their own typing indicator
CREATE POLICY "Users can manage their own typing indicator"
ON public.typing_indicators
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can update their own typing indicator"
ON public.typing_indicators
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicator"
ON public.typing_indicators
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;