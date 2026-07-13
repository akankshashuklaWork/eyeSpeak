'use client';

import { useState } from 'react';
import { searchCaregiverInfo } from '../../lib/api';

export default function CaregiverPage() {
  const [query, setQuery] = useState('nearby rehabilitation centers');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await searchCaregiverInfo(query);
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-2xl px-6 py-10">
      <a
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/20 hover:text-white"
      >
        <span aria-hidden>←</span> Back to patient view
      </a>

      <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300 bg-clip-text text-3xl font-bold text-transparent">
          Caregiver Assistant
        </h1>
        <p className="mt-2 text-white/60">Search for rehabilitation centers or recovery exercises nearby.</p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none backdrop-blur-xl transition focus:border-cyan-300/50 focus:bg-white/15"
            placeholder="e.g. stroke recovery exercises"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      <ul className="mt-6 space-y-4">
        {results.map((r, i) => (
          <li
            key={i}
            className="animate-fade-in-up rounded-2xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-xl transition hover:bg-white/15"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="font-semibold text-white">{r.title}</p>
            <p className="mt-1 text-white/60">{r.snippet}</p>
          </li>
        ))}
      </ul>

      {searched && !loading && results.length === 0 && (
        <p className="mt-6 text-center text-white/40">No results found.</p>
      )}
    </main>
  );
}
