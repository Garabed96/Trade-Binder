'use client';

import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
  totalMatches: number;
  setTotalMatches: (n: number) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState('');
  const [totalMatches, setTotalMatches] = useState(0);

  return (
    <SearchContext.Provider value={{ query, setQuery, totalMatches, setTotalMatches }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
