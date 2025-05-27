import React, { createContext, useContext, useState } from 'react';

// Create the context
export const UserContext = createContext({ user: null, setUser: () => {} });

// Provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Optional: custom hook for convenience
export function useUserContext() {
  return useContext(UserContext);
}