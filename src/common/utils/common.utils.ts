import { Types } from 'mongoose';
import * as moment from 'moment-timezone';
import mongoose from 'mongoose';
import * as fs from 'fs'
import * as Handlebars from 'handlebars';
import { log } from 'util';


export const isValidMongoId = (id: any): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};
export function randomCoupon() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const couponLength = 14;
    let coupon = '';

    for (let i = 0; i < couponLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        coupon += characters[randomIndex];
    }

    return coupon;
}
export function toObjectId(id: string) {
    return new Types.ObjectId(id);
}
export function convertKeys(keys: string[]): string[] {
    return keys.map(key =>
        key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    );
}
export function convertKey(key: string): string {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
export function generateUsername(name: string): string {
    const username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
    return username;
}
export function generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}
export function Like(value: any): any {
    const escapedValue = value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    const pattern = new RegExp(escapedValue, 'i');
    return { $regex: pattern };
}
export function eMatch(value: any) {
    const escapedValue = value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return { $regex: `^${escapedValue}$`, $options: 'i' };
}
export function findMismatchKeys(expected: string[], actual: string[]): number[] {
    const mismatchedKeys: any[] = [];
    for (let i = 0; i < actual.length; i++) {
        if (!expected.includes(actual[i])) {
            mismatchedKeys.push(actual[i]);
        }
    }
    return mismatchedKeys;
}
export function getDayOfWeek(): string {
    const dayOfWeek = moment().tz('Asia/Kolkata').format('dddd');
    return dayOfWeek.toUpperCase();
}
export function getAllDatesInMonth(params: any) {
    const currentMonthDates: { date: string, day: string }[] = [];

    const currentDate = moment().utc();
    const yearToUse = params.year || currentDate.year();
    const monthToUse = params.month !== undefined ? params.month : currentDate.month();

    const startOfMonth = moment.utc({ year: yearToUse, month: monthToUse }).startOf('month');
    const endOfMonth = moment.utc({ year: yearToUse, month: monthToUse }).endOf('month');

    const lastDate = moment().utc().isSame(startOfMonth, 'month') ? currentDate : endOfMonth;

    for (let date = startOfMonth.clone(); date.isSameOrBefore(lastDate); date.add(1, 'days')) {
        currentMonthDates.push({
            date: date.toISOString(),
            day: date.format('dddd'),
        });
    }

    return currentMonthDates;
}
export function getFirstDayOfMonth(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
}
export function getLastDayOfMonth(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
}
export function commonFilters(filters: any) {
    let match: any = {};
    const dateKeys = ['created_at', 'updated_at', 'start_date', 'end_date', 'leave_start', 'leave_end', 'payment_date', 'event_date'];
    if (filters && Object.keys(filters).length > 0) {
        Object.keys(filters).forEach((key) => {
            let filterValue = filters[key];
            if (filterValue && filterValue !== '' && filterValue !== null) {
                if (Array.isArray(filterValue)) {
                    if (filterValue.length === 1) {
                        if (isValidMongoId(filterValue[0])) filterValue[0] = toObjectId(filterValue[0])
                        match[key] = { $eq: filterValue[0] };
                    } else {
                        filterValue = filterValue.map(value => isValidMongoId(value) ? toObjectId(value) : value);
                        match[key] = { $in: filterValue };
                    }
                }
                if (filterValue && (key === 'created_at' || key === 'updated_at' || key === 'payment_date' || key === 'event_date')) {
                    if (typeof filterValue === 'object') {
                        Object.assign(match, buildDateRange(key, key, filterValue?.start, filterValue?.end))
                    }
                    if (typeof filterValue === 'string') {
                        Object.assign(match, buildDateRange(key, undefined, filterValue))
                    }
                }

                if (filterValue && (key === 'start_date' || key === 'end_date')) {
                    const start = filters['start_date'];
                    const end = filters['end_date'];
                    Object.assign(match, buildDateRange('start_date', 'end_date', start, end));
                }

                if (filterValue && (key === 'leave_start' || key === 'leave_end')) {
                    const start = filters['leave_start'];
                    const end = filters['leave_end'];
                    Object.assign(match, buildDateRange('leave_start', 'leave_end', start, end));
                }

                if (!dateKeys.includes(key) && typeof filterValue === 'boolean') {
                    match[key] = { $eq: filterValue };
                }
                if (!dateKeys.includes(key) && filterValue && typeof filterValue === 'string') {
                    if (isValidMongoId(filterValue)) {
                        match[key] = toObjectId(filterValue);
                    } else {
                        match[key] = Like(filterValue);
                    }
                }
            }
        });
    }
    return match;
}
export function appCommonFilters(filters: any, fields: string[] = []) {
    const match: any = {};

    if (filters && filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        if (searchTerm && searchTerm !== '' && searchTerm !== null) {
            if (fields.length > 0) {
                match.$or = fields.map((field) => ({
                    [field]: Like(searchTerm)
                }));
            }
        }
    }
    return match;
}
export function getDaysCount(leave_start: string, leave_end: string): number {
    const startDate = new Date(leave_start);
    const endDate = new Date(leave_end);
    if (endDate < startDate) {
        throw new Error("End date cannot be earlier than start date.");
    }
    const timeDifference = endDate.getTime() - startDate.getTime();
    const dayDifference = timeDifference / (1000 * 3600 * 24);
    return dayDifference + 1;
}
export function getMonthStartEnd(monthNumber: number, year: number): { start: Date, end: Date } {
    const monthIndex = monthNumber - 1;
    const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    return {
        start: startDate,
        end: endDate
    };
}
export function currentMonthNumber() {

    const now = new Date();
    const currentYear = now.getUTCMonth() + 1;
    return currentYear
}
export function currentYear() {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    return currentYear
}
export function getYearStartEnd(year: number) {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
    return { startDate, endDate };
}
export function getBackDate(duration: string, a: Date = new Date()): Date {

    const number = parseInt(duration.slice(0, -1));
    const unit = duration.slice(-1);
    if (isNaN(number) || !['d', 'm', 'y'].includes(unit)) {
        throw new Error("Invalid input format. Use 'Xd', 'Xm', or 'Xy'.");
    }
    const resultDate = new Date(a);
    switch (unit) {
        case 'd':
            resultDate.setUTCDate(resultDate.getUTCDate() - number);
            break;
        case 'm':
            resultDate.setUTCMonth(resultDate.getUTCMonth() - number);
            break;
        case 'y':
            resultDate.setUTCFullYear(resultDate.getUTCFullYear() - number);
            break;
    }
    const year = resultDate.getUTCFullYear();
    const month = (resultDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = resultDate.getUTCDate().toString().padStart(2, '0');
    return new Date(`${year}-${month}-${day}`);
}
export function getNextDate(duration: string, a: Date = new Date()): Date {
    const number = parseInt(duration.slice(0, -1));
    const unit = duration.slice(-1);
    if (isNaN(number) || !['d', 'm', 'y'].includes(unit)) {
        throw new Error("Invalid input format. Use 'Xd', 'Xm', or 'Xy'.");
    }
    const resultDate = new Date(a);
    switch (unit) {
        case 'd':
            resultDate.setUTCDate(resultDate.getUTCDate() + number);
            break;
        case 'm':
            resultDate.setUTCMonth(resultDate.getUTCMonth() + number);
            break;
        case 'y':
            resultDate.setUTCFullYear(resultDate.getUTCFullYear() + number);
            break;
    }
    const year = resultDate.getUTCFullYear();
    const month = (resultDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = resultDate.getUTCDate().toString().padStart(2, '0');
    return new Date(`${year}-${month}-${day}`);
}
export function getStartAndEndDate(date: Date): { start: Date, end: Date } {

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);

    startOfDay.setUTCHours(0, 0, 0, 0);

    endOfDay.setUTCHours(23, 59, 59, 999);

    return {
        start: startOfDay,
        end: endOfDay,
    };
}
export function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
export function getLastNDateRangeArr(days: number): {
    startDate: string,
    endDate: string,
    startDayName: string,
    endDayName: string,
    startMonthNumber: number,
    endMonthNumber: number,
    startMonthName: string,
    endMonthName: string,
    dayOfMonth: number
}[] {
    const today = moment.tz("Asia/Kolkata"); // Current date in IST
    const endDate = today.clone().endOf('day'); // end of today in IST
    let dateRanges: {
        startDate: string,
        endDate: string,
        startDayName: string,
        endDayName: string,
        startMonthNumber: number,
        endMonthNumber: number,
        startMonthName: string,
        endMonthName: string,
        dayOfMonth: number
    }[] = [];

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < days; i++) {
        const startOfDay = endDate.clone().subtract(i, 'days').startOf('day'); // Start of the day in IST
        const endOfDay = startOfDay.clone().endOf('day'); // End of the day in IST

        const startDayName = startOfDay.format('dddd'); // Day name of start date
        const endDayName = endOfDay.format('dddd'); // Day name of end date

        const startMonthNumber = startOfDay.month() + 1; // 1-based month number
        const endMonthNumber = endOfDay.month() + 1; // 1-based month number

        const startMonthName = startOfDay.format('MMMM'); // Month name of start date
        const endMonthName = endOfDay.format('MMMM'); // Month name of end date

        const dayOfMonth = startOfDay.date(); // Day of the month

        dateRanges.push({
            startDate: startOfDay.format(), // Return in IST format
            endDate: endOfDay.format(),     // Return in IST format
            startDayName: startDayName,
            endDayName: endDayName,
            startMonthNumber: startMonthNumber,
            endMonthNumber: endMonthNumber,
            startMonthName: startMonthName,
            endMonthName: endMonthName,
            dayOfMonth: dayOfMonth
        });
    }

    return dateRanges;
};
export function getAllDatesInMonthIST(params: any) {
    const currentMonthDates: {
        startDate: string,
        endDate: string,
        startDayName: string,
        endDayName: string,
        startMonthNumber: number,
        endMonthNumber: number,
        startMonthName: string,
        endMonthName: string,
        dayOfMonth: number,
    }[] = [];

    const month = typeof params?.filters?.month === 'string' ? Number(params?.filters?.month) : params?.filters?.month
    const year = typeof params?.filters?.year === 'string' ? Number(params?.filters?.year) : params?.filters?.year

    const currentDate = moment.tz("Asia/Kolkata");
    const yearToUse = year || currentDate.year();
    const monthToUse = month !== undefined ? month - 1 : currentDate.month();
    const full = params?.full === false;

    const startOfMonth = moment.tz({ year: yearToUse, month: monthToUse }, "Asia/Kolkata").startOf('month');
    const endOfMonth = moment.tz({ year: yearToUse, month: monthToUse }, "Asia/Kolkata").endOf('month');
    const today = moment.tz("Asia/Kolkata");

    const lastDate = full ? endOfMonth : (today.isBefore(endOfMonth) ? today : endOfMonth);

    for (let date = startOfMonth.clone(); date.isSameOrBefore(lastDate, 'day'); date.add(1, 'days')) {
        const startOfDay = date.clone().startOf('day');
        const endOfDay = date.clone().endOf('day');

        currentMonthDates.push({
            startDate: startOfDay.format(),
            endDate: endOfDay.format(),
            startDayName: startOfDay.format('dddd'),
            endDayName: endOfDay.format('dddd'),
            startMonthNumber: startOfDay.month() + 1,
            endMonthNumber: endOfDay.month() + 1,
            startMonthName: startOfDay.format('MMMM'),
            endMonthName: endOfDay.format('MMMM'),
            dayOfMonth: startOfDay.date()
        });
    }

    return currentMonthDates;
}
export function commonSearchFilter(filters: any, searchableFields: string[]) {
    if (!filters || !filters.search || typeof filters.search !== 'string') return {};

    const searchRegex = Like(filters.search)
    return {
        $or: searchableFields.map((field) => ({
            [field]: searchRegex
        }))
    };
};
export function tat(start: Date | string, end: Date | string, format: false | 'd' | 'ms' | 'hms' | 's' = false): any {

    if (typeof start === 'string') {
        start = new Date(start);
    }
    if (typeof end === 'string') {
        end = new Date(end);
    }

    if (start > new Date()) return '0 days'

    const diffMs = Math.abs(end.getTime() - start.getTime());

    if (diffMs <= 0) return format === 's' ? 0 : '0h 0min';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    switch (format) {
        case 'd':
            return `${days} ${days === 1 ? 'day' : 'days'}`;
        case 'ms':
            return `${minutes}min ${seconds}s`;
        case 'hms':
            return { hours, minutes, seconds };
        case 's':
            return totalSeconds;
        default:

            if (days > 0 || hours >= 24) {
                return `${days + (hours >= 24 ? 1 : 0)} ${days + (hours >= 24 ? 1 : 0) === 1 ? 'day' : 'days'}`;
            }
            return formatTime(`${hours}h ${minutes}min`);
    }
}

