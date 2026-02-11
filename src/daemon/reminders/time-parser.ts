interface ParsedTime {
  remindAt: number;
  cronPattern: string | null;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function parseRelativeShort(input: string): number | null {
  const match = input.match(/^(\d+)\s*(m|min|mins|minutes?|h|hrs?|hours?|s|secs?|seconds?)$/i);
  if (!match) return null;

  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();

  let ms = 0;
  if (unit.startsWith('s')) ms = amount * 1000;
  else if (unit.startsWith('m')) ms = amount * 60 * 1000;
  else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000;

  return Date.now() + ms;
}

function parseRelativeLong(input: string): number | null {
  const match = input.match(/^in\s+(\d+)\s+(minutes?|hours?|days?)$/i);
  if (!match) return null;

  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();

  let ms = 0;
  if (unit.startsWith('minute')) ms = amount * 60 * 1000;
  else if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000;
  else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000;

  return Date.now() + ms;
}

function parseTimeOfDay(timeStr: string): { hours: number; minutes: number } | null {
  const match12 = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1]!, 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3]!.toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return {
      hours: parseInt(match24[1]!, 10),
      minutes: parseInt(match24[2]!, 10),
    };
  }

  return null;
}

function parseDayAndTime(input: string): number | null {
  const lower = input.toLowerCase().trim();

  let dayOffset: number | null = null;
  let timeStr = '';

  if (lower.startsWith('tomorrow')) {
    dayOffset = 1;
    timeStr = lower.replace('tomorrow', '').trim();
  } else if (lower.startsWith('today')) {
    dayOffset = 0;
    timeStr = lower.replace('today', '').trim();
  } else {
    for (const [name, weekday] of Object.entries(WEEKDAYS)) {
      if (lower.startsWith(name)) {
        const now = new Date();
        const currentDay = now.getDay();
        let diff = weekday - currentDay;
        if (diff <= 0) diff += 7;
        dayOffset = diff;
        timeStr = lower.replace(name, '').trim();
        break;
      }
    }
  }

  if (dayOffset === null) return null;

  const time = parseTimeOfDay(timeStr);
  if (!time) return null;

  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  target.setHours(time.hours, time.minutes, 0, 0);

  return target.getTime();
}

function parseTimeOnly(input: string): number | null {
  const time = parseTimeOfDay(input.trim());
  if (!time) return null;

  const now = new Date();
  const target = new Date();
  target.setHours(time.hours, time.minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

function parseRecurrent(input: string): ParsedTime | null {
  const match = input.match(/^every\s+(day|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s+(.+)$/i);
  if (!match) return null;

  const dayStr = match[1]!.toLowerCase();
  const timeStr = match[2]!.trim();

  const time = parseTimeOfDay(timeStr);
  if (!time) return null;

  let cronDay: string;
  if (dayStr === 'day') {
    cronDay = '*';
  } else {
    const weekday = WEEKDAYS[dayStr];
    if (weekday === undefined) return null;
    cronDay = String(weekday);
  }

  const cronPattern = `${time.minutes} ${time.hours} * * ${cronDay}`;

  const now = new Date();
  const target = new Date();
  target.setHours(time.hours, time.minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    if (cronDay === '*') {
      target.setDate(target.getDate() + 1);
    } else {
      const currentDay = now.getDay();
      const targetDay = parseInt(cronDay, 10);
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      target.setDate(target.getDate() + diff);
    }
  }

  return { remindAt: target.getTime(), cronPattern };
}

function parseDateFormat(input: string): number | null {
  const matchSlash = input.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/);
  if (matchSlash) {
    const month = parseInt(matchSlash[1]!, 10) - 1;
    const day = parseInt(matchSlash[2]!, 10);
    const timeStr = matchSlash[3];

    const now = new Date();
    const target = new Date(now.getFullYear(), month, day);

    if (target.getTime() < now.getTime()) {
      target.setFullYear(target.getFullYear() + 1);
    }

    if (timeStr) {
      const time = parseTimeOfDay(timeStr.trim());
      if (time) {
        target.setHours(time.hours, time.minutes, 0, 0);
      }
    }

    return target.getTime();
  }

  const matchISO = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(.+))?$/);
  if (matchISO) {
    const target = new Date(
      parseInt(matchISO[1]!, 10),
      parseInt(matchISO[2]!, 10) - 1,
      parseInt(matchISO[3]!, 10),
    );

    if (matchISO[4]) {
      const time = parseTimeOfDay(matchISO[4].trim());
      if (time) {
        target.setHours(time.hours, time.minutes, 0, 0);
      }
    }

    return target.getTime();
  }

  return null;
}

export function parseReminderTime(input: string): ParsedTime | null {
  const trimmed = input.trim();

  const recurrent = parseRecurrent(trimmed);
  if (recurrent) return recurrent;

  const relShort = parseRelativeShort(trimmed);
  if (relShort) return { remindAt: relShort, cronPattern: null };

  const relLong = parseRelativeLong(trimmed);
  if (relLong) return { remindAt: relLong, cronPattern: null };

  const dayTime = parseDayAndTime(trimmed);
  if (dayTime) return { remindAt: dayTime, cronPattern: null };

  const timeOnly = parseTimeOnly(trimmed);
  if (timeOnly) return { remindAt: timeOnly, cronPattern: null };

  const dateFormat = parseDateFormat(trimmed);
  if (dateFormat) return { remindAt: dateFormat, cronPattern: null };

  return null;
}
