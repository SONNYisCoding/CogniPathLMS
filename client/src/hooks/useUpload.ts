import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
    id: string;
    file: File;
    status: 'uploading' | 'completed' | 'error';
    progress: number; // 0 to 100
}

interface UseUploadReturn {
    files: UploadedFile[];
    fileErrors: readonly FileRejection[];
    onDrop: (acceptedFiles: File[]) => void;
    removeFile: (fileId: string) => void;
    getRootProps: any;
    getInputProps: any;
    isDragActive: boolean;
}

export const useUpload = (): UseUploadReturn => {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const simulateUpload = async (fileId: string) => {
        // Simulate progress
        for (let i = 0; i <= 100; i += 20) {
            setFiles(prev => prev.map(f =>
                f.id === fileId
                    ? { ...f, progress: i, status: i === 100 ? 'completed' : 'uploading' }
                    : f
            ));
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay per step
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: uuidv4(),
            file,
            status: 'uploading' as const,
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Start upload simulation for each new file
        newFiles.forEach(f => {
            simulateUpload(f.id);
        });
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

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    return {
        files,
        fileErrors: fileRejections,
        onDrop,
        removeFile,
        getRootProps,
        getInputProps,
        isDragActive
    };
};
