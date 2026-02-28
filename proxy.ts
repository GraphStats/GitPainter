import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === '/fin') {
        return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/fin';
    url.search = '';

    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
