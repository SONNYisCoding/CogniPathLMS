export interface LearningModule {
    id: string;
    title: string;
    duration: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    topics: string[];
    description: string;
}

export interface PersonalizedPath {
    studentName: string;
    title?: string;
    overallGoal: string;
    estimatedCompletionWeeks: number;
    level: string;
    modules: LearningModule[];
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    text: string;
    createdAt?: any;
}

export interface ModuleData {
    id: string; // matches the moduleId from the path
    content: string; // markdown content
    status: 'not_started' | 'in_progress' | 'completed';
    lastAccessed?: string;
}
