import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss-parser';
import { FeedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 20;

export const revalidate = 1800; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = parseInt(searchParams.get('cursor') || '0');
    const category = searchParams.get('category') || '';
    const query = searchParams.get('q') || '';

    let items = await fetchAllFeeds();
    
    if (category && category !== 'All') {
      items = items.filter(item => 
        item.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.source.toLowerCase().includes(lowerQuery)
      );
    }
    
    const startIndex = cursor;
    const endIndex = cursor + ITEMS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, endIndex);
    const hasMore = endIndex < items.length;

    const response: FeedResponse = {
      items: paginatedItems,
      hasMore,
      nextCursor: hasMore ? endIndex : undefined
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in feed API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}
