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

  // 🔥 AUTO RESTORE SESSION
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user) {
        const authUser = sessionData.session.user;

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!error && data) {
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            isKtpVerified: data.ktp_verified,
          });
        }
      }

      setLoading(false);
    };

    init();

    // 🔥 LISTENER LOGIN/LOGOUT REALTIME
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (data) {
            setUser({
              id: data.id,
              name: data.name,
              email: data.email,
              isKtpVerified: data.ktp_verified,
            });
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // LOGIN
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  // REGISTER
  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // optional: insert user profile
    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user) {
      await supabase.from("users").insert([
        {
          id: authData.user.id,
          email,
          name,
          ktp_verified: false,
        },
      ]);
    }
  };

  // KTP VERIFY (simple update)
  const verifyKtp = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ ktp_verified: true })
      .eq("id", user.id);

    if (!error) {
      setUser({
        ...user,
        isKtpVerified: true,
      });
    }
  };

  // LOGOUT
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
