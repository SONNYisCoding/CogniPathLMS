import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// [UPDATE 1] Đảm bảo đã import signInWithRedirect và getRedirectResult
import {
    signInWithRedirect,
    getRedirectResult,
    signOut
} from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../firebase';
import type { UserProfile } from '../types/models';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [firebaseUser, loading] = useAuthState(auth);
    const [user, setUser] = useState<UserProfile | null>(null);

    // [UPDATE 2] Thêm useEffect này để xử lý kết quả khi người dùng quay lại từ trang Google
    // Hàm này chỉ chạy 1 lần khi trang web load lại sau khi redirect
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log("Đăng nhập Redirect thành công:", result.user.displayName);
                    // Không cần setUser ở đây vì useAuthState ở dưới sẽ tự động bắt được sự thay đổi
                }
            } catch (error: any) {
                console.error("Lỗi khi xử lý kết quả Redirect:", error);
                // Hiển thị lỗi nếu người dùng hủy đăng nhập hoặc có lỗi mạng
                if (error.code !== 'auth/popup-closed-by-user') {
                    alert(`Đăng nhập thất bại: ${error.message}`);
                }
            }
        };

        checkRedirectResult();
    }, []);

    // Effect cũ của bạn: Đồng bộ state firebaseUser sang user local
    useEffect(() => {
        if (firebaseUser) {
            setUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
            });
        } else {
            setUser(null);
        }
    }, [firebaseUser]);

    const loginWithGoogle = async () => {
        try {
            // [UPDATE 3] Thay thế signInWithPopup bằng signInWithRedirect
            // Cách này sẽ chuyển trang sang Google.com thay vì mở cửa sổ nhỏ, tránh lỗi chặn Popup
            await signInWithRedirect(auth, googleProvider);

            // Lưu ý: Code phía sau dòng này sẽ KHÔNG chạy ngay lập tức 
            // vì trang web sẽ load lại. Kết quả sẽ được xử lý ở useEffect bên trên.
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            alert(`Sign in failed: ${error.message}`);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};