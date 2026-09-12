/**
 * remote-config.ts
 *
 * What the Super Admin console controls in this app, read from GET /api/config:
 * feature switches per role, and the layout of four forms — which built-in
 * fields show, which are required, their labels — plus fields the admin added.
 * Pure functions so the rules are testable without React Native.
 *
 * Everything falls back to how the screen already behaves. With no backend, no
 * cache, or a setting the admin never touched, the app looks and validates
 * exactly as it did before the console existed.
 */

export type RemoteFieldType = 'text' | 'textarea' | 'number' | 'phone' | 'email' | 'date' | 'select' | 'toggle' | 'media';
export type FormKey = 'create_turf' | 'create_tournament' | 'team_registration' | 'signup_profile';
export const FORM_KEYS: FormKey[] = ['create_turf', 'create_tournament', 'team_registration', 'signup_profile'];

const FIELD_TYPES: RemoteFieldType[] = ['text', 'textarea', 'number', 'phone', 'email', 'date', 'select', 'toggle', 'media'];

export interface RemoteField {
  key: string;
  label: string;
  type: RemoteFieldType;
  builtIn: boolean;
  visible: boolean;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
  maxLength?: number;
  locked?: boolean;
  /** Set by the server when the admin changed this built-in field's label. */
  labelOverridden?: boolean;
  placeholderOverridden?: boolean;
  requiredOverridden?: boolean;
}

export interface RemoteConfig {
  version: number;
  role: string | null;
  features: Record<string, boolean>;
  forms: Partial<Record<FormKey, RemoteField[]>>;
}

export const EMPTY_CONFIG: RemoteConfig = { version: 0, role: null, features: {}, forms: {} };
export const REMOTE_CONFIG_CACHE_PREFIX = '@turf_remote_config:';

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => !!v && typeof v === 'object' && !Array.isArray(v);

/** Accepts the server's response (or a cached copy) and drops anything malformed. */
export function parseRemoteConfig(raw: unknown): RemoteConfig | null {
  if (!isObj(raw)) return null;

  const features: Record<string, boolean> = {};
  if (isObj(raw.features)) {
    for (const [key, value] of Object.entries(raw.features)) {
      if (typeof value === 'boolean') features[key] = value;
    }
  }

  const forms: RemoteConfig['forms'] = {};
  if (isObj(raw.forms)) {
    for (const formKey of FORM_KEYS) {
      const list = raw.forms[formKey];
      if (!Array.isArray(list)) continue;
      forms[formKey] = list
        .filter(isObj)
        .filter((f) => typeof f.key === 'string' && typeof f.label === 'string' && FIELD_TYPES.includes(f.type as RemoteFieldType))
        .map((f) => ({
          key: f.key as string,
          label: f.label as string,
          type: f.type as RemoteFieldType,
          // Unknown means built-in: never render an input the server didn't clearly add.
          builtIn: f.builtIn !== false,
          visible: f.visible !== false,
          required: f.required === true,
          order: typeof f.order === 'number' ? f.order : 0,
          placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
          options: Array.isArray(f.options) ? f.options.filter((o): o is string => typeof o === 'string') : undefined,
          maxLength: typeof f.maxLength === 'number' ? f.maxLength : undefined,
          locked: f.locked === true,
          labelOverridden: f.labelOverridden === true,
          placeholderOverridden: f.placeholderOverridden === true,
          requiredOverridden: f.requiredOverridden === true,
        }))
        .sort((a, b) => a.order - b.order);
    }
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : 0,
    role: typeof raw.role === 'string' ? raw.role : null,
    features,
    forms,
  };
}

/** A feature is on unless the server explicitly switched it off. */
export function isFeatureOn(config: RemoteConfig, key: string | undefined | null): boolean {
  if (!key) return true;
  return config.features[key] !== false;
}

