import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import type { PersonalizedPath, ModuleData, ChatMessage } from '../types/gemini';
import type { UserProfile } from '../types/models';

interface GeneratePathParams {
    userProfile: UserProfile;
    topic: string;
    goal: string;
    level: string;
    files?: File[]; // Changed from string[] to File[]
}

export const useGemini = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePath = async (params: GeneratePathParams): Promise<PersonalizedPath | null> => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('name', params.userProfile.displayName || "Learner");
            formData.append('goal', params.goal);
            formData.append('level', params.level);

            if (params.files && params.files.length > 0) {
                params.files.forEach((file) => {
                    formData.append('files', file);
                });
            }

            const response = await axiosClient.post('/generate-path', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const pathData: PersonalizedPath = response.data;
            return pathData;
        } catch (err: any) {
            console.error("Error generating path:", err);
            setError(err.message || "Failed to generate learning path");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const savePathToFirestore = async (userId: string, path: PersonalizedPath): Promise<string | null> => {
        try {
            // Save to users/{uid}/paths collection
            const pathsRef = collection(db, 'users', userId, 'paths');
            const docRef = await addDoc(pathsRef, {
                ...path,
                createdAt: new Date().toISOString()
            });
            console.log("Path saved to Firestore with ID:", docRef.id);
            return docRef.id;
        } catch (err) {
            console.error("Error saving path to Firestore:", err);
            return null;
        }
    };

    const getUserPaths = async (userId: string): Promise<(PersonalizedPath & { id: string, createdAt: string })[]> => {
        setLoading(true);
        try {
            const pathsRef = collection(db, 'users', userId, 'paths');
            const q = query(pathsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PersonalizedPath & { id: string, createdAt: string }));
        } catch (err: any) {
            console.error("Error fetching user paths:", err);
            setError(err.message || "Failed to fetch paths");
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getPath = async (userId: string, pathId: string): Promise<PersonalizedPath | null> => {
        setLoading(true);
        try {
            const docRef = doc(db, 'users', userId, 'paths', pathId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as PersonalizedPath;
            } else {
                console.log("No such path!");
                return null;
            }
        } catch (err: any) {
            console.error("Error fetching path:", err);
            setError(err.message || "Failed to fetch path");
            return null;
        } finally {
            setLoading(false);
        }
    };



    // --- Module Management ---

    const getModule = async (userId: string, pathId: string, moduleId: string): Promise<ModuleData | null> => {
        setLoading(true);
        try {
            const docRef = doc(db, 'users', userId, 'paths', pathId, 'modules', moduleId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as ModuleData;
            } else {
                return null;
            }
        } catch (err: any) {
            console.error("Error fetching module:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const saveModule = async (userId: string, pathId: string, moduleData: ModuleData): Promise<void> => {
        try {
            const docRef = doc(db, 'users', userId, 'paths', pathId, 'modules', moduleData.id);
            await setDoc(docRef, {
                ...moduleData,
                lastAccessed: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error("Error saving module:", err);
            throw err;
        }
    };

    const generateLesson = async (topic: string, description: string, userGoal: string): Promise<string> => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/generate-lesson', {
                topic,
                description,
                userGoal
            });
            return response.data.content;
        } catch (err: any) {
            console.error("Error generating lesson:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // --- Chat Management ---

    const contextChat = async (history: any[], message: string, context: any) => {
        try {
            const response = await axiosClient.post('/chat', {
                history,
                message,
                context
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const saveMessageToFirestore = async (userId: string, pathId: string, moduleId: string | null, message: ChatMessage) => {
        try {
            // Determine collection path
            let messagesRef;
            if (moduleId) {
                // Module-level chat: users/{uid}/paths/{pathId}/modules/{moduleId}/messages
                messagesRef = collection(db, 'users', userId, 'paths', pathId, 'modules', moduleId, 'messages');
            } else {
                // Path-level chat: users/{uid}/paths/{pathId}/messages
                messagesRef = collection(db, 'users', userId, 'paths', pathId, 'messages');
            }

            await addDoc(messagesRef, {
                ...message,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error saving message:", err);
            // Don't throw, just log. Chat should continue even if persistence fails momentarily.
        }
    };

    const getMessagesFromFirestore = async (userId: string, pathId: string, moduleId: string | null): Promise<ChatMessage[]> => {
        try {
            let messagesRef;
            if (moduleId) {
                messagesRef = collection(db, 'users', userId, 'paths', pathId, 'modules', moduleId, 'messages');
            } else {
                messagesRef = collection(db, 'users', userId, 'paths', pathId, 'messages');
            }

            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
        } catch (err) {
            console.error("Error fetching messages:", err);
            return [];
        }
    };

    const deletePath = async (pathId: string, userId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosClient.delete(`/paths/${pathId}`, {
                params: { userId }
            });
            return true;
        } catch (err: any) {
            console.error("Error deleting path:", err);
            setError(err.message || "Failed to delete path");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const regenerateLesson = async (pathId: string, moduleId: string, topic: string, description: string, userGoal: string, userId: string, feedback: string[]): Promise<string> => {
        setLoading(true);
        try {
            const response = await axiosClient.post(`/modules/${moduleId}/regenerate`, {
                topic,
                description,
                userGoal,
                feedback,
                pathId,
                userId
            });
            return response.data.content;
        } catch (err: any) {
            console.error("Error regenerating lesson:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        generatePath,
        savePathToFirestore,
        getUserPaths,
        getPath,
        getModule,
        saveModule,
        generateLesson,
        regenerateLesson,
        deletePath,
        contextChat,
        saveMessageToFirestore,
        getMessagesFromFirestore,
        loading,
        error
    };
};
