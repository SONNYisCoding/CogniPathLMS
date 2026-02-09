import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';

const Home = () => {
    const navigate = useNavigate();
    const [goal, setGoal] = useState('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (goal) {
            navigate('/course-detail', { state: { goal, level } });
        }
    };

    return (
        <PageWrapper className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Start Your Journey</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Tell me what you want to learn.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Goal</label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-gray-100"
                            placeholder="What is your specific mission? (e.g., Build a Portfolio Website using React in 2 weeks)"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Level</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value as any)}
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 dark:text-gray-100"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Create Learning Path
                    </button>
                </form>
            </div>
        </PageWrapper>
    );
};

export default Home;
