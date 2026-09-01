export function pageKey(category: string, query = '') {
  return query ? `q:${category}:${query}` : `c:${category}`;
}
