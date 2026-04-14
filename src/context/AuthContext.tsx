"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

// Kullanıcı verisinin haritası (TypeScript)
interface User {
  id: number;
  name: string;
  email: string;
}

// Hoparlörün yapabileceği anonslar (Fonksiyonlar)
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 1. Site ilk açıldığında kasaya (localStorage) bak, VIP kartı varsa otomatik giriş yap
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Giriş yapma fonksiyonu (Hem kasaya yaz, hem sisteme duyur)
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // 3. Çıkış yapma fonksiyonu (Kasayı boşalt, VIP kartı yırt)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
