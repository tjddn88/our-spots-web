'use client';

import { useState } from 'react';

interface AddressSearchProps {
  onSearch: (keyword: string) => void;
  isSearching: boolean;
}

export default function AddressSearch({ onSearch, isSearching }: AddressSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="장소 검색"
        className="w-64 px-3 py-1.5 bg-white/90 backdrop-blur border rounded-full text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSearch}
        disabled={isSearching || !query.trim()}
        className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium shadow border border-transparent hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        {isSearching ? '...' : '검색'}
      </button>
    </div>
  );
}
