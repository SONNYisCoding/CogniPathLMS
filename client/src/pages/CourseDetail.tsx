import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, Info } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import FileUploader from '../components/features/FileUpload/FileUploader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useGemini } from '../hooks/useGemini';
import { useUpload } from '../hooks/useUpload';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { generatePath, savePathToFirestore, loading: geminiLoading } = useGemini();
    const { files, onDrop, removeFile } = useUpload();

    const state = location.state as { goal: string; level: string } | null;

    useEffect(() => {
        if (!state) {
            navigate('/');
        }
    }, [state, navigate]);

    if (!state) return null;

    // Logic for disabling the Generate button
    // 1. Files empty? -> Initial state, maybe we allow generating without files? 
    //    User request says: "Nút phải ở trạng thái disabled khi chưa có bất kỳ tệp nào được chọn."
    //    Wait, usually adding context is optional. But if the user request explicitely wants it disabled if empty:
    //    "Trạng thái khởi tạo: Nút phải ở trạng thái disabled khi chưa có bất kỳ tệp nào được chọn."
    //    This suggests adding context is now mandatory for this specific flow or the user wants it that way.
    //    Let's follow the user instruction strictly.
    // 2. Any file uploading?

    // User Requirement: "Button disabled if empty OR any file uploading"
    const isUploading = files.some(f => f.status === 'uploading');
    const hasFiles = files.length > 0;
    const isGenerateDisabled = !hasFiles || isUploading;

    const handleGenerate = async () => {
        if (isGenerateDisabled) return;

        // Mock user profile if not logged in
        const userProfile = user || {
            uid: 'anonymous',
            displayName: 'Learner',
            email: null,
            photoURL: null
        };

        const path = await generatePath({
            userProfile,
            topic: state.goal,
            goal: state.goal,
            level: state.level,
            files: files.map(f => f.file) // Extract raw File objects for API
        });

        if (path) {
            // If user is logged in, save to Firestore
            let pathId = 'temp-id';
            if (user) {
                const savedId = await savePathToFirestore(user.uid, path);
                if (savedId) pathId = savedId;
            }

            // Navigate to personalized path
            navigate(`/path/${pathId}`, { state: { path } });
        }
    };

    if (geminiLoading) {
        return <LoadingSpinner fullScreen message="Generating your personalized learning path..." />;
    }

    return (
        <PageWrapper>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Details for <span className="text-blue-600">{state.goal}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Level: <span className="font-medium text-gray-900 dark:text-gray-200">{state.level}</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BrainCircuit size={24} className="text-blue-500" />
                        Add Context (Mandatory)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Upload any relevant documents, notes, or previous work to help us tailor the course content to your specific needs.
                    </p>

                    <FileUploader
                        onFilesSelected={onDrop}
                        currentFiles={files}
                        onRemoveFile={removeFile}
                    />
                </div>

                {isGenerateDisabled && (
                    <div className="flex justify-end mt-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/30">
                            <Info size={12} />
                            {files.length === 0
                                ? "Please upload at least one file to proceed."
                                : "Please wait for files to finish uploading."}
                        </span>
                    </div>
                )}

                <div className="flex justify-end gap-4 items-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm hover:shadow"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className={`
                            px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all transform flex items-center gap-2
                            ${isGenerateDisabled
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70 shadow-none'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
                            }
                        `}
                    >
                        {geminiLoading ? 'Generating...' : 'Generate Path'}
                        {!geminiLoading && <BrainCircuit size={18} />}
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default CourseDetail;
