-- Fix 1: Make chat-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-attachments';

-- Fix 2: Drop overly permissive storage policy and create proper one
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;

-- Create secure SELECT policy that only allows conversation participants
CREATE POLICY "Conversation participants can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 3: Fix conversation_participants INSERT policy (remove OR auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations they're in"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 4: Add UPDATE policy for conversation_participants (for read receipts)
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());