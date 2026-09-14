import { supabase } from './supabase';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'avatars';

export const uploadFile = async (file, userId) => {
  try {
    if (!file) {
      throw new Error('Please select a file.');
    }

    if (!userId || userId === 'unknown') {
      throw new Error('User ID is missing.');
    }

    // Limit size to 50MB (adjust as needed)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File must be smaller than 50 MB.');
    }

    // Sanitize file name and create unique path
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `${userId}/files/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        contentDisposition: 'inline',
      });

    if (uploadError) {
      console.error('Supabase file upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not generate file URL.');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
