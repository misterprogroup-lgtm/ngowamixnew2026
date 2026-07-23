import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const ticketMatch = host.match(/^([\w-]+)ticket\.ngowamix\.com$/);

  if (ticketMatch) {
    const artistSlug = ticketMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/ticket/${artistSlug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|uploads|favicon|icon|manifest|sw\\.js).*)'],
};
