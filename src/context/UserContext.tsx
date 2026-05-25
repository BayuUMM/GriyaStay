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
import { 
  isSupabaseConfigured, 
  fetchSupabaseUser, 
  upsertSupabaseUser 
} from '../services/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  isKtpVerified: boolean;
  ktpNumber?: string;
  ktpPhoto?: string;
}

interface UserContextType {
  user: User | null;
  login: (email: string, name: string) => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  verifyKtp: (ktpNumber?: string, ktpPhoto?: string) => Promise<void>;
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
              ktpNumber: dbData.ktpNumber,
              ktpPhoto: dbData.ktpPhoto,
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

          // Sync Firebase authenticated user profile with Supabase table
          if (isSupabaseConfigured && userData) {
            try {
              const existingSupa = await fetchSupabaseUser(userData.email);
              if (existingSupa) {
                userData = {
                  ...userData,
                  isKtpVerified: existingSupa.isKtpVerified || userData.isKtpVerified,
                  ktpNumber: existingSupa.ktpNumber || userData.ktpNumber,
                  ktpPhoto: existingSupa.ktpPhoto || userData.ktpPhoto,
                };
              }
              await upsertSupabaseUser({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                isKtpVerified: userData.isKtpVerified,
                ktpNumber: userData.ktpNumber,
                ktpPhoto: userData.ktpPhoto
              });
            } catch (supaErr) {
              console.error("Syncing user on Firebase Auth to Supabase failed:", supaErr);
            }
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

          if (isSupabaseConfigured && userData) {
            try {
              const existingSupa = await fetchSupabaseUser(userData.email);
              if (existingSupa) {
                userData = {
                  ...userData,
                  isKtpVerified: existingSupa.isKtpVerified,
                  ktpNumber: existingSupa.ktpNumber,
                  ktpPhoto: existingSupa.ktpPhoto,
                };
              } else {
                await upsertSupabaseUser({
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  isKtpVerified: userData.isKtpVerified
                });
              }
            } catch (supaErr) {
              console.error("Syncing plain Firebase Auth to Supabase failed:", supaErr);
            }
          }
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
      console.warn("Using local storage fallback for form credentials. Google Login is recommended.");
    }
    
    let activeUser: User;
    
    if (isSupabaseConfigured) {
      try {
        const existingSupabaseUser = await fetchSupabaseUser(email);
        if (existingSupabaseUser) {
          activeUser = {
            id: existingSupabaseUser.id,
            name: existingSupabaseUser.name,
            email: existingSupabaseUser.email,
            isKtpVerified: existingSupabaseUser.isKtpVerified,
            ktpNumber: existingSupabaseUser.ktpNumber,
            ktpPhoto: existingSupabaseUser.ktpPhoto,
          };
        } else {
          // If user does not exist in Supabase, create/register him in Supabase
          const generatedId = Math.random().toString(36).substr(2, 9);
          const response = await upsertSupabaseUser({
            id: generatedId,
            name: name || 'User',
            email,
            isKtpVerified: false,
          });
          if (response) {
            activeUser = {
              id: response.id,
              name: response.name,
              email: response.email,
              isKtpVerified: response.isKtpVerified,
              ktpNumber: response.ktpNumber,
              ktpPhoto: response.ktpPhoto,
            };
          } else {
            activeUser = { id: generatedId, email, name: name || 'User', isKtpVerified: false };
          }
        }
      } catch (err) {
        console.error("Supabase login connection error:", err);
        activeUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
      }
    } else {
      activeUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
    }

    setUser(activeUser);
    localStorage.setItem('griyastay_user', JSON.stringify(activeUser));
  };

  const register = async (email: string, name: string) => {
    let activeUser: User;
    const generatedId = Math.random().toString(36).substr(2, 9);
    
    if (isSupabaseConfigured) {
      try {
        const response = await upsertSupabaseUser({
          id: generatedId,
          name,
          email,
          isKtpVerified: false,
        });
        if (response) {
          activeUser = {
            id: response.id,
            name: response.name,
            email: response.email,
            isKtpVerified: response.isKtpVerified,
            ktpNumber: response.ktpNumber,
            ktpPhoto: response.ktpPhoto,
          };
        } else {
          activeUser = { id: generatedId, email, name, isKtpVerified: false };
        }
      } catch (err) {
        console.error("Supabase register connection error:", err);
        activeUser = { id: generatedId, email, name, isKtpVerified: false };
      }
    } else {
      activeUser = { id: generatedId, email, name, isKtpVerified: false };
    }

    setUser(activeUser);
    localStorage.setItem('griyastay_user', JSON.stringify(activeUser));
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
      
      let activeUser: User = { ...googleMockUser };
      
      if (isSupabaseConfigured) {
        try {
          const existing = await fetchSupabaseUser(googleMockUser.email);
          if (existing) {
            activeUser = {
              id: existing.id,
              name: existing.name,
              email: existing.email,
              isKtpVerified: existing.isKtpVerified,
              ktpNumber: existing.ktpNumber,
              ktpPhoto: existing.ktpPhoto,
            };
          } else {
            const response = await upsertSupabaseUser({
              id: googleMockUser.id,
              name: googleMockUser.name,
              email: googleMockUser.email,
              isKtpVerified: false
            });
            if (response) {
              activeUser = {
                id: response.id,
                name: response.name,
                email: response.email,
                isKtpVerified: response.isKtpVerified,
                ktpNumber: response.ktpNumber,
                ktpPhoto: response.ktpPhoto,
              };
            }
          }
        } catch (err) {
          console.error("Supabase Google login check failed:", err);
        }
      }
      
      setUser(activeUser);
      localStorage.setItem('griyastay_user', JSON.stringify(activeUser));
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

  const verifyKtp = async (ktpNumber?: string, ktpPhoto?: string) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        isKtpVerified: true,
        ktpNumber: ktpNumber || user.ktpNumber,
        ktpPhoto: ktpPhoto || user.ktpPhoto
      };
      
      if (!isFirebasePlaceholder) {
        const userDocRef = doc(db, 'users', user.id);
        try {
          await updateDoc(userDocRef, { 
            isKtpVerified: true,
            ktpNumber: ktpNumber || null,
            ktpPhoto: ktpPhoto || null
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
        }
      }

      if (isSupabaseConfigured) {
        try {
          await upsertSupabaseUser({
            id: user.id,
            name: user.name,
            email: user.email,
            isKtpVerified: true,
            ktpNumber: ktpNumber || user.ktpNumber,
            ktpPhoto: ktpPhoto || user.ktpPhoto,
          });
        } catch (err) {
          console.error("Supabase KTP update failed:", err);
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

