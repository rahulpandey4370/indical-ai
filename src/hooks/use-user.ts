'use client';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Mock user type
interface User {
  id: string;
  name: string;
  email: string;
}

// Mock user data
const mockUser: User = {
  id: 'rahul',
  name: 'Rahul',
  email: 'rahul@indical.ai',
};

interface UserContextValue {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 500); // Simulate network delay
  }, []);

  const value = { user, loading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
