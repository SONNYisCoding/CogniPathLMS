import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Home, User, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { useGemini } from '../../hooks/useGemini';
import { useEffect, useRef, useState } from 'react';
import type { PersonalizedPath } from '../../types/gemini';

const MobileSidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useUI();
    const { user } = useAuth();
    const { getUserPaths } = useGemini();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [recentPaths, setRecentPaths] = useState<(PersonalizedPath & { id: string })[]>([]);

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
                toggleSidebar();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSidebarOpen, toggleSidebar]);

    // Close sidebar on route change
    useEffect(() => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch recent paths
    useEffect(() => {
        let isMounted = true;
        const fetchRecentPaths = async () => {
            if (user?.uid && isSidebarOpen) {
                const paths = await getUserPaths(user.uid);
                if (isMounted) {
                    // @ts-ignore
                    setRecentPaths(paths.slice(0, 5));
                }
            }
        };
        fetchRecentPaths();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isSidebarOpen]);

    const links = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/dashboard', label: 'My Paths', icon: LayoutDashboard },
        ...(user ? [{ to: '/profile', label: 'Profile', icon: User }] : []),
        // Add more links as needed
    ];

    return (
        <>
            {/* Backdrop */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity" />
            )}

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-40 lg:hidden border-r border-gray-200 dark:border-gray-800 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h2>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Icon size={20} />
                                {link.label}
                            </Link>
                        );
                    })}

                    {recentPaths.length > 0 && (
                        <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                My History
                            </h3>
                            <div className="space-y-1">
                                {recentPaths.map((path) => (
                                    <button
                                        key={path.id}
                                        onClick={() => {
                                            if (user?.uid) {
                                                navigate(`/path/${user.uid}/${path.id}`, { state: { path } });
                                            } else {
                                                navigate(`/path/${path.id}`, { state: { path } });
                                            }
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <GraduationCap size={16} />
                                        <span className="truncate">{path.overallGoal}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </>
    );
};

export default MobileSidebar;
