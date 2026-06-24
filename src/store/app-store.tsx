/**
 * app-store.tsx
 * Global state management using React Context + AsyncStorage.
 * Provides booking, tournament, match, and turf state throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, createBooking } from './booking-store';
import { PublishedTournament, TournamentRegistration, createRegistration } from './tournament-store';
import { Team, Match, createTeam, createMatch } from './match-store';
import { PublishedTurf, createTurf } from './turf-store';

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEYS = {
  bookings: '@turf_bookings',
  tournaments: '@turf_tournaments',
  registrations: '@turf_registrations',
  teams: '@turf_teams',
  matches: '@turf_matches',
  turfs: '@turf_owned_turfs',
};

// ── Context type ──────────────────────────────────────────────────────────────
interface AppStoreContextType {
  // Bookings
  bookings: Booking[];
  addBooking: (params: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'status'>) => Booking;
  cancelBooking: (id: string) => void;

  // Tournaments
  publishedTournaments: PublishedTournament[];
  addTournament: (t: PublishedTournament) => void;
  updateTournamentTeamsCount: (id: string, delta: number) => void;
  registrations: TournamentRegistration[];
  registerForTournament: (params: Omit<TournamentRegistration, 'id' | 'registeredAt'>) => TournamentRegistration;

  // Teams
  teams: Team[];
  addTeam: (params: Omit<Team, 'id' | 'wins' | 'losses' | 'draws' | 'createdAt'>) => Team;

  // Matches
  matches: Match[];
  addMatch: (params: Omit<Match, 'id' | 'homeScore' | 'awayScore' | 'status' | 'createdAt'>) => Match;
  updateMatchScore: (id: string, homeScore: number, awayScore: number) => void;
  completeMatch: (id: string) => void;

  // Turfs
  ownedTurfs: PublishedTurf[];
  addTurf: (params: Omit<PublishedTurf, 'id' | 'rating' | 'isActive' | 'createdAt'>) => PublishedTurf;

  // Loading state
  isLoading: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppStoreContext = createContext<AppStoreContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [publishedTournaments, setPublishedTournaments] = useState<PublishedTournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ownedTurfs, setOwnedTurfs] = useState<PublishedTurf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    (async () => {
      try {
        const [b, t, r, te, m, tu] = await Promise.all([
          AsyncStorage.getItem(KEYS.bookings),
          AsyncStorage.getItem(KEYS.tournaments),
          AsyncStorage.getItem(KEYS.registrations),
          AsyncStorage.getItem(KEYS.teams),
          AsyncStorage.getItem(KEYS.matches),
          AsyncStorage.getItem(KEYS.turfs),
        ]);
        if (b) setBookings(JSON.parse(b));
        if (t) setPublishedTournaments(JSON.parse(t));
        if (r) setRegistrations(JSON.parse(r));
        if (te) setTeams(JSON.parse(te));
        if (m) setMatches(JSON.parse(m));
        if (tu) setOwnedTurfs(JSON.parse(tu));
      } catch (e) {
        console.error('AppStore: Failed to load data', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Booking actions ─────────────────────────────────────────────────────────
  const addBooking = useCallback((params: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'status'>) => {
    const booking = createBooking(params);
    setBookings(prev => {
      const next = [booking, ...prev];
      AsyncStorage.setItem(KEYS.bookings, JSON.stringify(next));
      return next;
    });
    return booking;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings(prev => {
      const next = prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
      AsyncStorage.setItem(KEYS.bookings, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Tournament actions ──────────────────────────────────────────────────────
  const addTournament = useCallback((t: PublishedTournament) => {
    setPublishedTournaments(prev => {
      const next = [t, ...prev];
      AsyncStorage.setItem(KEYS.tournaments, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTournamentTeamsCount = useCallback((id: string, delta: number) => {
    setPublishedTournaments(prev => {
      const next = prev.map(t => t.id === id ? { ...t, teamsCount: t.teamsCount + delta } : t);
      AsyncStorage.setItem(KEYS.tournaments, JSON.stringify(next));
      return next;
    });
  }, []);

  const registerForTournament = useCallback((params: Omit<TournamentRegistration, 'id' | 'registeredAt'>) => {
    const reg = createRegistration(params);
    setRegistrations(prev => {
      const next = [reg, ...prev];
      AsyncStorage.setItem(KEYS.registrations, JSON.stringify(next));
      return next;
    });
    updateTournamentTeamsCount(params.tournamentId, 1);
    return reg;
  }, [updateTournamentTeamsCount]);

  // ── Team actions ────────────────────────────────────────────────────────────
  const addTeam = useCallback((params: Omit<Team, 'id' | 'wins' | 'losses' | 'draws' | 'createdAt'>) => {
    const team = createTeam(params);
    setTeams(prev => {
      const next = [team, ...prev];
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
    return team;
  }, []);

  // ── Match actions ───────────────────────────────────────────────────────────
  const addMatch = useCallback((params: Omit<Match, 'id' | 'homeScore' | 'awayScore' | 'status' | 'createdAt'>) => {
    const match = createMatch(params);
    setMatches(prev => {
      const next = [match, ...prev];
      AsyncStorage.setItem(KEYS.matches, JSON.stringify(next));
      return next;
    });
    return match;
  }, []);

  const updateMatchScore = useCallback((id: string, homeScore: number, awayScore: number) => {
    setMatches(prev => {
      const next = prev.map(m => m.id === id ? { ...m, homeScore, awayScore, status: 'live' as const } : m);
      AsyncStorage.setItem(KEYS.matches, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeMatch = useCallback((id: string) => {
    setMatches(prev => {
      const next = prev.map(m => m.id === id ? { ...m, status: 'completed' as const, completedAt: new Date().toISOString() } : m);
      AsyncStorage.setItem(KEYS.matches, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Turf actions ────────────────────────────────────────────────────────────
  const addTurf = useCallback((params: Omit<PublishedTurf, 'id' | 'rating' | 'isActive' | 'createdAt'>) => {
    const turf = createTurf(params);
    setOwnedTurfs(prev => {
      const next = [turf, ...prev];
      AsyncStorage.setItem(KEYS.turfs, JSON.stringify(next));
      return next;
    });
    return turf;
  }, []);

  return (
    <AppStoreContext.Provider value={{
      bookings, addBooking, cancelBooking,
      publishedTournaments, addTournament, updateTournamentTeamsCount,
      registrations, registerForTournament,
      teams, addTeam,
      matches, addMatch, updateMatchScore, completeMatch,
      ownedTurfs, addTurf,
      isLoading,
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}

export function useBookings() {
  const { bookings, addBooking, cancelBooking } = useAppStore();
  return { bookings, addBooking, cancelBooking };
}

export function useTournamentStore() {
  const { publishedTournaments, addTournament, registrations, registerForTournament, updateTournamentTeamsCount } = useAppStore();
  return { publishedTournaments, addTournament, registrations, registerForTournament, updateTournamentTeamsCount };
}

export function useMatchStore() {
  const { teams, addTeam, matches, addMatch, updateMatchScore, completeMatch } = useAppStore();
  return { teams, addTeam, matches, addMatch, updateMatchScore, completeMatch };
}

export function useTurfStore() {
  const { ownedTurfs, addTurf } = useAppStore();
  return { ownedTurfs, addTurf };
}
