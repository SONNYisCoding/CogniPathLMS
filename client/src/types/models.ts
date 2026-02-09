export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

// Re-export existing types from gemini.ts if needed, or keep them separate.
// For now, we'll keep them separate as per instructions, but if we need to unify we can.
