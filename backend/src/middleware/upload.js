import multer from 'multer';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import path from 'path';

// Memory storage (store file in memory before uploading to Supabase)
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5);

// ============================================
// ✅ Helper: Upload to Supabase
// ============================================
export const uploadToSupabase = async (file, folder = '') => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  
  // ✅ FIXED: Don't add folder name here - the bucket is already the folder
  // The filePath should just be the filename
  const filePath = `${uniqueSuffix}${ext}`;

  console.log('📤 Uploading to Supabase...');
  console.log('📁 Bucket:', BUCKET_NAME);
  console.log('📄 File path:', filePath);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
    });

  if (error) {
    console.error('❌ Supabase upload error:', error);
    throw new Error(`Upload to Supabase failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  console.log('🔗 Public URL:', urlData.publicUrl);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

// ============================================
// Helper: Delete from Supabase
// ============================================
export const deleteFromSupabase = async (filePath) => {
  // If filePath contains the folder name, extract just the filename
  const cleanPath = filePath.includes('/') ? filePath.split('/').pop() : filePath;
  
  console.log('🗑️ Deleting from Supabase:', cleanPath);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([cleanPath]);

  if (error) {
    console.error('Delete from Supabase failed:', error);
    return false;
  }
  console.log('✅ Deleted from Supabase:', cleanPath);
  return true;
};

export default upload;