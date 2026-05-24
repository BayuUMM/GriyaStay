import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  db, 
  isFirebasePlaceholder, 
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
  email: string;
  isKtpVerified: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string, name: string) => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  verifyKtp: () => Promise<void>;
  isFirebaseReady: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('griyastay_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isFirebaseReady] = useState(() => !isFirebasePlaceholder);

  useEffect(() => {
    if (isFirebasePlaceholder) return;

    // Listen to Firebase auth changes (Skill directive for FirebaseProvider setup)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userData: User | null = null;

        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const dbData = userDoc.data();
            userData = {
              id: firebaseUser.uid,
              name: dbData.name || firebaseUser.displayName || 'Guest',
              email: dbData.email || firebaseUser.email || '',
              isKtpVerified: dbData.isKtpVerified || false,
            };
          } else {
            // Document does not exist, initialize it
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Guest',
              email: firebaseUser.email || '',
              isKtpVerified: false,
            };
            await setDoc(userDocRef, {
              name: userData.name,
              email: userData.email,
              isKtpVerified: userData.isKtpVerified,
            });
          }
        } catch (error) {
          // Fallback to basic state if Firestore permission denies or is unconfigured
          console.warn("Firestore user sync error:", error);
          userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Guest',
            email: firebaseUser.email || '',
            isKtpVerified: false,
          };
        }

        setUser(userData);
        localStorage.setItem('griyastay_user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('griyastay_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, name: string) => {
    if (!isFirebasePlaceholder) {
      // For standard form login in active firebase mode, we can emulate via auth or mock
      // Since Google Login is the primary mechanism, we can do dynamic local auth simulation
      // or standard local storage fallback. Let's do a reliable local fallback representation
      console.warn("Using local storage fallback for form credentials. Google Login is recommended.");
    }
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
    setUser(newUser);
    localStorage.setItem('griyastay_user', JSON.stringify(newUser));
  };

  const register = async (email: string, name: string) => {
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
    setUser(newUser);
    localStorage.setItem('griyastay_user', JSON.stringify(newUser));
  };

  const loginWithGoogle = async () => {
    if (isFirebasePlaceholder) {
      // In local debug/preview, simulate Google Identity Callback
      const googleMockUser = {
        id: "mock_google_id_123",
        name: "Google User Demo",
        email: "demo.user@griyastay.id",
        isKtpVerified: false
      };
      setUser(googleMockUser);
      localStorage.setItem('griyastay_user', JSON.stringify(googleMockUser));
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Auth failed:", error);
      throw error;
    }
  };

  const verifyKtp = async () => {
    if (user) {
      const updatedUser = { ...user, isKtpVerified: true };
      
      if (!isFirebasePlaceholder) {
        const userDocRef = doc(db, 'users', user.id);
        try {
          await updateDoc(userDocRef, { isKtpVerified: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
        }
      }

      setUser(updatedUser);
      localStorage.setItem('griyastay_user', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    if (!isFirebasePlaceholder) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Signout fail:", error);
      }
    }
    setUser(null);
    localStorage.removeItem('griyastay_user');
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      verifyKtp,
      isFirebaseReady 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
