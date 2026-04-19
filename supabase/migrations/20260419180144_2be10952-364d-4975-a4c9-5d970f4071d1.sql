DROP POLICY IF EXISTS "Auth upload covers" ON storage.objects;
CREATE POLICY "Users upload covers to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner update covers" ON storage.objects;
CREATE POLICY "Users update own covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner delete covers" ON storage.objects;
CREATE POLICY "Users delete own covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );