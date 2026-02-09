import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, X, Loader2 } from 'lucide-react';
import useDrivePicker from 'react-google-drive-picker';
import { GOOGLE_DRIVE_CONFIG } from '../../../config/google';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    accept?: Record<string, string[]>;
    currentFiles?: File[];
    onRemoveFile?: (file: File) => void;
    title?: string;
    description?: string;
    maxSize?: number;
}

const FileUploader = ({
    onFilesSelected,
    maxFiles = 5,
    accept = {
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt', '.md'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/webp': ['.webp'],
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm']
    },
    maxSize = 52428800, // 50MB default
    currentFiles = [],
    onRemoveFile,
    title = "Upload files",
    description = "Drag & drop files here, or click to select files"
}: FileUploaderProps) => {

    const [openPicker] = useDrivePicker();
    const [isDownloading, setIsDownloading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        maxSize
    });

    const downloadDriveFile = async (fileId: string, accessToken: string, fileName: string, mimeType: string): Promise<File> => {
        let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        let finalMimeType = mimeType;
        let finalFileName = fileName;

        // Handle Google Docs conversion to PDF
        if (mimeType === 'application/vnd.google-apps.document') {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
            finalMimeType = 'application/pdf';
            if (!finalFileName.toLowerCase().endsWith('.pdf')) {
                finalFileName += '.pdf';
            }
        }

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please re-authenticate with Google Drive.');
            }
            if (response.status === 403) {
                throw new Error('Forbidden: App may not have permission to access this file.');
            }
            throw new Error(`Failed to download file from Drive: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new File([blob], finalFileName, { type: finalMimeType });
    };

    const handleOpenPicker = () => {
        try {
            openPicker({
                clientId: GOOGLE_DRIVE_CONFIG.clientId,
                developerKey: GOOGLE_DRIVE_CONFIG.developerKey,
                viewId: "DOCS",
                showUploadView: true,
                multiselect: true,
                supportDrives: true,
                appId: GOOGLE_DRIVE_CONFIG.appId,
                viewMimeTypes: "application/pdf,application/vnd.google-apps.document,video/mp4,image/jpeg,image/png",
                customScopes: ['https://www.googleapis.com/auth/drive.readonly'],
                // explicit origin content for the picker
                setOrigin: window.location.origin,
                callbackFunction: async (data) => {
                    if (data.action === 'loaded') {
                        // Picker loaded successfully
                    }
                    if (data.action === 'cancel') {
                        setIsDownloading(false);
                    }
                    if (data.action === 'picked') {
                        setIsDownloading(true);
                        try {
                            const newFiles: File[] = [];
                            const token = (data as any).oauthToken;

                            for (const doc of data.docs) {
                                try {
                                    const file = await downloadDriveFile(doc.id, token, doc.name, doc.mimeType);
                                    newFiles.push(file);
                                } catch (err: any) {
                                    console.error(`Error downloading ${doc.name}:`, err);
                                    if (err.message && err.message.includes('Unauthorized')) {
                                        alert("Session expired. Please try selecting the file again to re-authenticate.");
                                        // Ideally, we could trigger a re-auth flow here if the picker supports it,
                                        // or just let the user click the button again which gets a fresh token.
                                    }
                                }
                            }

                            if (newFiles.length > 0) {
                                onFilesSelected(newFiles);
                            }
                        } catch (error) {
                            console.error("Error processing Drive files:", error);
                        } finally {
                            setIsDownloading(false);
                        }
                    }
                },
            });
        } catch (error) {
            console.error("Error opening Drive Picker:", error);
            if (error instanceof Error && error.message.includes('origin')) {
                alert(`Configuration Error: The origin "${window.location.origin}" is not allowed. Please check your Google Cloud Console Authorized Javascript Origins.`);
            }
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Action Buttons Area */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Google Drive Button */}
                <button
                    type="button"
                    onClick={handleOpenPicker}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="animate-spin text-blue-600" size={20} />
                            <span className="text-gray-700 dark:text-gray-200 font-medium">Downloading...</span>
                        </>
                    ) : (
                        <>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5" />
                            <span className="text-gray-700 dark:text-gray-200 font-medium">Select from Google Drive</span>
                        </>
                    )}
                </button>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out relative
          ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 bg-gray-50 dark:bg-gray-800/50'
                    }
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        <Upload size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        {isDragActive ? "Drop the files here..." : description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Supported formats: PDF, DOCX, IMG, MP4. Max file size: 50MB
                    </p>
                </div>
            </div>

            {fileRejections.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Rejected Files ({fileRejections.length})</h4>
                    <ul className="space-y-1">
                        {fileRejections.map(({ file, errors }) => (
                            <li key={file.name} className="flex items-start p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                <span className="mr-2">•</span>
                                <div>
                                    <span className="font-medium">{file.name}</span>
                                    <ul className="list-disc list-inside ml-2 mt-1 text-xs text-red-500">
                                        {errors.map(e => (
                                            <li key={e.code}>{e.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {currentFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files ({currentFiles.length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {currentFiles.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                                        <FileType size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                </div>
                                {onRemoveFile && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveFile(file);
                                        }}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
