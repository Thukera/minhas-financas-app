"use client";  


import { createContext, useContext, useState, useEffect } from "react";
import { usePanelService } from "@/lib/service";
import { User } from "@/lib/models/user";

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { getUserDetails } = usePanelService();

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
    try {
      if (!user) {
        const data = await getUserDetails();
        if (isMounted) setUser(data ?? null);
      }
    } catch (err: any) {
      if (err.response?.status === 406) {
        console.warn("Panel API returned 406 – probably cookie not ready yet.");
        if (isMounted) setUser(null);
      } else {
        console.error("Failed to fetch user", err);
        if (isMounted) setUser(null);
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []); // run only once on mount

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
