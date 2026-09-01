import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss-parser';

export const revalidate = 1800; // 30 minutes

export async function GET() {
  try {
    const items = await fetchAllFeeds();
    
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });

    return NextResponse.json({
      categories: ['All', ...Array.from(categories).sort()]
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
