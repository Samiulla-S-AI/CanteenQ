import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, currentUrl, label = "Feature Image" }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentUrl prop when it changes (e.g. when editing a different item)
  useEffect(() => {
    setPreview(currentUrl || null);
    setError(null);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const secureUrl = await uploadToCloudinary(file);
      onUpload(secureUrl);
      setPreview(secureUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setPreview(currentUrl || null); // Revert to previous URL on error
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError(null);
    onUpload('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {preview ? (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white text-xs font-medium">Compressing & Uploading...</span>
              </div>
            </div>
          ) : (
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FC8A14] hover:bg-orange-50 transition-all group"
        >
          <div className="p-3 bg-gray-100 rounded-full group-hover:bg-orange-100 transition-colors">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#FC8A14]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 group-hover:text-[#FC8A14]">Click to upload image</p>
            <p className="text-xs text-gray-400 mt-1">Auto-compressed before upload</p>
          </div>
          <div className="mt-2 px-4 py-2 bg-[#FC8A14] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#e07a0c] transition-colors">
            Choose File
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium">⚠️ {error}</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default ImageUpload;
