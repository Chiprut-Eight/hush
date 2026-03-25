import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange, getUserProfile, handleRedirectResult, type HushUser } from '../services/authService';

interface AuthContextType {
  firebaseUser: User | null;
  hushUser: HushUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  hushUser: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [hushUser, setHushUser] = useState<HushUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setHushUser(profile);
    }
  };

  useEffect(() => {
    // On native, check for redirect sign-in result on startup
    handleRedirectResult();

    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setHushUser(profile);
      } else {
        setHushUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, hushUser, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
