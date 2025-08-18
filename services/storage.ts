import { supabase } from '@/lib/supabaseClient';

/**
 * Upload an avatar image to the 'avatars' storage bucket and return a public URL.
 * Accepts a local file URI (from Expo ImagePicker) and optional contentType.
 */
export async function uploadAvatarAsync(fileUri: string, contentType = 'image/jpeg'): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  // Fetch the file into a Blob
  const res = await fetch(fileUri);
  const blob = await res.blob();

  const path = `${user.id}/${Date.now()}.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType, upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!publicData?.publicUrl) throw new Error('Failed to generate public URL');
  return publicData.publicUrl;
}
