import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGemini } from '../hooks/useGemini';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PathVisualizer from '../components/features/LearningMap/PathVisualizer';
import ChatWindow from '../components/features/ChatBot/ChatWindow';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { PersonalizedPath, ChatMessage } from '../types/gemini';
import axiosClient from '../api/axiosClient';
import ResizableLayout from '../components/layout/ResizableLayout';

const PersonalizedPathPage = () => {
    const { pathId, userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getPath, saveMessageToFirestore, getMessagesFromFirestore } = useGemini();

    const [path, setPath] = useState<PersonalizedPath | null>(location.state?.path || null);
    const [loading, setLoading] = useState(!location.state?.path); // Load if no path in state
    const [chatLoading, setChatLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchPathAndMessages = async () => {
            // Use userId from params if available, otherwise fallback to auth user
            const targetUserId = userId || user?.uid;

            if (!targetUserId) {
                // No user ID found to fetch with
                console.error("No user ID available to fetch path");
                if (!path) setLoading(false);
                return;
            }

            if (!path && pathId) {
                try {
                    console.log(`Fetching path: ${pathId} for user: ${targetUserId}`);
                    const fetchedPath = await getPath(targetUserId, pathId);

                    if (isMounted) {
                        if (fetchedPath) {
                            setPath(fetchedPath);
                            setLoading(false);
                        } else {
                            console.error("Path not found");
                            setLoading(false);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching path:", err);
                    if (isMounted) setLoading(false);
                }
            }

            // Fetch Chat History
            if (pathId) {
                try {
                    const history = await getMessagesFromFirestore(targetUserId, pathId, null);
                    if (isMounted && history.length > 0) {
                        setMessages(history);
                    } else if (isMounted && history.length === 0 && path) {
                        // Default welcome message if no history
                        setMessages([
                            {
                                role: 'model',
                                text: `Hi! I've designed this learning path for you. Feel free to ask me anything about the modules!`
                            }
                        ]);
                    }
                } catch (err) {
                    console.error("Error fetching chat history:", err);
                }
            }
        };

        fetchPathAndMessages();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, pathId, userId, user]);

    // Separate effect for chat init to avoid loops - REMOVED as it's handled in main effect now

    const handleSendMessage = async (text: string) => {
        const newUserMsg: ChatMessage = { role: 'user', text, createdAt: new Date().toISOString() };
        const newMessages: ChatMessage[] = [...messages, newUserMsg];
        setMessages(newMessages);
        setChatLoading(true);

        const targetUserId = userId || user?.uid;

        // Persist User Message
        if (targetUserId && pathId) {
            saveMessageToFirestore(targetUserId, pathId, null, newUserMsg);
        }

        try {
            const response = await axiosClient.post('/chat', {
                history: newMessages,
                message: text
            });

            const botMsg: ChatMessage = { role: 'model', text: response.data.text, createdAt: new Date().toISOString() };
            setMessages(prev => [...prev, botMsg]);

            // Persist Bot Message
            if (targetUserId && pathId) {
                saveMessageToFirestore(targetUserId, pathId, null, botMsg);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading your learning path..." />;
    }

    if (!path) {
        return (
            <PageWrapper>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">Path not found</h2>
                    <button onClick={() => navigate('/')} className="text-blue-600 hover:underline mt-4">Go Home</button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <ResizableLayout
            leftContent={
                <div className="h-full p-4 flex flex-col">
                    <div className="flex-grow bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                        <PathVisualizer
                            path={path}
                            loading={false}
                            onModuleClick={(moduleId) => {
                                if (pathId && moduleId) {
                                    navigate(`/path/${pathId}/module/${moduleId}`, { state: { path } });
                                }
                            }}
                        />
                    </div>
                </div>
            }
            rightContent={
                <div className="h-full p-4 pl-0">
                    <ChatWindow
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        loading={chatLoading}
                    />
                </div>
            }
        />
    );
};

export default PersonalizedPathPage;
