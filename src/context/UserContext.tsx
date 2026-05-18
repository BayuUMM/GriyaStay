import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  isKtpVerified: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  verifyKtp: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 INIT SESSION (SAFE MODE ANTI WHITE SCREEN)
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;

        if (sessionUser) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", sessionUser.id)
            .single();

          if (userData) {
            setUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              isKtpVerified: userData.ktp_verified,
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 🔥 LISTENER LOGIN / LOGOUT
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        try {
          if (session?.user) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            setUser(
              data
                ? {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    isKtpVerified: data.ktp_verified,
                  }
                : null,
            );
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Auth change error:", err);
          setUser(null);
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 LOGIN FIXED
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      alert(error.message);
    }
  };

  const verifyKtp = async () => {
    if (!user) return;

    await supabase
      .from("users")
      .update({ ktp_verified: true })
      .eq("id", user.id);

    setUser({ ...user, isKtpVerified: true });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyKtp,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
};
