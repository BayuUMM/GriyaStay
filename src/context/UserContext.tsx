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
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  isSupabaseConfigured, 
  fetchSupabaseUser, 
  upsertSupabaseUser,
  supabase
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
  login: (email: string, password?: string, name?: string) => Promise<User | null>;
  register: (email: string, password?: string, name?: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
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

  // Real-time synchronization of the logged-in user profile from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.email) {
      return;
    }

    const loadUserRealtime = async () => {
      try {
        const latestInfo = await fetchSupabaseUser(user.email);
        if (latestInfo) {
          setUser(prev => {
            if (!prev) return null;
            if (
              prev.isKtpVerified !== latestInfo.isKtpVerified ||
              prev.name !== latestInfo.name ||
              prev.ktpNumber !== latestInfo.ktpNumber ||
              prev.ktpPhoto !== latestInfo.ktpPhoto
            ) {
              const updated = {
                ...prev,
                name: latestInfo.name,
                isKtpVerified: latestInfo.isKtpVerified,
                ktpNumber: latestInfo.ktpNumber,
                ktpPhoto: latestInfo.ktpPhoto,
              };
              localStorage.setItem('griyastay_user', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("Realtime user fetch failed:", err);
      }
    };

    const userChannel = supabase
      .channel(`supabase-user-changes-${user.email}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'users',
          filter: `email=eq.${user.email.toLowerCase()}` 
        },
        (payload) => {
          console.log("Real-time user changes payload received from Supabase:", payload);
          loadUserRealtime();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [user?.email]);

  const login = async (email: string, password?: string, name?: string): Promise<User | null> => {
    let activeUser: User | null = null;

    if (!isFirebasePlaceholder && auth && password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const dbData = userDoc.data();
          activeUser = {
            id: firebaseUser.uid,
            name: dbData.name || firebaseUser.displayName || name || 'User',
            email: dbData.email || firebaseUser.email || email,
            isKtpVerified: dbData.isKtpVerified || false,
            ktpNumber: dbData.ktpNumber,
            ktpPhoto: dbData.ktpPhoto,
          };
        } else {
          activeUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || name || 'User',
            email: firebaseUser.email || email,
            isKtpVerified: false,
          };
          await setDoc(userDocRef, {
            name: activeUser.name,
            email: activeUser.email,
            isKtpVerified: activeUser.isKtpVerified,
          });
        }
      } catch (fbErr: any) {
        console.error("Firebase Auth login failed, trying Supabase fallback:", fbErr);
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          throw new Error('Kata sandi salah atau email tidak valid.');
        } else if (fbErr.code === 'auth/user-not-found') {
          throw new Error('Email tidak ditemukan. Silakan daftar terlebih dahulu.');
        } else {
          throw fbErr;
        }
      }
    }

    if (!activeUser) {
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
          activeUser = { id: Math.random().toString(36).substr(2, 9), email, name: name || 'User', isKtpVerified: false };
        }
      } else {
        activeUser = { id: Math.random().toString(36).substr(2, 9), email, name: name || 'User', isKtpVerified: false };
      }
    }

    if (isSupabaseConfigured && activeUser) {
      try {
        await upsertSupabaseUser({
          id: activeUser.id,
          name: activeUser.name,
          email: activeUser.email,
          isKtpVerified: activeUser.isKtpVerified,
          ktpNumber: activeUser.ktpNumber,
          ktpPhoto: activeUser.ktpPhoto
        });
      } catch (e) {
        console.warn("Syncing login user to Supabase failed:", e);
      }
    }

    setUser(activeUser);
    localStorage.setItem('griyastay_user', JSON.stringify(activeUser));
    return activeUser;
  };

  const register = async (email: string, password?: string, name?: string): Promise<User | null> => {
    let activeUser: User | null = null;
    const generatedId = Math.random().toString(36).substr(2, 9);

    if (!isFirebasePlaceholder && auth && password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;

        if (name) {
          await updateProfile(firebaseUser, { displayName: name });
        }

        activeUser = {
          id: firebaseUser.uid,
          name: name || 'User',
          email: firebaseUser.email || email,
          isKtpVerified: false,
        };

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          name: activeUser.name,
          email: activeUser.email,
          isKtpVerified: false,
        });
      } catch (fbErr: any) {
        console.error("Firebase Auth Sign up failed, trying Supabase fallback:", fbErr);
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('Email ini sudah terdaftar. Silakan login.');
        } else if (fbErr.code === 'auth/weak-password') {
          throw new Error('Kata sandi terlalu lemah. Minimal 6 karakter.');
        } else {
          throw fbErr;
        }
      }
    }

    if (!activeUser) {
      if (isSupabaseConfigured) {
        try {
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
        } catch (err) {
          console.error("Supabase register connection error:", err);
          activeUser = { id: generatedId, email, name: name || 'User', isKtpVerified: false };
        }
      } else {
        activeUser = { id: generatedId, email, name: name || 'User', isKtpVerified: false };
      }
    }

    if (isSupabaseConfigured && activeUser) {
      try {
        await upsertSupabaseUser({
          id: activeUser.id,
          name: activeUser.name,
          email: activeUser.email,
          isKtpVerified: activeUser.isKtpVerified,
          ktpNumber: activeUser.ktpNumber,
          ktpPhoto: activeUser.ktpPhoto
        });
      } catch (e) {
        console.warn("Syncing registered user to Supabase failed:", e);
      }
    }

    setUser(activeUser);
    localStorage.setItem('griyastay_user', JSON.stringify(activeUser));
    return activeUser;
  };

  const loginWithGoogle = async (): Promise<User | null> => {
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
      return activeUser;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
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
              console.error("Syncing google user to Supabase failed:", supaErr);
            }
          }
        } catch (error) {
          console.warn("Firestore user sync error on loginWithGoogle:", error);
          userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Guest',
            email: firebaseUser.email || '',
            isKtpVerified: false,
          };
        }
        
        setUser(userData);
        localStorage.setItem('griyastay_user', JSON.stringify(userData));
        return userData;
      }
      return null;
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

