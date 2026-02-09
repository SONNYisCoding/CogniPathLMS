import React from 'react';
import type { PersonalizedPath } from '../../../types/gemini';
import { Circle, Clock, BookOpen, BarChart } from 'lucide-react';

interface PathVisualizerProps {
    path: PersonalizedPath | null;
    loading: boolean;
    onModuleClick?: (moduleId: string) => void;
}

const PathVisualizer: React.FC<PathVisualizerProps> = ({ path, loading, onModuleClick }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-medium">AI is thinking...</p>
                <p className="text-sm mt-2">Designing your personalized curriculum</p>
            </div>
        );
    }

    if (!path || !path.modules) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BookOpen size={64} className="mb-4 opacity-50" />
                <p className="text-lg">
                    {!path ? "Enter your profile to generate a learning path." : "Generated path is incomplete. Please try again."}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-inner">
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{path.overallGoal}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1"><Clock size={16} /> {path.estimatedCompletionWeeks} Weeks</span>
                    <span className="flex items-center gap-1"><BarChart size={16} /> {path.modules.length} Modules</span>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Created for: <span className="font-semibold text-blue-600">{path.studentName}</span></p>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                <div className="space-y-8">
                    {path.modules.map((module, index) => (
                        <div
                            key={module.id}
                            className="relative flex gap-6 cursor-pointer group"
                            onClick={() => onModuleClick && onModuleClick(module.id)}
                        >
                            {/* Icon Indicator */}
                            <div className="flex-shrink-0 z-10 bg-gray-50 dark:bg-gray-900 py-1">
                                {index === 0 ? (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-sm group-hover:scale-110 transition-transform">
                                        <Circle size={24} fill="currentColor" className="opacity-20" />
                                        <span className="absolute font-bold text-lg">{index + 1}</span>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-sm group-hover:scale-110 transition-transform">
                                        <span className="font-bold">{index + 1}</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Card */}
                            <div className="flex-grow bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{module.title}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${module.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                        module.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {module.difficulty}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{module.description}</p>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {module.topics.map((topic, i) => (
                                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                            #{topic}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center text-xs text-gray-400">
                                    <Clock size={12} className="mr-1" /> {module.duration}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PathVisualizer;
