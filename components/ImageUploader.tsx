
import React, { useState, useCallback } from 'react';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  title: string;
  icon: React.ReactNode;
  onImageUpload: (files: ImageFile[]) => void;
  multiple?: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to read file as base64 string'));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};


export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, icon, onImageUpload, multiple = false }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        alert('Please select valid image files.');
        return;
      }
      
      const filesToProcess = multiple ? imageFiles : [imageFiles[0]];

      previews.forEach(URL.revokeObjectURL);

      const newPreviewUrls = filesToProcess.map(file => URL.createObjectURL(file));
      setPreviews(newPreviewUrls);

      const imageFilePromises = filesToProcess.map(async (file) => {
        const base64 = await fileToBase64(file);
        return { base64, mimeType: file.type };
      });
      
      const imageFileData = await Promise.all(imageFilePromises);
      onImageUpload(imageFileData);
    }
  }, [onImageUpload, multiple, previews]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
      <h3 className="text-xl font-semibold text-slate-200 mb-4">{title}</h3>
      <label
        className={`relative w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors hover:border-purple-400 ${isDragging ? 'border-purple-500 bg-slate-700/50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          multiple={multiple}
          onChange={(e) => handleFileChange(e.target.files)}
        />
        {previews.length > 0 ? (
          <div className={`w-full h-full p-1 grid gap-1 ${previews.length > 1 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'}`}>
            {previews.map((src, index) => (
                <div key={index} className="relative w-full h-full min-h-0">
                    <img src={src} alt={`Preview ${index + 1}`} className="absolute top-0 left-0 w-full h-full object-contain rounded-md" />
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <div className="w-10 h-10 text-slate-500 mx-auto">{icon}</div>
            <p className="mt-2">Drag & drop or click to upload</p>
          </div>
        )}
      </label>
    </div>
  );
};