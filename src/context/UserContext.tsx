import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isKtpVerified: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  register: (email: string, name: string) => void;
  logout: () => void;
  verifyKtp: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('griyastay_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email: string, name: string) => {
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
    setUser(newUser);
    localStorage.setItem('griyastay_user', JSON.stringify(newUser));
  };

  const register = (email: string, name: string) => {
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, name, isKtpVerified: false };
    setUser(newUser);
    localStorage.setItem('griyastay_user', JSON.stringify(newUser));
  };

  const verifyKtp = () => {
    if (user) {
      const updatedUser = { ...user, isKtpVerified: true };
      setUser(updatedUser);
      localStorage.setItem('griyastay_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('griyastay_user');
  };

  return (
    <UserContext.Provider value={{ user, login, register, logout, verifyKtp }}>
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
