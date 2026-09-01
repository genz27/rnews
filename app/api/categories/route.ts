import { NextResponse } from 'next/server';
import { getCatalogCategories } from '@/lib/catalog';
import { getSources } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

export async function GET() {
  try {
    const sources = await getSources();
    const extras = new Set(
      sources
        .map((source) => source.category)
        .filter((category) => category && !getCatalogCategories().includes(category))
    );
    return NextResponse.json({
      categories: [...getCatalogCategories(), ...Array.from(extras).sort()],
      sourceCount: sources.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      categories: getCatalogCategories(),
      sourceCount: 0,
    });
  }
}
