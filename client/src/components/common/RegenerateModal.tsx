import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RegenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (feedback: string[]) => void;
    isLoading: boolean;
}

const FEEDBACK_OPTIONS = [
    "Content too difficult/confusing",
    "Content too short/sketchy",
    "Missing practical examples",
    "Not focused on topic"
];

const RegenerateModal = ({ isOpen, onClose, onConfirm, isLoading }: RegenerateModalProps) => {
    const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleCheckboxChange = (option: string) => {
        setSelectedFeedback(prev => {
            if (prev.includes(option)) {
                return prev.filter(item => item !== option);
            } else {
                return [...prev, option];
            }
        });
    };

    const handleSubmit = () => {
        onConfirm(selectedFeedback);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={20} />
                        Regenerate Lesson
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                        This action will <strong>regenerate the lesson content</strong> based on your feedback.
                        <br />
                        <span className="text-red-500 font-medium">Warning: Current chat history for this module will be deleted.</span>
                    </p>

                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Why do you want to regenerate?</h4>

                    <div className="space-y-3">
                        {FEEDBACK_OPTIONS.map((option) => (
                            <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedFeedback.includes(option)}
                                    onChange={() => handleCheckboxChange(option)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-200">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedFeedback.length === 0 || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isLoading ? 'Regenerating...' : 'Confirm & Regenerate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegenerateModal;
