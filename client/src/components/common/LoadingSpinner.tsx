import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
}

const LoadingSpinner = ({
    message = "Loading...",
    size = 'lg',
    fullScreen = false
}: LoadingSpinnerProps) => {

    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const content = (
        <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin mb-4`} />
            {message && (
                <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
