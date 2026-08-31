// ---------------------------------------------------------------------------
// Pricing configuration
// ---------------------------------------------------------------------------
// Single source of truth for platform-controlled pricing values, so nothing
// gets scattered across components as a magic number.
//
// PLATFORM_FEE_GHS is fixed for now, but written as a named, imported
// constant specifically so it's a one-line change to source this from a
// backend/admin settings endpoint later (e.g. replace the literal below
// with a value fetched from `getPlatformSettings()`) without touching any
// component that uses it.
// ---------------------------------------------------------------------------

export const PLATFORM_FEE_GHS = 7
