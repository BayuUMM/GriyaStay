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

  // 🔥 CEK SESSION AWAL
  useEffect(() => {
    const getSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user) {
        const authUser = sessionData.session.user;

        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data) {
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

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 LOGIN
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  // 🔥 REGISTER (INI YANG KAMU BELUM PUNYA)
  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("users").insert([
        {
          id: data.user.id,
          email,
          name,
          ktp_verified: false,
        },
      ]);
    }
  };

  // 🔥 VERIFY KTP
  const verifyKtp = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ ktp_verified: true })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setUser((prev) => (prev ? { ...prev, isKtpVerified: true } : prev));
  };

  // 🔥 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{ user, loading, login, register, verifyKtp, logout }}
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
