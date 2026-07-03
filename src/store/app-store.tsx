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
  classes: '@turf_classes',
  wallet: '@turf_wallet',
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

  // Classes
  classes: any[];
  addClass: (params: any) => void;

  // Wallet
  walletBalance: number;
  addWalletFunds: (amount: number) => void;
  deductWalletFunds: (amount: number) => void;

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
  const [classes, setClasses] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(200); // Initial ₹200 wallet balance
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    (async () => {
      try {
        const [b, t, r, te, m, tu, cl, w] = await Promise.all([
          AsyncStorage.getItem(KEYS.bookings),
          AsyncStorage.getItem(KEYS.tournaments),
          AsyncStorage.getItem(KEYS.registrations),
          AsyncStorage.getItem(KEYS.teams),
          AsyncStorage.getItem(KEYS.matches),
          AsyncStorage.getItem(KEYS.turfs),
          AsyncStorage.getItem(KEYS.classes),
          AsyncStorage.getItem(KEYS.wallet),
        ]);
        if (b) setBookings(JSON.parse(b));
        if (t) setPublishedTournaments(JSON.parse(t));
        if (r) setRegistrations(JSON.parse(r));
        if (w) setWalletBalance(JSON.parse(w));
        if (te && JSON.parse(te).length > 0) {
          setTeams(JSON.parse(te));
        } else {
          const defaultTeams = [
            { id: 't1', name: 'Lions FC', sport: 'Football', mascot: 'lion', players: [], wins: 10, losses: 2, draws: 1, isFavourite: true, createdAt: new Date().toISOString() },
            { id: 't2', name: 'Titans Utd', sport: 'Football', mascot: 'titan', players: [], wins: 8, losses: 3, draws: 2, isFavourite: false, createdAt: new Date().toISOString() },
            { id: 't3', name: 'Blue Falcons FC', sport: 'Football', mascot: 'falcon', players: [], wins: 5, losses: 5, draws: 3, isFavourite: false, createdAt: new Date().toISOString() },
            { id: 't4', name: 'Shadow Kings', sport: 'Football', mascot: 'shadow', players: [], wins: 6, losses: 4, draws: 4, isFavourite: false, createdAt: new Date().toISOString() },
          ];
          setTeams(defaultTeams);
          AsyncStorage.setItem(KEYS.teams, JSON.stringify(defaultTeams));
        }
        if (m) setMatches(JSON.parse(m));
        if (tu) setOwnedTurfs(JSON.parse(tu));
        if (cl) {
          const parsed = JSON.parse(cl);
          const seen = new Set();
          const deduped = parsed.filter((item: any) => {
            const key = `${item.className}-${item.classType}-${item.sportType}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (deduped.length !== parsed.length) {
            AsyncStorage.setItem(KEYS.classes, JSON.stringify(deduped));
          }
          setClasses(deduped);
        }
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

  // ── Class actions ───────────────────────────────────────────────────────────
  const addClass = useCallback((params: any) => {
    const newClass = {
      ...params,
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClasses(prev => {
      const next = [newClass, ...prev];
      AsyncStorage.setItem(KEYS.classes, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Wallet actions ──────────────────────────────────────────────────────────
  const addWalletFunds = useCallback((amount: number) => {
    setWalletBalance(prev => {
      const next = prev + amount;
      AsyncStorage.setItem(KEYS.wallet, JSON.stringify(next));
      return next;
    });
  }, []);

  const deductWalletFunds = useCallback((amount: number) => {
    setWalletBalance(prev => {
      const next = Math.max(0, prev - amount);
      AsyncStorage.setItem(KEYS.wallet, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AppStoreContext.Provider value={{
      bookings, addBooking, cancelBooking,
      publishedTournaments, addTournament, updateTournamentTeamsCount,
      registrations, registerForTournament,
      teams, addTeam,
      matches, addMatch, updateMatchScore, completeMatch,
      ownedTurfs, addTurf,
      classes, addClass,
      walletBalance, addWalletFunds, deductWalletFunds,
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

export function useClassStore() {
  const { classes, addClass } = useAppStore();
  return { classes, addClass };
}

export function useWalletStore() {
  const { walletBalance, addWalletFunds, deductWalletFunds } = useAppStore();
  return { walletBalance, addWalletFunds, deductWalletFunds };
}
