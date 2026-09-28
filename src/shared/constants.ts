// Shared between main (validation in SettingsStore) and renderer (client-side
// validation/hints in the connection settings UI) so the two never drift.
export const CORRELATION_WINDOW_MS_MIN = 100
export const CORRELATION_WINDOW_MS_MAX = 60000
export const CORRELATION_WINDOW_MS_DEFAULT = 2000
