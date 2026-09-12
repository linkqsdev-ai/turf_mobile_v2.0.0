/**
 * backend-sync.ts
 *
 * Mirrors bookings, cancellations, tournaments, team registrations and class
 * enrolments to the backend after they are saved on the device. The device copy
 * stays the source the app reads from; this only makes the activity visible to
 * the Super Admin console and to other devices.
 *
 * Nothing is sent for demo or offline sign-ins, and every call is best effort:
 * a failure is logged and never interrupts the flow that triggered it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, getAuthToken } from '@/services/api-client';
import { bookingApi } from '@/services/booking-api';
import { tournamentApi } from '@/services/tournament-api';
import { classApi } from '@/services/class-api';
import { isServerToken } from '@/lib/remote-config';
import { bookingPayload, isUuid, tournamentPayload, type BookingLike, type TournamentLike } from '@/lib/sync-rules';

type Kind = 'booking' | 'tournament' | 'team';
const IDS_KEY = '@turf_server_ids';

async function readIds(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function rememberServerId(kind: Kind, localId: string, serverId: string) {
  const ids = await readIds();
  ids[`${kind}:${localId}`] = serverId;
  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids)).catch(() => {});
}

async function serverIdFor(kind: Kind, localId: string): Promise<string | null> {
  return (await readIds())[`${kind}:${localId}`] ?? null;
}

async function signedInToServer() {
  return isServerToken(await getAuthToken());
}

function keptLocally(what: string, err: any) {
  console.warn(`[sync] ${what} saved on this device only: ${err?.message ?? err}`);
}

export async function syncBookingCreated(booking: BookingLike & { id: string }) {
  const payload = bookingPayload(booking);
  if (!payload || !(await signedInToServer())) return;
  try {
    const server = await bookingApi.createBooking(payload);
    if (server?.id) await rememberServerId('booking', booking.id, server.id);
  } catch (err) {
    keptLocally('Booking', err);
  }
}

export async function syncBookingCancelled(localId: string) {
  if (!(await signedInToServer())) return;
  const serverId = await serverIdFor('booking', localId);
  if (!serverId) return;
  try {
    await bookingApi.cancelBooking(serverId);
  } catch (err) {
    keptLocally('Booking cancellation', err);
  }
}

export async function syncTournamentCreated(tournament: TournamentLike & { id: string }) {
  const payload = tournamentPayload(tournament);
  if (!payload || !(await signedInToServer())) return;
  try {
    const server = await tournamentApi.createTournament(payload);
    if (server?.id) await rememberServerId('tournament', tournament.id, server.id);
  } catch (err) {
    keptLocally('Tournament', err);
  }
}

export async function syncRegistration(reg: {
  tournamentId: string;
  teamId: string;
  teamName: string;
  teamMascot?: string;
  sport: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}) {
  if (!(await signedInToServer())) return;
  const tournamentId = isUuid(reg.tournamentId) ? reg.tournamentId : await serverIdFor('tournament', reg.tournamentId);
  if (!tournamentId || reg.teamName.trim().length < 2) return;
  try {
    // The backend registers teams, not names: create the team once and reuse it.
    let teamId = isUuid(reg.teamId) ? reg.teamId : await serverIdFor('team', reg.teamId);
    if (!teamId) {
      const res = await apiClient.post('/teams', {
        name: reg.teamName.trim(),
        sport: reg.sport,
        ...(reg.teamMascot ? { mascot: reg.teamMascot } : {}),
      });
      teamId = res?.team?.id ?? null;
      if (!teamId) return;
      await rememberServerId('team', reg.teamId, teamId);
    }
    await tournamentApi.registerTeam(tournamentId, teamId, reg.paymentStatus);
  } catch (err) {
    keptLocally('Tournament registration', err);
  }
}

export async function syncEnrollment(classId: string) {
  if (!isUuid(classId) || !(await signedInToServer())) return;
  try {
    await classApi.enrollInClass(classId);
  } catch (err) {
    keptLocally('Class enrolment', err);
  }
}
