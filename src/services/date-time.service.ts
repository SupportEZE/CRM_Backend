import { Injectable, Global } from '@nestjs/common';
import * as moment from 'moment-timezone';

@Global()
@Injectable()
export class DateTimeService {
    private readonly timeZone: string = 'Asia/Kolkata';

    getCurrentDate(): string {
        return moment().tz(this.timeZone).format('YYYY-MM-DD');
    }

    getCurrentTime(): string {
        return moment().tz(this.timeZone).format('HH:mm:ss');
    }

    getCurrentDateTime(): string {
        return moment().tz(this.timeZone).format('YYYY-MM-DD HH:mm:ss');
    }

    getCurrentISODateTime(): string {
        return moment().tz(this.timeZone).format();
    }

    getDateParts(date: Date): { year: number, month: string, day: number, dayName: string } {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    
        const dayNames = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ];
    
        const year = date.getFullYear();
        const month = monthNames[date.getMonth()]; // Get month name
        const day = date.getDate();
        const dayName = dayNames[date.getDay()]; // Get day name
    
        return { year, month, day, dayName };
    }
    
    
}
