import axios from 'axios';
import logger from '../logger';

export interface GeoData {
    ip: string;
    city: string;
    region: string;
    country: string;
    loc: string;
    org: string;
    postal: string;
    timezone: string;
}

export async function getGeoData(ip?: string, token?: string): Promise<GeoData | null> {
    try {
        const apiKey = token || process.env.IPINFO_API_KEY;
        const url = ip ? `https://ipinfo.io/${ip}/json` : `https://ipinfo.io/json`;
        const response = await axios.get(url, {
            params: apiKey ? { token: apiKey } : {},
        });
        return response.data;
    } catch (error) {
        logger.error('Geolocation error:', error);
        return null;
    }
}
