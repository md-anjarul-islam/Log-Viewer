// Shared between main (validation in SettingsStore) and renderer (client-side
// validation/hints in the connection settings UI) so the two never drift.
export const CORRELATION_WINDOW_MS_MIN = 100
export const CORRELATION_WINDOW_MS_MAX = 60000
export const CORRELATION_WINDOW_MS_DEFAULT = 2000

// Default end-of-reply idle gap for a queued command: once at least one frame
// has arrived, the run ends when no further frame arrives within this many
// ms (so multi-line replies stay grouped but the queue doesn't wait for the
// full timeout). A per-command override takes precedence.
export const IDLE_GAP_MS_DEFAULT = 300
export const IDLE_GAP_MS_MIN = 10
export const IDLE_GAP_MS_MAX = 60000
