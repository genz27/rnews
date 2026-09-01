export const CATEGORY_COOKIE = 'rnews-category';
export const CATEGORY_STORAGE_KEY = 'rnews-category';

export function persistCategory(category: string) {
  try {
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, category);
  } catch {
    /* ignore quota / private mode */
  }
  document.cookie = `${CATEGORY_COOKIE}=${encodeURIComponent(category)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readCategoryCookie(value?: string | null, allowed: string[] = []) {
  if (!value) return '';
  const decoded = decodeURIComponent(value);
  return allowed.includes(decoded) ? decoded : '';
}
