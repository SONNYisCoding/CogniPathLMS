import { Link } from 'react-router-dom';
import { BrainCircuit, Menu, Moon, Sun, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

const Navbar = () => {
    const { user, loginWithGoogle, logout } = useAuth();
    const { toggleSidebar, theme, toggleTheme } = useUI();

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 sm:px-6 shadow-sm z-20 sticky top-0">
            <button
                onClick={toggleSidebar}
                className="mr-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-600 dark:text-gray-300"
            >
                <Menu size={24} />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 text-blue-600">
                <BrainCircuit size={32} />
                <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                    CogniPath <span className="text-gray-500 dark:text-gray-400 font-normal">AI Tutor</span>
                </h1>
            </Link>

            <div className="hidden lg:flex items-center h-full ml-10 space-x-8">
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Paths</Link>
                {user && (
                    <Link to="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Profile</Link>
                )}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {user ? (
                    <div className="flex items-center gap-3">
                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <UserIcon size={16} />
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">
                                {user.displayName?.split(' ')[0]}
                            </span>
                        </Link>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={loginWithGoogle}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-md"
                    >
                        <UserIcon size={16} />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Navbar;