export function convertToUtcRange(dateStr: any, endDateStr?: any): { start: Date; end: Date } {
    // If only one date is provided, use the first logic
    if (endDateStr === undefined) {
        // If the date is a Date object, convert it to a string
        if (typeof dateStr === 'object' && dateStr instanceof Date) {
            dateStr = dateStr.toISOString(); // Convert to ISO string representation
        }

        // Handle the date string using Moment Timezone for IST
        const istDate = moment.tz(dateStr, 'Asia/Kolkata');

        // Start of the day in IST (00:00:00)
        const istStartDate = moment.tz({
            year: istDate.year(),
            month: istDate.month(),
            date: istDate.date(),
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0,
        }, 'Asia/Kolkata');

        // End of the day in IST (23:59:59.999)
        const istEndDate = moment.tz({
            year: istDate.year(),
            month: istDate.month(),
            date: istDate.date(),
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 999,
        }, 'Asia/Kolkata');

        // Convert the start and end times from IST to UTC
        const startUtc = istStartDate.utc().toDate();  // Convert to UTC and return as Date
        const endUtc = istEndDate.utc().toDate();      // Convert to UTC and return as Date

        return { start: startUtc, end: endUtc };
    }
    else {
        // If both start and end dates are provided
        if (typeof dateStr === 'object' && dateStr instanceof Date) {
            dateStr = dateStr.toISOString(); // Convert start date to ISO string if it's a Date object
        }

        if (typeof endDateStr === 'object' && endDateStr instanceof Date) {
            endDateStr = endDateStr.toISOString(); // Convert end date to ISO string if it's a Date object
        }

        const startDate = moment.tz(dateStr, 'Asia/Kolkata');  // Parsing start date in IST
        const endDate = moment.tz(endDateStr, 'Asia/Kolkata');  // Parsing end date in IST

        // Start of the day in IST for startDate (00:00:00)
        const istStartDate = moment.tz({
            year: startDate.year(),
            month: startDate.month(),
            date: startDate.date(),
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0,
        }, 'Asia/Kolkata');

        // End of the day in IST for endDate (23:59:59.999)
        const istEndDate = moment.tz({
            year: endDate.year(),
            month: endDate.month(),
            date: endDate.date(),
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 999,
        }, 'Asia/Kolkata');

        // Convert the start and end times from IST to UTC
        const startUtc = istStartDate.utc().toDate();
        const endUtc = istEndDate.utc().toDate();

        return { start: startUtc, end: endUtc };
    }
};
export function exactDateFormat(utcDateString: any) {
    const date = new Date(utcDateString);

    date.setUTCHours(date.getUTCHours() - 5);
    date.setUTCMinutes(date.getUTCMinutes() - 30);
    date.setUTCHours(date.getUTCHours() + 1);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const second = String(date.getUTCSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
}
export function tatToMilliseconds(tat: string): number {
    const regex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?\s*(?:(\d+)\s*sec)?/i;
    const match = tat.match(regex);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    return totalMs;
};
export function readTemplateFile(filename: string, data: any): string {
    Handlebars.registerHelper('indexPlusOne', function (index) {
        return index + 1;
    });
    let templatePath = `${process.cwd()}/src/templates/${filename}.html`;
    if (process.env.NODE_ENV === 'production') {
        templatePath = `${process.cwd()}/dist/templates/${filename}.html`;
    }
    let html = fs.readFileSync(templatePath, 'utf8');
    const compiled = Handlebars.compile(html);
    return compiled(data);

};
export function getCurrentYearMonthsRange() {
    const currentYear = moment().year();
    const months = [];
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    for (let i = 0; i < 12; i++) {
        const monthName = monthNames[i];
        const month = String(i + 1).padStart(2, '0');

        // Start: 1st of the month at 00:00:00.000 IST
        const startIST = moment.tz({ year: currentYear, month: i, day: 1 }, 'Asia/Kolkata')
            .hour(0).minute(0).second(0).millisecond(0);

        // End: 1st of next month minus 1 day
        let endIST;
        if (i === 11) {
            // For December, use Jan 1st of next year
            endIST = moment.tz({ year: currentYear + 1, month: 0, day: 1 }, 'Asia/Kolkata');
        } else {
            endIST = moment.tz({ year: currentYear, month: i + 1, day: 1 }, 'Asia/Kolkata');
        }
        endIST = endIST.subtract(1, 'day')
            .hour(23).minute(59).second(59).millisecond(999);

        // Convert to UTC
        const startUTC = startIST.clone().utc().toISOString();
        const endUTC = endIST.clone().utc().toISOString();

        months.push({
            monthName,
            month,
            start: startUTC,
            end: endUTC,
        });
    }

    return months;
};
export function toIST(dateInput, time: Boolean = true) {
    const ist = moment.tz(dateInput, 'Asia/Kolkata');
    if (!ist.isValid()) throw new Error('Invalid date format');
    if (time) return ist.format('YYYY-MM-DD HH:mm:ss');
    return ist.format('YYYY-MM-DD');
};
export function parseTat(tat: string) {
    const match = tat.match(/(?:(\d+)h)?\s*(?:(\d+)min)?\s*(?:(\d+)sec)?/);
    const h = parseInt(match?.[1] || '0', 10);
    const m = parseInt(match?.[2] || '0', 10);
    const s = parseInt(match?.[3] || '0', 10);
    return h * 3600 + m * 60 + s;
};
export function formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}min`;
};

export function formatMin(min: number): string {
    const h = Math.floor(min / 3600);
    const m = Math.floor((min % 3600) / 60);
    return `${h}h ${m}min`;
};

export function getTimeDifferenceInMinutes(from: any, to: any) {
    const fromParts = from.split(":");
    const toParts = to.split(":");
    const fromSeconds = parseInt(fromParts[0]) * 3600 + parseInt(fromParts[1]) * 60 + parseInt(fromParts[2]);
    const toSeconds = parseInt(toParts[0]) * 3600 + parseInt(toParts[1]) * 60 + parseInt(toParts[2]);
    const diffInSeconds = toSeconds - fromSeconds;
    const diffInMinutes = diffInSeconds / 60;
    return Math.round(diffInMinutes);
}
export function getMonthDaysInfo(year: number, month: number): number {
    if (month < 1 || month > 12) {
        throw new Error('Invalid month value. It must be between 1 and 12.');
    }
    const today = moment();
    const inputMonth = moment({ year, month: month - 1 });
    if (inputMonth.isAfter(today, 'month')) {
        return 0;
    }
    if (inputMonth.isSame(today, 'month')) {
        return today.date();
    }
    return inputMonth.daysInMonth();
}
export function splitDate(date: any) {
    if (typeof date === 'string') date = new Date(date)
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return { year, month, day }
}

export function formatTime(timeStr: string): string {
    const parts = timeStr.split(' ');
    const hours = parts[0].replace('h', '').trim();
    const minutes = parts[1].replace('min', '').trim();
    return `${hours} h : ${minutes} min`;
}
export function toLocalDateString(date: Date): string {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset()); // shift to local
    return local.toISOString().split('T')[0]; // returns 'YYYY-MM-DD'
}

export function mapValuesToObjectId(data: any): any {
    const mappedParams: any = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (Types.ObjectId.isValid(value)) {
                mappedParams[key] = toObjectId(value);
            } else {
                mappedParams[key] = value;
            }
        }
    }
    return mappedParams;
}

export function titleCase(type: string): string {
    if (!type) return '';

    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
export function calculatePercentage(part: number, total: number) {
    if (part > total) return 100;
    if (total === 0) {
        return 0;
    }
    let p = (part === 0) ? 0 : (part / total) * 100;
    return p = Number(p.toFixed(2));
}
export function buildDynamicDateRangeMatch(
    filters: { start?: string; end?: string },
    fieldStart: string,
    fieldEnd: string
) {
    const match: any = {};

    if (filters.start && filters.end) {
        const { start: rangeStart, end: rangeStartEnd } = convertToUtcRange(filters.start);
        const { start: rangeEndStart, end: rangeEndEnd } = convertToUtcRange(filters.end);

        match.$or = [
            {
                [fieldStart]: { $lte: rangeEndEnd },
                [fieldEnd]: { $gte: rangeStart }
            },
            {
                [fieldStart]: { $gte: rangeStart, $lte: rangeStartEnd }
            },
            {
                [fieldEnd]: { $gte: rangeEndStart, $lte: rangeEndEnd }
            }
        ];
    } else if (filters.start) {
        const { start, end } = convertToUtcRange(filters.start);
        match[fieldStart] = {
            $gte: start,
            $lte: end
        };
    } else if (filters.end) {
        const { start, end } = convertToUtcRange(filters.end);
        match[fieldEnd] = {
            $gte: start,
            $lte: end
        };
    }

    return match;
}
export function convertISTDateRangeToUTC(startDateStr: string, endDateStr: string) {
    function getUTCDateForIST(dateStr: string, isStart: boolean) {
        // Agar ISO format (2025-07-31T18:30:00.000Z) hai to direct moment se handle karo
        if (dateStr.includes('T')) {
            const { start, end } = convertToUtcRange(dateStr);
            return isStart ? start : end;
        }

        // Agar purana yyyy-mm-dd format hai to pehle jaisa logic
        const [year, month, day] = dateStr.split('-').map(Number);
        if (isStart) {
            return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
        } else {
            return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
        }
    }

    const startUTC = getUTCDateForIST(startDateStr, true);
    const endUTC = getUTCDateForIST(endDateStr, false);

    return { startUTC, endUTC };
}

export function buildDateRange(
    startKey?: string,
    endKey?: string,
    startValue?: any,
    endValue?: any
): Record<string, any> {
    const match: Record<string, any> = {};

    if (startKey && endKey && startValue && endValue) {
        const { startUTC, endUTC } = convertISTDateRangeToUTC(startValue, endValue);
        if (startKey === endKey) {
            match[startKey] = { $gte: startUTC, $lte: endUTC };
        } else {
            match[startKey] = { $gte: startUTC, $lte: endUTC };
            match[endKey] = { $gte: startUTC, $lte: endUTC };
        }
    } else if (startKey && startValue) {
        const { start, end } = convertToUtcRange(startValue);
        match[startKey] = { $gte: start, $lte: end };
    } else if (endKey && endValue) {
        const { start, end } = convertToUtcRange(endValue);
        match[endKey] = { $gte: start, $lte: end };
    }

    return match;
}

export async function nextSeqOzone(req: any, params: any) {
    const model = params.modelName;
    const idKey = params.idKey;
    const prefix = params.prefix;
    if (!model) throw new Error(`Model '${params.modelName}' not found`);
    if (!idKey) throw new Error(`idKey '${idKey}' not found`);
    if (!prefix) throw new Error(`prefix '${prefix}' not found`);

    const skipOrgIdRoutes = ['app-ozone-enquiry', 'ozone-enquiry'];
    const shouldSkipOrgId = skipOrgIdRoutes.some((route) =>
        req?.url?.includes(route),
    );
    const matchClause: Record<string, any> = {
        [idKey]: { $regex: new RegExp(`^${prefix}-\\d+$`, 'i') },
    };
    if (!shouldSkipOrgId && req?.user?.org_id) {
        matchClause['org_id'] = req.user.org_id;
    }

    const result = await model.aggregate([
        { $match: matchClause },
        {
            $addFields: {
                numberPart: {
                    $toInt: {
                        $arrayElemAt: [{ $split: [`$${idKey}`, `${prefix}-`] }, 1],
                    },
                },
            },
        },
        { $sort: { numberPart: -1 } },
        { $limit: 1 },
        { $project: { numberPart: 1 } },
    ]);
    console.log('Matched documents for sequence:', result);
    const lastNumber = result?.[0]?.numberPart || 0;
    let nextNumber = lastNumber;
    let nextId = '';
    let exists = true;
    
    while (exists) {
      nextNumber += 1;
      nextId = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
      exists = await model.exists({ [idKey]: nextId });
    }

    return nextId;
}

export async function nextSeq(req: any, params: any) {
    const orgId = req['user']['org_id'];

    const model = params.modelName;
    const idKey = params.idKey;
    const prefix = params.prefix;

    if (!model) throw new Error(`Model '${params.modelName}' not found`);
    if (!idKey) throw new Error(`idKey '${idKey}' not found`);
    if (!prefix) throw new Error(`prefix '${prefix}' not found`);

    const result = await model.aggregate([
        {
            $match: {
                org_id: orgId,
                [idKey]: Like(prefix),
            },
        },
        {
            $addFields: {
                numberPart: {
                    $toInt: {
                        $arrayElemAt: [{ $split: [`$${idKey}`, `${prefix}-`] }, 1],
                    },
                },
            },
        },
        {
            $sort: { numberPart: -1 },
        },
        {
            $limit: 1,
        },
        {
            $project: {
                numberPart: 1,
            },
        },
    ]);

    const lastNumber = result[0]?.numberPart || 0;
    const nextNumber = lastNumber + 1;
    const nextId = `${prefix}-${nextNumber}`;
    return nextId;
}


export function getQuarterRanges() {
    const currentYear = new Date().getFullYear();

    const quarters = [
        {
            start: `${currentYear}-01-01`,
            end: `${currentYear}-03-31`,
            title: `Jan-Mar ${currentYear}`
        },
        {
            start: `${currentYear}-04-01`,
            end: `${currentYear}-06-30`,
            title: `Apr-Jun ${currentYear}`
        },
        {
            start: `${currentYear}-07-01`,
            end: `${currentYear}-09-30`,
            title: `Jul-Sep ${currentYear}`
        },
        {
            start: `${currentYear}-10-01`,
            end: `${currentYear}-12-31`,
            title: `Oct-Dec ${currentYear}`
        }
    ];

    return quarters;
}
export function getFinancialYearQuarterRanges() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-based index (0 = January)
    const currentYear = today.getFullYear();

    // If today is Jan, Feb, or Mar, we're still in the previous financial year
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const fyEndYear = fyStartYear + 1;

    const quarters = [
        {
            start: `${fyStartYear}-04-01`,
            end: `${fyStartYear}-06-30`,
            title: `Q1: Apr-Jun ${fyStartYear}`
        },
        {
            start: `${fyStartYear}-07-01`,
            end: `${fyStartYear}-09-30`,
            title: `Q2: Jul-Sep ${fyStartYear}`
        },
        {
            start: `${fyStartYear}-10-01`,
            end: `${fyStartYear}-12-31`,
            title: `Q3: Oct-Dec ${fyStartYear}`
        },
        {
            start: `${fyEndYear}-01-01`,
            end: `${fyEndYear}-03-31`,
            title: `Q4: Jan-Mar ${fyEndYear}`
        }
    ];

    return quarters;
}
export function getFinancialYearMonthRanges() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = January
    const currentYear = today.getFullYear();

    // Determine start year of the financial year
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const fyEndYear = fyStartYear + 1;

    // Months from April to March
    const months = [
        { month: 3, year: fyStartYear },  // April
        { month: 4, year: fyStartYear },  // May
        { month: 5, year: fyStartYear },  // June
        { month: 6, year: fyStartYear },  // July
        { month: 7, year: fyStartYear },  // August
        { month: 8, year: fyStartYear },  // September
        { month: 9, year: fyStartYear },  // October
        { month: 10, year: fyStartYear }, // November
        { month: 11, year: fyStartYear }, // December
        { month: 0, year: fyEndYear },    // January
        { month: 1, year: fyEndYear },    // February
        { month: 2, year: fyEndYear }     // March
    ];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const ranges = months.map(({ month, year }) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0); // Last day of the month
        const monthName = monthNames[month];

        return {
            start: start.toISOString().slice(0, 10), // YYYY-MM-DD
            end: end.toISOString().slice(0, 10),
            title: `${monthName} ${year}`
        };
    });

    return ranges;
}
export function analyzeMonthlyAchievements(monthlyData: Record<string, any>[]) {
    if (!monthlyData || monthlyData.length === 0) return null;

    let highest = monthlyData[0];
    let lowest = monthlyData[0];
    let total = 0;

    for (const month of monthlyData) {
        if (month.target === 0) continue;
        const achievement = month.achievement ?? 0;

        if (achievement > (highest.achievement ?? 0)) {
            highest = month;
        }

        if (achievement < (lowest.achievement ?? 0)) {
            lowest = month;
        }

        total += achievement;
    }

    const average = total / monthlyData.length;

    return {
        highest_month: {
            title: highest.title,
            achievement: highest.achievement
        },
        lowest_month: {
            title: lowest.title,
            achievement: lowest.achievement
        },
        average_achievement: average
    };
}
export function getTargetAchievementRate(data) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let totalTarget = 0;
    let totalAchievement = 0;

    for (const item of data) {
        totalTarget += item.target ?? 0;
        totalAchievement += item.achievement ?? 0;
    }

    if (totalTarget === 0) return 0;

    const rate = (totalAchievement / totalTarget) * 100;
    return parseFloat(rate.toFixed(2)); // rounded to 2 decimal places
}

export function getIndianFinancialYearDates() {
    // Get current date in IST
    const ISTOffset = 5.5 * 60; // IST is UTC+5:30
    const localTime = new Date().getTime();
    const localOffset = new Date().getTimezoneOffset() * 60000;
    const ISTTime = new Date(localTime + localOffset + ISTOffset * 60000);

    const currentYear = ISTTime.getFullYear();
    const currentMonth = ISTTime.getMonth(); // Month is 0-indexed (January is 0)

    let startDate, endDate;

    // Financial year starts on April 1st
    if (currentMonth >= 3) { // April is month 3 (0-based index)
        startDate = new Date(currentYear, 3, 1); // April 1st of current year
        endDate = new Date(currentYear + 1, 2, 31); // March 31st of next year
    } else {
        startDate = new Date(currentYear - 1, 3, 1); // April 1st of previous year
        endDate = new Date(currentYear, 2, 31); // March 31st of current year
    }

    // Format dates to ISO string (YYYY-MM-DD)
    startDate = startDate.toISOString().split('T')[0];
    endDate = endDate.toISOString().split('T')[0];

    return {
        startDate,
        endDate
    };
}
export function targetProgressStatus(progress: number) {
    const status = progress >= 100
        ? 'Completed'
        : progress > 0
            ? 'In Progress'
            : 'Pending'
    return status
}
export function getISTDateList(start: string | Date, end: string | Date): Record<string, any>[] {
    const toIST = (dateInput: string | Date): Date => {
        const utcDate = new Date(dateInput);
        const IST_OFFSET_MINUTES = 330;
        return new Date(utcDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
    };

    const istStart = toIST(start);
    const istEnd = toIST(end);

    const dates: Record<string, any>[] = [];
    let current = new Date(istStart);

    while (current <= istEnd) {
        // Format date as YYYY-MM-DD string
        const formattedDate = current.toISOString().split('T')[0];
        dates.push({ date: formattedDate });

        // Move to next day
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

export function toTitleCase(input: string = ''): string {
    return input
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}
export function generateSegmentVariants(segment: string): string[] {
  const base = segment.toLowerCase().replace(/\./g, '').trim();
  return [
    base.toUpperCase(),
    base.toLowerCase(),
    base.toLowerCase().split('').join('.').toUpperCase(),
    base.toLowerCase().split('').join('.').toUpperCase() + '.',
    base.toUpperCase().split('').join('.'),
    base.toUpperCase().split('').join('.') + '.',
  ];
}

// Get product dispatch model schema
export function getProductDispatchSchema() {
  let DispatchFormSchema = [
    {
      name: 'qr_genration',
      label: 'Qr Genration',
      required: true,
      type: 'Boolean',
      module: 'Product-Dispatch'
    },
    {
      name: 'box_with_item',
      label: 'Box Item With QR',
      required: true,
      type: 'Boolean',
      module: 'Product-Dispatch'
    },
    {
      name: 'master_box_size',
      label: 'Master Packing Size',
      required: false,
      type: 'number',
      module: 'Product-Dispatch'
    },
    {
      name: 'box_size',
      label: 'Small Packing Size',
      required: false,
      type: 'number',
      module: 'Product-Dispatch'
    },
    {
      name: 'uom',
      label: 'UOM',
      required: false,
      type: 'string',
      module: 'Product-Dispatch'
    },
  ];

  return DispatchFormSchema;
}

// Get staic MRP header
export function getStaticMrpSchema(mrp_type: string) {
  const staticMRPHeader = {
    'MRP': ['Mrp'],
    'Net Price': ['MRP', 'Channel Partner Net Price', 'Direct Dealer Net Price'],
    'Zone Wise Mrp': ['MRP'],
    'Zone Wise Net Price': ['MRP', 'Channel Partner Net Price', 'Direct Dealer Net Price'],
  };

  return staticMRPHeader[mrp_type];
}

// Get point category schema
export function getPointCategorySchema() {
  const point_category_schema = {
    label: 'Point Category',
    name: 'point_category_name',
    type: 'string',
    required: false,
  }
  return point_category_schema;
}
