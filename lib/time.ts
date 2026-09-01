export function formatUpdatedAt(cachedAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - cachedAt) / 60000));
  if (minutes < 1) return '刚刚更新';
  if (minutes < 60) return `${minutes} 分钟前更新`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours <= 1 ? '大约 1 小时前更新' : `大约 ${hours} 小时前更新`;
  const days = Math.round(hours / 24);
  return days <= 1 ? '1 天前更新' : `${days} 天前更新`;
}
