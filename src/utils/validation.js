// ---------------------------------------------------------------------------
// Shared form validators
// ---------------------------------------------------------------------------
// Kept generic and table-driven (rather than "Ghana" hardcoded everywhere)
// so PowerBase can support more launch regions later by adding an entry to
// PHONE_PATTERNS instead of rewriting validation logic.
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Ghana mobile numbers: local format (0XXXXXXXXX, 10 digits) or
// international format (+233XXXXXXXXX). Spaces/dashes are stripped before
// testing so "024 123 4567" and "024-123-4567" both validate.
const PHONE_PATTERNS = {
  GH: /^(0\d{9}|\+233\d{9})$/,
}

export function isRequired(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateEmail(value) {
  if (!isRequired(value)) return 'Email address is required'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address'
  return null
}

// `region` defaults to Ghana for the current launch, but is a parameter (not
// a hardcoded assumption baked into the regex call site) so a future launch
// region just needs a new PHONE_PATTERNS entry and a region value passed in.
export function validatePhone(value, region = 'GH') {
  if (!isRequired(value)) return 'Phone number is required'
  const pattern = PHONE_PATTERNS[region] ?? PHONE_PATTERNS.GH
  const normalized = value.replace(/[\s-]/g, '')
  if (!pattern.test(normalized)) {
    return 'Enter a valid phone number (e.g. 024 123 4567)'
  }
  return null
}

export function validateFullName(value) {
  if (!isRequired(value)) return 'Full name is required'
  if (value.trim().length < 2) return 'Enter your full name'
  return null
}
