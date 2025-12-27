import React, { createContext, useContext, useState } from 'react';

export interface UserData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  walletBalance: number;
}

interface UserDataContextType {
  user: UserData | null;
  loading: boolean;
  updateUser: (user: UserData) => void;
  updateWallet: (amount: number) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const updateUser = (userData: UserData) => {
    setUser(userData);
  };

  const updateWallet = (amount: number) => {
    if (user) {
      setUser({ ...user, walletBalance: user.walletBalance + amount });
    }
  };

  return (
    <UserDataContext.Provider value={{ user, loading, updateUser, updateWallet }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
};