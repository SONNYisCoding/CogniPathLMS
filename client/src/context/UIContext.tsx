import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface UIContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    loadingMessage: string | null;
    setLoadingMessage: (message: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

    // Theme logic - simpler version than what might be in main.tsx or index.css
    // We'll initialize based on system preference or localStorage if we had it
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'dark' || storedTheme === 'light') {
                return storedTheme;
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <UIContext.Provider value={{
            isSidebarOpen,
            toggleSidebar,
            theme,
            toggleTheme,
            loadingMessage,
            setLoadingMessage
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
