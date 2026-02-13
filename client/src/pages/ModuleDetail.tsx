import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useGemini } from '../hooks/useGemini';
import { useAuth } from '../context/AuthContext';
import type { PersonalizedPath, ModuleData, ChatMessage } from '../types/gemini';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, ArrowRight, Send, Bot, BookOpen, RefreshCw } from 'lucide-react';
import ResizableLayout from '../components/layout/ResizableLayout';
import RegenerateModal from '../components/common/RegenerateModal';

const ModuleDetail = () => {
    const { pathId, moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { getPath, getModule, saveModule, generateLesson, regenerateLesson, contextChat, saveMessageToFirestore, getMessagesFromFirestore } = useGemini();

    const [path, setPath] = useState<PersonalizedPath | null>(location.state?.path || null);
    const [moduleData, setModuleData] = useState<ModuleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const init = async () => {
            if (!user || !pathId || !moduleId) return;

            setLoading(true);
            setMessages([]); // Clear previous chat messages
            try {
                // 1. Ensure Path Data (Syllabus)
                let currentPath = path;
                if (!currentPath) {
                    currentPath = await getPath(user.uid, pathId);
                    setPath(currentPath);
                }

                // 2. Fetch Module Data
                const mod = await getModule(user.uid, pathId, moduleId);
                if (mod) {
                    setModuleData(mod);
                } else {
                    // Initialize empty module if not found
                    setModuleData({
                        id: moduleId,
                        content: '',
                        status: 'not_started'
                    });
                }

                // 3. Fetch Chat History
                const history = await getMessagesFromFirestore(user.uid, pathId, moduleId);
                setMessages(history || []);

            } catch (err) {
                console.error("Error initializing module:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathId, moduleId, user]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleGenerateLesson = async () => {
        if (!path || !moduleId || !user || !pathId) return;

        const currentModule = path.modules.find(m => m.id === moduleId);
        if (!currentModule) return;

        setGenerating(true);
        try {
            const content = await generateLesson(
                currentModule.title,
                currentModule.description,
                path.overallGoal
            );

            const newModuleData: ModuleData = {
                id: moduleId,
                content,
                status: 'in_progress',
                lastAccessed: new Date().toISOString()
            };

            await saveModule(user.uid, pathId, newModuleData);
            setModuleData(newModuleData);
        } catch (err) {
            console.error("Failed to generate:", err);
            alert("Failed to generate lesson content. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerateConfirm = async (feedback: string[]) => {
        if (!path || !moduleId || !user || !pathId) return;

        const currentModule = path.modules.find(m => m.id === moduleId);
        if (!currentModule) return;

        setGenerating(true);
        setIsRegenerateModalOpen(false); // Close modal

        try {
            // New regenerate call with feedback
            const content = await regenerateLesson(
                pathId,
                moduleId,
                currentModule.title,
                currentModule.description,
                path.overallGoal,
                user.uid,
                feedback
            );

            const newModuleData: ModuleData = {
                id: moduleId,
                content,
                status: 'in_progress',
                lastAccessed: new Date().toISOString()
            };

            await saveModule(user.uid, pathId, newModuleData);
            setModuleData(newModuleData);

            // Clear chat messages locally
            setMessages([]);

        } catch (err) {
            console.error("Failed to regenerate:", err);
            alert("Failed to regenerate lesson content. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || chatLoading) return;

        const newUserMsg: ChatMessage = { role: 'user', text: chatInput, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, newUserMsg]);
        setChatInput('');
        setChatLoading(true);

        const targetUserId = user?.uid;

        // Persist User Message
        if (targetUserId && pathId && moduleId) {
            saveMessageToFirestore(targetUserId, pathId, moduleId, newUserMsg);
        }

        try {
            // Prepare Context
            const context = {
                moduleContent: moduleData?.content || "",
                pathSyllabus: JSON.stringify(path?.modules.map(m => m.title))
            };

            const response = await contextChat([...messages, newUserMsg], newUserMsg.text, context);

            const botMsg: ChatMessage = { role: 'model', text: response.text, createdAt: new Date().toISOString() };
            setMessages(prev => [...prev, botMsg]);

            // Persist Bot Message
            if (targetUserId && pathId && moduleId) {
                saveMessageToFirestore(targetUserId, pathId, moduleId, botMsg);
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading || !path) return <LoadingSpinner fullScreen />;

    const currentModuleIndex = path.modules.findIndex(m => m.id === moduleId);
    const currentModule = path.modules[currentModuleIndex];
    const prevModule = path.modules[currentModuleIndex - 1];
    const nextModule = path.modules[currentModuleIndex + 1];

    if (!currentModule) return <div>Module not found</div>;

    return (
        <ResizableLayout
            leftContent={
                <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">
                                {path.studentName}'s Path &bull; Module {currentModuleIndex + 1}
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentModule.title}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/path/${pathId}`)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full sm:w-auto"
                            >
                                <ArrowLeft size={16} />
                                Back to Map
                            </button>

                            {moduleData?.content && (
                                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                            )}

                            {moduleData?.content && (
                                <button
                                    onClick={() => setIsRegenerateModalOpen(true)}
                                    disabled={generating}
                                    title="Regenerate Lesson"
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <RefreshCw size={18} className={generating ? "animate-spin" : ""} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-grow overflow-y-auto p-8 bg-white dark:bg-gray-900">
                        <div className="max-w-3xl mx-auto">
                            {!moduleData?.content ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                        <BookOpen size={48} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-center max-w-md">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to start?</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                            I have prepared a detailed lesson plan for "{currentModule.title}".
                                            Click below to generate the full study material using Deep Learning models.
                                        </p>
                                        <button
                                            onClick={handleGenerateLesson}
                                            disabled={generating}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {generating ? 'Researching & Writing...' : 'Start Lesson'}
                                            {generating && (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none pb-20">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="relative group">
                                                        <pre className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-pink-500 font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {moduleData.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>

                    <RegenerateModal
                        isOpen={isRegenerateModalOpen}
                        onClose={() => setIsRegenerateModalOpen(false)}
                        onConfirm={handleRegenerateConfirm}
                        isLoading={generating}
                    />

                    {/* Footer Navigation */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
                        <button
                            onClick={() => prevModule && navigate(`/path/${pathId}/module/${prevModule.id}`)}
                            disabled={!prevModule}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-700 dark:text-gray-300 font-medium"
                        >
                            <ArrowLeft size={18} /> Previous
                        </button>

                        <div className="h-1 bg-gray-200 rounded-full w-1/3 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${((currentModuleIndex + 1) / path.modules.length) * 100}%` }}
                            />
                        </div>

                        <button
                            onClick={() => nextModule && navigate(`/path/${pathId}/module/${nextModule.id}`)}
                            disabled={!nextModule}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-700 dark:text-gray-300 font-medium"
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            }
            rightContent={
                <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <Bot size={20} className="text-blue-500" />
                            CogniPath Tutor
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Ask me anything about this lesson. I have context from the path.
                        </p>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-600 py-10 text-sm">
                                <p>No messages yet.</p>
                                <p>Ask a question about the content on the left!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'}
                                `}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about this topic..."
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || chatLoading}
                                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            }
        />
    );
};

export default ModuleDetail;
