import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!file) {
      throw new Error("No file provided");
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a reference to the file location
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileRef = ref(storage, `${path}/${fileName}`);
      
      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: 'candidate',
          originalName: file.name
        }
      };
      
      const snapshot = await uploadBytes(fileRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);
      return downloadURL;
    } catch (error: any) {
      console.error("File upload error:", error);
      if (error.code === 'storage/unauthorized') {
        throw new Error("Firebase Storage authentication failed. Please configure storage rules.");
      } else if (error.code === 'storage/invalid-format') {
        throw new Error("Invalid file format. Please upload PDF or image files only.");
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error("Storage quota exceeded. Please contact support.");
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleFiles = async (files: File[], basePath: string): Promise<string[]> => {
    setUploading(true);
    const uploadPromises = files.map((file, index) => 
      uploadFile(file, `${basePath}/${index}`)
    );
    
    try {
      const urls = await Promise.all(uploadPromises);
      return urls;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    uploading,
    uploadProgress,
  };
};
