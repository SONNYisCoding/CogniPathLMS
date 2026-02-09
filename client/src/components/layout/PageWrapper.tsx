import { type ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
    fullWidth?: boolean;
}

const PageWrapper = ({ children, className = '', fullWidth = false }: PageWrapperProps) => {
    return (
        <div className={`
      ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}
      py-6 lg:py-8
      animate-in fade-in duration-500
      ${className}
    `}>
            {children}
        </div>
    );
};

export default PageWrapper;
