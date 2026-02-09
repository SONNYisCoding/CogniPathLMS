import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface UseUploadReturn {
    files: File[];
    fileErrors: readonly FileRejection[];
    uploading: boolean;
    uploadProgress: number;
    handleUpload: () => Promise<string[]>; // Returns array of uploaded URLs or IDs
    onDrop: (acceptedFiles: File[]) => void;
    removeFile: (fileToRemove: File) => void;
    getRootProps: any;
    getInputProps: any;
    isDragActive: boolean;
}

export const useUpload = (): UseUploadReturn => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Add new files to existing files
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt', '.md'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter(f => f !== fileToRemove));
    };

    const handleUpload = async (): Promise<string[]> => {
        if (files.length === 0) return [];

        setUploading(true);
        setUploadProgress(0);

        // Simulate upload process
        // In a real app, this would upload to Firebase Storage or your backend
        try {
            // Mock upload delay
            for (let i = 0; i <= 100; i += 10) {
                setUploadProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Return mock URLs/IDs
            return files.map(f => f.name);
        } catch (error) {
            console.error("Upload failed", error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    return {
        files,
        fileErrors: fileRejections,
        uploading,
        uploadProgress,
        handleUpload,
        onDrop,
        removeFile,
        getRootProps,
        getInputProps,
        isDragActive
    };
};
