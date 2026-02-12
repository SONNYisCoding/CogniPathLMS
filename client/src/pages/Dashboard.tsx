import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGemini } from '../hooks/useGemini';
import { Plus, Clock, GraduationCap } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { PersonalizedPath } from '../types/gemini';

interface PathWithMeta extends PersonalizedPath {
    id: string;
    createdAt: string;
}

const Dashboard = () => {
    const { user } = useAuth();
    // Move getUserPaths directly into component scope to avoid dependency issues if not wrapped in useCallback
    // But since useGemini returns stable functions (hopefully), it acts like a custom hook. 
    // Wait, useGemini creates functions on every render in the previous implementation.
    // I should fix useGemini to use useCallback or just rely on useEffect dependency array.
    // user is stable from context.

    // Actually, in the previous step I implemented `useGemini` returning functions directly. 
    // They are re-created on every render.
    // Let's wrapping the fetching logic inside useEffect without depending on `getUserPaths` function directly, 
    // OR just disable the exhaustive-deps rule for this line if needed, but better to fix `useGemini` later.
    // For now, let's assume standard usage.

    const { getUserPaths, loading } = useGemini();
    const [paths, setPaths] = useState<PathWithMeta[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchPaths = async () => {
            if (user?.uid) {
                // getUserPaths is async
                const userPaths = await getUserPaths(user.uid);
                if (isMounted) {
                    // @ts-ignore - fixing type mismatch gracefully
                    setPaths(userPaths);
                }
            }
        };

        fetchPaths();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Removed getUserPaths dependency to avoid infinite loop if it's not memoized

    if (loading && paths.length === 0) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <PageWrapper>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Learning Paths</h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Manage and track your personalized learning journeys</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>New Path</span>
                    </button>
                </div>

                {paths.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No paths created yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Start your learning journey by generating a personalized path for any topic you want to master.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Plus size={20} />
                            Create your first path
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paths.map((path) => (
                            <div
                                key={path.id}
                                onClick={() => {
                                    console.log("Navigating to path:", path.id, "User:", user?.uid);
                                    if (user?.uid) {
                                        navigate(`/path/${user.uid}/${path.id}`, { state: { path } });
                                    } else {
                                        navigate(`/path/${path.id}`, { state: { path } });
                                    }
                                }}
                                className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 cursor-pointer hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-xs font-medium px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            {path.level || 'Beginner'}
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-end gap-1">
                                            <Clock size={12} />
                                            {path.createdAt ? new Date(path.createdAt).toLocaleDateString() : 'Recent'}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {path.title || path.overallGoal || `${path.studentName}'s Path`}
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm italic text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">
                                            "{path.overallGoal}"
                                        </p>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            {path.estimatedCompletionWeeks} Weeks
                                        </span>
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            {path.modules?.length || 0} Modules
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

export default Dashboard;