export interface FieldFallback {
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface FieldView {
  key: string;
  visible: boolean;
  required: boolean;
  label: string;
  placeholder?: string;
}

/**
 * How a screen should render one of its own built-in fields. The screen passes
 * what it shows today; only what the admin actually changed replaces it.
 */
export function fieldView(config: RemoteConfig, form: FormKey, key: string, fallback: FieldFallback): FieldView {
  const f = config.forms[form]?.find((x) => x.key === key && x.builtIn);
  if (!f) {
    return { key, visible: true, required: !!fallback.required, label: fallback.label, placeholder: fallback.placeholder };
  }
  const visible = f.locked ? true : f.visible;
  return {
    key,
    visible,
    required: visible && (f.requiredOverridden ? f.required : !!fallback.required),
    label: f.labelOverridden ? f.label : fallback.label,
    placeholder: f.placeholderOverridden ? f.placeholder : fallback.placeholder,
  };
}

/** Admin-added fields to render, in the admin's order. */
export function customFieldsFor(config: RemoteConfig, form: FormKey): RemoteField[] {
  return (config.forms[form] ?? []).filter((f) => !f.builtIn && f.visible);
}

/** Labels of visible required built-in fields left empty. */
export function missingRequired(entries: { view: FieldView; value: unknown }[]): string[] {
  return entries
    .filter(({ view, value }) => view.visible && view.required && !String(value ?? '').trim())
    .map(({ view }) => view.label);
}

export type CustomAnswers = Record<string, string>;

/** Problems with answers to custom fields, as sentences ready to show. */
export function validateCustomAnswers(fields: RemoteField[], answers: CustomAnswers): string[] {
  const errors: string[] = [];
  for (const f of fields) {
    if (f.builtIn || !f.visible) continue;
    const value = String(answers[f.key] ?? '').trim();
    if (!value) {
      if (f.required) errors.push(`${f.label} is required.`);
      continue;
    }
    switch (f.type) {
      case 'number':
        if (!Number.isFinite(Number(value.replace(/,/g, '')))) errors.push(`${f.label} must be a number.`);
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${f.label} must be a valid email.`);
        break;
      case 'phone': {
        const digits = value.replace(/\D/g, '').length;
        if (digits < 7 || digits > 15) errors.push(`${f.label} must be a valid phone number.`);
        break;
      }
      case 'date':
        if (Number.isNaN(Date.parse(value))) errors.push(`${f.label} must be a date like 2026-09-30.`);
        break;
      case 'select':
        if (!f.options?.includes(value)) errors.push(`Choose an option for ${f.label}.`);
        break;
      default: {
        const max = f.maxLength ?? (f.type === 'textarea' ? 2000 : 200);
        if (value.length > max) errors.push(`${f.label} must be at most ${max} characters.`);
      }
    }
  }
  return errors;
}

/** Only answers to the given fields, trimmed, empty ones dropped. */
export function cleanAnswers(fields: RemoteField[], answers: CustomAnswers): CustomAnswers {
  const out: CustomAnswers = {};
  for (const f of fields) {
    const value = String(answers[f.key] ?? '').trim();
    if (value) out[f.key] = value;
  }
  return out;
}

export const answersStorageKey = (form: FormKey, entityType: string, entityId: string) => `${form}:${entityType}:${entityId}`;

// ── Feature keys for app surfaces ───────────────────────────────────────────
// Keys must match turf_backend/src/config/admin-registry.ts.

/** Bottom tabs (route names in app/(tabs)). "index" (Home) is never switchable. */
export const TAB_FEATURES: Record<string, string> = {
  matches: 'nav.matches',
  explore: 'nav.turf_book',
  tournaments: 'nav.cups',
  club: 'nav.host',
  network: 'network.connect',
  coach: 'nav.class',
};

/** The "coach" route is Class for players, Coach for coaches and Add Turf for owners. */
export function tabFeature(tab: string, role?: string | null): string {
  if (tab === 'coach' && role === 'Owner') return 'owner.create_turf';
  return TAB_FEATURES[tab] ?? '';
}

export const MATCH_TAB_FEATURES: Record<string, string> = {
  'Bid Match': 'matches.bid_match',
  'Quick Match': 'matches.quick_match',
};

export const DRAWER_FEATURES: Record<string, string> = {
  wallet: 'wallet',
  'owner-offers': 'owner.offers',
  host: 'nav.host',
  earnings: 'earnings',
  payouts: 'payouts',
  'turf-bookings': 'booking.turf',
  classes: 'coaching.create_class',
  students: 'coaching.create_class',
};

export function filterByFeature<T>(items: T[], keyOf: (item: T) => string, map: Record<string, string>, config: RemoteConfig): T[] {
  return items.filter((item) => isFeatureOn(config, map[keyOf(item)]));
}

/**
 * True for a token the backend issued. Demo and offline sign-ins store a
 * placeholder the API would reject, so nothing is sent to the server for them.
 */
export function isServerToken(token: string | null | undefined): boolean {
  return !!token && !token.startsWith('local_token_') && token.split('.').length === 3;
}
