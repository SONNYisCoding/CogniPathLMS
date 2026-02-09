import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';
import { User, Mail } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <PageWrapper className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Please Sign In</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">You need to be logged in to view your profile.</p>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -top-12 mb-4">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-md object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <User size={40} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.displayName || "Anonymous User"}</h1>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Actions</h3>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Profile;
