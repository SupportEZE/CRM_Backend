import { Injectable, Global } from '@nestjs/common';
import axios from 'axios';

@Global()
@Injectable()
export class LocationService {

    async google_maps(lat: number, lng: number): Promise<string> {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCxdpHBwNw4N4yzj8eHre9HZ6g6A13_MB4`;

        try {
            const response = await axios.get(url);
            if (response.data.status === 'OK') {
                return response.data || 'status error';
            } else {
                return 'Address not found';
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            return 'Error fetching address';
        }
    }

    async open_streetold(lat: number, lng: number): Promise<string> {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

        try {
            const response = await axios.get(url);
            if (response.data && response.data.display_name) {
                return response.data.display_name;
            } else {
                return 'Address not found';
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            return 'Error fetching address';
        }
    }
    async open_street(lat: number, lng: number): Promise<string> {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const maxRetries = global.ADDRESS_FETCH_ATTEMPT
        for (let attempt = 1; attempt <= maxRetries; attempt++) {    
            try {
                const response = await axios.get(url);
                if (response.data && response.data.display_name) {
                    return response.data.display_name;
                } else {
                    console.warn(`Attempt ${attempt}: Address not found`);
                }
            } catch (error) {
                console.error(`Attempt ${attempt}: Error fetching address`, error);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return 'Address not found';
    }

    getDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
        type: 'm' | 'km' = 'km'
      ): number {
        const R = 6371; // Radius of the Earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInKm = R * c;
      
        if (type === 'm') {
          const distanceInMeters = distanceInKm * 1000;
          return Number(distanceInMeters.toFixed(2));
        }
      
        return Number(distanceInKm.toFixed(2));
      }
      
    private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
    }
      
}
