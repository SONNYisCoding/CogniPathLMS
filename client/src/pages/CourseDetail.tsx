import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
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
    const { files, onDrop, removeFile } = useUpload(); // Using useUpload just for state management here

    const state = location.state as { goal: string; level: string } | null;

    useEffect(() => {
        if (!state) {
            navigate('/');
        }
    }, [state, navigate]);

    if (!state) return null;

    const handleGenerate = async () => {
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
            files: files // Passing the array of File objects directly
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
                        Add Context (Optional)
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

                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        Generate Path
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default CourseDetail;
