// The categories table (server/src/schema/schema.sql) only stores an id and
// a name — no icon. This is presentation-only mapping so the storefront can
// show a small icon per category without inventing anything about the
// category itself. Falls back to a generic tag icon for any category id
// this map doesn't know about, so new categories added on the backend never
// break rendering.
export const CATEGORY_ICON = {
  electronics: 'electronics',
  fashion: 'fashion',
  'home-living': 'home',
  computing: 'computing',
  beauty: 'beauty',
  health: 'health',
  groceries: 'groceries',
  books: 'books',
  automotive: 'automotive',
}

export function iconForCategory(categoryId) {
  return CATEGORY_ICON[categoryId] || 'tag'
}
