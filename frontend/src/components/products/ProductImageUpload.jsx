import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Loader2, AlertCircle, Image as ImageIcon, Link } from 'lucide-react';
import { CheckCircle } from 'lucide-react';

const ProductImageUpload = ({ 
  productId, 
  existingImages = [], 
  onUploadSuccess,
  onFileSelect, // ✅ Pass selected files to parent
  isCreatingNew = false,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [images, setImages] = useState(existingImages || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [tempImageUrls, setTempImageUrls] = useState([]);
  const [cloudUrl, setCloudUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // ✅ Store actual files

  // Update images when existingImages changes
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setImages(existingImages);
    }
  }, [existingImages]);

  // ============================================
  // DROPZONE HANDLERS
  // ============================================

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: maxSize,
    maxFiles: maxFiles,
    onDrop: async (acceptedFiles) => {
      // Check max files
      if (images.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} images.`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // ✅ Store the actual files for later upload
        const newFiles = [...selectedFiles, ...acceptedFiles];
        setSelectedFiles(newFiles);
        
        // Pass files to parent
        if (onFileSelect) {
          onFileSelect(newFiles);
        }

        // Create preview URLs for display
        const previewUrls = acceptedFiles.map((file) => {
          return URL.createObjectURL(file);
        });
        
        setTempImageUrls([...tempImageUrls, ...previewUrls]);
        
        // Add to images array with preview URLs
        const newImages = [...images, ...previewUrls];
        setImages(newImages);
        
        // Call onUploadSuccess with the image URLs
        if (onUploadSuccess) {
          onUploadSuccess(newImages);
        }
        
        console.log('✅ Images prepared for upload:', newImages.length);

      } catch (error) {
        console.error('Upload error:', error);
        setError(error.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    onDropRejected: (fileRejections) => {
      const errorMessage = fileRejections[0]?.errors[0]?.message || 'File rejected.';
      setError(errorMessage);
    },
  });

  // ============================================
  // CLOUD URL HANDLER
  // ============================================

  const handleAddCloudUrl = () => {
    if (!cloudUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    try {
      new URL(cloudUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://...)');
      return;
    }

    if (images.includes(cloudUrl)) {
      setError('This image URL is already added');
      return;
    }

    const newImages = [...images, cloudUrl];
    setImages(newImages);
    
    if (onUploadSuccess) {
      onUploadSuccess(newImages);
    }
    
    setCloudUrl('');
    setError(null);
  };

  // ============================================
  // DELETE IMAGE HANDLER
  // ============================================

  const handleDeleteImage = (index) => {
    const imageToDelete = images[index];
    
    // Check if it's a temporary image (blob URL)
    const isTemp = typeof imageToDelete === 'string' && 
      (imageToDelete.startsWith('blob:') || imageToDelete.startsWith('data:'));

    // Remove from images array
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    // If it's a temp image, also remove from selected files
    if (isTemp) {
      // Find and remove the corresponding file
      // Since we can't match directly, we remove by index from selectedFiles
      const newFiles = [...selectedFiles];
      // If we have files and the index is valid
      if (newFiles.length > index) {
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        if (onFileSelect) {
          onFileSelect(newFiles);
        }
      }
    }

    // Remove from temp URLs
    if (isTemp) {
      const newTempUrls = [...tempImageUrls];
      const tempIndex = tempImageUrls.indexOf(imageToDelete);
      if (tempIndex !== -1) {
        newTempUrls.splice(tempIndex, 1);
        setTempImageUrls(newTempUrls);
      }
      // ✅ Revoke the object URL to free memory
      URL.revokeObjectURL(imageToDelete);
    }

    // Notify parent
    if (onUploadSuccess) {
      onUploadSuccess(newImages);
    }
  };

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      // Clean up temporary URLs on unmount
      tempImageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [tempImageUrls]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Info Banner for new products */}
      {isCreatingNew && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Upload images now. They will be uploaded when you save the product.
          </p>
        </div>
      )}

      {/* Cloud Storage URL Input */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add image from cloud storage
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={cloudUrl}
            onChange={(e) => setCloudUrl(e.target.value)}
            placeholder="https://drive.google.com/your-image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCloudUrl()}
          />
          <button
            type="button"
            onClick={handleAddCloudUrl}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Add URL
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Supports: Google Drive, Dropbox, OneDrive, Imgur, or any public image URL
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          ⚠️ Make sure the image is publicly accessible
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500'}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-12 w-12 mx-auto text-indigo-600 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Preparing images...</p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              PNG, JPG, GIF, WEBP up to 5MB each (max {maxFiles} images)
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {images.length} / {maxFiles} images uploaded
            </p>
            {isCreatingNew && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                💡 Images will be uploaded when you save the product
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => {
            // Check if it's a temporary image (blob URL)
            const isTemp = typeof image === 'string' && 
              (image.startsWith('blob:') || image.startsWith('data:'));
            
            // Check if it's a cloud URL
            const isCloudUrl = typeof image === 'string' && 
              (image.startsWith('http://') || image.startsWith('https://')) && !isTemp;
            
            return (
              <div 
                key={index} 
                className="relative group border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    // ✅ Use local placeholder instead of external
                    e.target.src = '/images/placeholder.svg';
                  }}
                />
                
                {/* Badges */}
                {isTemp && (
                  <div className="absolute top-1 left-1 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                    New
                  </div>
                )}
                {isCloudUrl && (
                  <div className="absolute top-1 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    Cloud
                  </div>
                )}
                
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600 dark:text-green-400">
            {images.length} image(s) ready
            {isCreatingNew && ' - Will be uploaded when saved'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;