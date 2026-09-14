import { supabase } from './supabase';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'avatars';

export const uploadAvatar = async (file, userId) => {
  try {
    if (!file) {
      throw new Error('Please select an image.');
    }

    if (!userId || userId === 'unknown') {
      throw new Error('User ID is missing.');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        'Invalid image type. Please upload JPG, PNG, GIF, WEBP or AVIF.'
      );
    }

    // 5 MB limit
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error('Image must be smaller than 5 MB.');
    }

    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Keep one avatar per user
    const filePath = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Supabase avatar upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not generate avatar URL.');
    }

    // Cache-busting so browser displays the newly uploaded image
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw error;
  }
};