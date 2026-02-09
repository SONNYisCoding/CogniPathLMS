import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileSidebar from './MobileSidebar';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
            <Navbar />
            <MobileSidebar />
            <main className="flex-grow flex flex-col relative z-0">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
