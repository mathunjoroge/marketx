import { NextRequest, NextResponse } from 'next/server';
import { getGeoData } from '@/lib/services/geo';
import { getUserServices } from '@/lib/auth/credentials';

export async function GET(req: NextRequest) {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : undefined;

    // Get user services for IPInfo token
    const { ipinfoToken } = await getUserServices();

    const data = await getGeoData(ip, ipinfoToken);
    if (!data) {
        return NextResponse.json({ error: 'Failed to fetch geolocation' }, { status: 500 });
    }

    return NextResponse.json(data);
}
