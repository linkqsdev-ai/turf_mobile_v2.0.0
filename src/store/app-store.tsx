/**
 * app-store.tsx
 * Global state management using React Context + AsyncStorage.
 * Provides booking, tournament, match, and turf state throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, createBooking } from './booking-store';
import { PublishedTournament, TournamentRegistration, createRegistration } from './tournament-store';
import { Team, Player, Match, createTeam, createMatch } from './match-store';
import { PublishedTurf, createTurf } from './turf-store';
import { OwnerOffer, createOffer, defaultOwnerOffers } from './offer-store';

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
  bids: '@turf_bids',
  offers: '@turf_owner_offers',
};

// A team can only be marked favourite while fewer than this many are already set.
const MAX_FAVOURITE_TEAMS = 2;

// Single choke point for the favourite-team cap: whatever mutated the list,
// route it through here before it reaches state/storage. Keeps the first
// MAX_FAVOURITE_TEAMS favourites (array order) and demotes any beyond that,
// so stale/corrupted data (e.g. from before this cap existed) self-heals on
// the very next mutation — and the load path runs it once up front too.
function capFavourites(list: Team[]): Team[] {
  let kept = 0;
  return list.map(t => {
    if (!t.isFavourite) return t;
    kept += 1;
    return kept <= MAX_FAVOURITE_TEAMS ? t : { ...t, isFavourite: false };
  });
}

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
  addPlayerToTeam: (teamName: string, player: any) => void;
  updateTeam: (id: string, params: Partial<Omit<Team, 'id' | 'players' | 'createdAt'>>) => void;
  deleteTeam: (id: string) => void;
  // Returns false (and leaves state untouched) if the team isn't already a
  // favourite and the app-wide 2-favourite cap has been reached.
  toggleTeamFavourite: (id: string) => boolean;
  readonly MAX_FAVOURITE_TEAMS: number;
  addPlayerToTeamById: (teamId: string, player: Omit<Player, 'id'>) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;

  // Matches
  matches: Match[];
  addMatch: (params: Omit<Match, 'id' | 'homeScore' | 'awayScore' | 'status' | 'createdAt'>) => Match;
  updateMatchScore: (id: string, homeScore: number, awayScore: number) => void;
  completeMatch: (id: string) => void;

  // Turfs
  ownedTurfs: PublishedTurf[];
  addTurf: (params: Omit<PublishedTurf, 'id' | 'rating' | 'isActive' | 'createdAt'>) => PublishedTurf;
  updateTurf: (id: string, params: Partial<PublishedTurf>) => void;

  // Classes
  classes: any[];
  addClass: (params: any) => void;

  // Wallet
  walletBalance: number;
  addWalletFunds: (amount: number) => void;
  deductWalletFunds: (amount: number) => void;

  // Bids
  bids: any[];
  addBid: (bid: any) => void;
  removeBid: (id: string) => void;

  // Owner vouchers & offers
  offers: OwnerOffer[];
  addOffer: (params: Parameters<typeof createOffer>[0]) => OwnerOffer;
  updateOffer: (id: string, params: Partial<Omit<OwnerOffer, 'id' | 'createdAt'>>) => void;
  deleteOffer: (id: string) => void;
  toggleOfferStatus: (id: string) => void;
  // True when the code is free to use (case-insensitive), ignoring `exceptId`
  // so an offer being edited doesn't collide with itself.
  isOfferCodeAvailable: (code: string, exceptId?: string) => boolean;

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
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [bids, setBids] = useState<any[]>([
    {
      id: 'bid-demo-1',
      tournament: 'Bid Challenge: Super 11',
      sport: 'Cricket',
      category: 'Turf',
      location: 'Skyline Turf Arena, Court #1',
      type: 'Bid',
      status: 'Accept Bid',
      isMe: true,
      isBid: true,
      playerName: 'Rahul Sharma',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      team1: 'Rahul XI',
      team1Code: 'RX',
      team2: 'Weekend Warriors',
      opponentTeam: 'Weekend Warriors',
      team2Code: 'WW',
      timeText: 'Today, 8:00 PM',
      subText: 'Bid Active • Stake: 200 Coins',
      statusColor: '#8b5cf6',
      section: 'Today',
      bidCoins: 200,
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    (async () => {
      try {
        const [b, t, r, te, m, tu, cl, w, of] = await Promise.all([
          AsyncStorage.getItem(KEYS.bookings),
          AsyncStorage.getItem(KEYS.tournaments),
          AsyncStorage.getItem(KEYS.registrations),
          AsyncStorage.getItem(KEYS.teams),
          AsyncStorage.getItem(KEYS.matches),
          AsyncStorage.getItem(KEYS.turfs),
          AsyncStorage.getItem(KEYS.classes),
          AsyncStorage.getItem(KEYS.wallet),
          AsyncStorage.getItem(KEYS.offers),
        ]);
        if (b) setBookings(JSON.parse(b));
        if (t) setPublishedTournaments(JSON.parse(t));
        if (r) setRegistrations(JSON.parse(r));
        if (w) setWalletBalance(JSON.parse(w));
        if (of) {
          setOffers(JSON.parse(of));
        } else {
          // First run for this owner — seed sample offers so the screen isn't empty.
          const seeded = defaultOwnerOffers();
          setOffers(seeded);
          AsyncStorage.setItem(KEYS.offers, JSON.stringify(seeded));
        }
        if (te && JSON.parse(te).length > 0) {
          const parsedTeams = JSON.parse(te);
          const cappedTeams = capFavourites(parsedTeams);
          setTeams(cappedTeams);
          // Self-heal: if this device had more favourites than the cap allows
          // (e.g. from before the cap existed), persist the corrected list so
          // it doesn't keep re-appearing on every load.
          if (cappedTeams.some((t: Team, i: number) => t.isFavourite !== parsedTeams[i].isFavourite)) {
            AsyncStorage.setItem(KEYS.teams, JSON.stringify(cappedTeams));
          }
        } else {
          const defaultTeams = [
            { id: 't1', name: 'Siva Team', sport: 'Cricket', mascot: 'lion', wins: 10, losses: 2, draws: 1, isFavourite: true, createdAt: new Date().toISOString(), players: [
              { id: 't1-p1', name: 'Siva Kumar', position: 'All-Rounder (C)', jerseyNumber: 7, skillLevel: 'Pro' as const },
              { id: 't1-p2', name: 'Arun Prakash', position: 'Batsman', jerseyNumber: 10, skillLevel: 'Advanced' as const },
              { id: 't1-p3', name: 'Karthik Raja', position: 'Bowler', jerseyNumber: 23, skillLevel: 'Advanced' as const },
              { id: 't1-p4', name: 'Vignesh M', position: 'Wicket-Keeper', jerseyNumber: 1, skillLevel: 'Intermediate' as const },
              { id: 't1-p5', name: 'Dinesh Babu', position: 'Batsman', jerseyNumber: 15, skillLevel: 'Advanced' as const },
              { id: 't1-p6', name: 'Praveen S', position: 'Bowler', jerseyNumber: 9, skillLevel: 'Intermediate' as const },
            ] },
            { id: 't2', name: 'Antony Team', sport: 'Cricket', mascot: 'cobra', wins: 8, losses: 3, draws: 2, isFavourite: true, createdAt: new Date().toISOString(), players: [
              { id: 't2-p1', name: 'Antony Rozario', position: 'Batsman (C)', jerseyNumber: 4, skillLevel: 'Pro' as const },
              { id: 't2-p2', name: 'Michael Fernando', position: 'Bowler', jerseyNumber: 11, skillLevel: 'Advanced' as const },
              { id: 't2-p3', name: 'Joseph Xavier', position: 'All-Rounder', jerseyNumber: 8, skillLevel: 'Advanced' as const },
              { id: 't2-p4', name: 'Vincent Paul', position: 'Wicket-Keeper', jerseyNumber: 2, skillLevel: 'Intermediate' as const },
              { id: 't2-p5', name: 'Thomas George', position: 'Bowler', jerseyNumber: 17, skillLevel: 'Intermediate' as const },
            ] },
            { id: 't3', name: 'London Lions', sport: 'Cricket', mascot: 'falcon', players: [], wins: 5, losses: 5, draws: 3, isFavourite: false, createdAt: new Date().toISOString() },
            { id: 't4', name: 'Kent Kings', sport: 'Cricket', mascot: 'warrior', players: [], wins: 6, losses: 4, draws: 4, isFavourite: false, createdAt: new Date().toISOString() },
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
    let stored = team;
    setTeams(prev => {
      const next = capFavourites([team, ...prev]);
      stored = next.find(t => t.id === team.id) || team;
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
    // Reflects the capped isFavourite value, so a caller reading the
    // returned team (e.g. to set its name in a field) sees the real state.
    return stored;
  }, []);

  const addPlayerToTeam = useCallback((teamName: string, player: any) => {
    setTeams(prev => {
      let found = false;
      const merged = prev.map(t => {
        if (t.name.toLowerCase() === teamName.toLowerCase()) {
          found = true;
          return {
            ...t,
            players: [...(t.players || []), player],
          };
        }
        return t;
      });
      if (!found) {
        const newTeam = createTeam({
          name: teamName,
          sport: 'Cricket',
          mascot: 'lion',
          players: [player],
          // Being auto-created mid-match (e.g. an opponent typed in live
          // scoring) doesn't make it one of the player's favourites — that's
          // an explicit, capped choice made elsewhere.
          isFavourite: false,
        });
        merged.push(newTeam);
      }
      const next = capFavourites(merged);
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTeam = useCallback((id: string, params: Partial<Omit<Team, 'id' | 'players' | 'createdAt'>>) => {
    setTeams(prev => {
      const next = capFavourites(prev.map(t => t.id === id ? { ...t, ...params } : t));
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
  }, []);

  // Checked against the current `teams` state up front (rather than inside the
  // setTeams updater) so the caller gets a reliable success/failure result to
  // react to immediately — e.g. to show "you can only favourite 2 teams".
  const toggleTeamFavourite = useCallback((id: string): boolean => {
    const target = teams.find(t => t.id === id);
    if (!target) return false;
    if (!target.isFavourite && teams.filter(t => t.isFavourite).length >= MAX_FAVOURITE_TEAMS) {
      return false;
    }
    setTeams(prev => {
      const next = capFavourites(prev.map(t => t.id === id ? { ...t, isFavourite: !t.isFavourite } : t));
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
    return true;
  }, [teams]);

  const addPlayerToTeamById = useCallback((teamId: string, player: Omit<Player, 'id'>) => {
    setTeams(prev => {
      // Date.now() alone can collide on rapid/double-invoked calls (e.g. React 19
      // dev-mode double-invocation) and produce duplicate player ids, which then
      // trips React's "unique key" warning in any list keyed off player.id.
      const uniqueId = `${teamId}-p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const next = prev.map(t => t.id === teamId
        ? { ...t, players: [...(t.players || []), { ...player, id: uniqueId }] }
        : t
      );
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
  }, []);

  const removePlayerFromTeam = useCallback((teamId: string, playerId: string) => {
    setTeams(prev => {
      const next = prev.map(t => t.id === teamId
        ? { ...t, players: (t.players || []).filter(p => p.id !== playerId) }
        : t
      );
      AsyncStorage.setItem(KEYS.teams, JSON.stringify(next));
      return next;
    });
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

  const updateTurf = useCallback((id: string, params: Partial<PublishedTurf>) => {
    setOwnedTurfs(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...params } : t);
      AsyncStorage.setItem(KEYS.turfs, JSON.stringify(next));
      return next;
    });
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
    return newClass;
  }, []);

  // ── Bid actions ─────────────────────────────────────────────────────────────
  const addBid = useCallback((bidData: any) => {
    setBids(prev => {
      const next = [bidData, ...prev];
      AsyncStorage.setItem(KEYS.bids, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeBid = useCallback((id: string) => {
    setBids(prev => {
      const next = prev.filter(b => b.id !== id);
      AsyncStorage.setItem(KEYS.bids, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Owner offer actions ─────────────────────────────────────────────────────
  const persistOffers = (next: OwnerOffer[]) => {
    AsyncStorage.setItem(KEYS.offers, JSON.stringify(next));
    return next;
  };

  const addOffer = useCallback((params: Parameters<typeof createOffer>[0]) => {
    const offer = createOffer(params);
    setOffers(prev => persistOffers([offer, ...prev]));
    return offer;
  }, []);

  const updateOffer = useCallback((id: string, params: Partial<Omit<OwnerOffer, 'id' | 'createdAt'>>) => {
    setOffers(prev =>
      persistOffers(
        prev.map(o =>
          o.id === id
            ? { ...o, ...params, code: (params.code ?? o.code).trim().toUpperCase() }
            : o
        )
      )
    );
  }, []);

  const deleteOffer = useCallback((id: string) => {
    setOffers(prev => persistOffers(prev.filter(o => o.id !== id)));
  }, []);

  const toggleOfferStatus = useCallback((id: string) => {
    setOffers(prev =>
      persistOffers(
        prev.map(o =>
          o.id === id ? { ...o, status: o.status === 'active' ? 'paused' : 'active' } : o
        )
      )
    );
  }, []);

  const isOfferCodeAvailable = useCallback(
    (code: string, exceptId?: string) => {
      const target = code.trim().toUpperCase();
      if (!target) return false;
      return !offers.some(o => o.id !== exceptId && o.code.toUpperCase() === target);
    },
    [offers]
  );

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
      teams, addTeam, addPlayerToTeam, updateTeam, deleteTeam, toggleTeamFavourite, addPlayerToTeamById, removePlayerFromTeam, MAX_FAVOURITE_TEAMS,
      matches, addMatch, updateMatchScore, completeMatch,
      ownedTurfs, addTurf, updateTurf,
      classes, addClass,
      walletBalance, addWalletFunds, deductWalletFunds,
      bids, addBid, removeBid,
      offers, addOffer, updateOffer, deleteOffer, toggleOfferStatus, isOfferCodeAvailable,
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
  const { teams, addTeam, addPlayerToTeam, matches, addMatch, updateMatchScore, completeMatch } = useAppStore();
  return { teams, addTeam, addPlayerToTeam, matches, addMatch, updateMatchScore, completeMatch };
}

export function useTurfStore() {
  const { ownedTurfs, addTurf, updateTurf } = useAppStore();
  return { ownedTurfs, addTurf, updateTurf };
}

export function useClassStore() {
  const { classes, addClass } = useAppStore();
  return { classes, addClass };
}

export function useWalletStore() {
  const { walletBalance, addWalletFunds, deductWalletFunds } = useAppStore();
  return { walletBalance, addWalletFunds, deductWalletFunds };
}

export function useBidStore() {
  const { bids, addBid, removeBid } = useAppStore();
  return { bids, addBid, removeBid };
}

export function useOfferStore() {
  const {
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    isOfferCodeAvailable,
    isLoading,
  } = useAppStore();
  // `isLoading` is exposed so callers can tell "no offers yet" apart from
  // "offers haven't finished hydrating from storage".
  return {
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    isOfferCodeAvailable,
    offersLoading: isLoading,
  };
}
