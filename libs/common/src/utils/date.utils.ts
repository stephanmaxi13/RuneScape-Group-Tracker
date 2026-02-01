function getLastDayOfMonthUTC(year: number, month: number): Date {
  // We use month + 1 and day 0 to get the last day of 'month'
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
}

export function getDayBounds(date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0); // Use UTC to match MongoDB storage

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}
export function getMonthlyBounds(date: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Start of the month (Day 1)
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // End of the month (using your helper logic)
  const end = getLastDayOfMonthUTC(year, month);

  return { start, end };
}

export function getWeeklyBounds(date = new Date()): { start: Date; end: Date } {
  //Get the day of the week
  const start = new Date(date.getTime());
  //How to find to monday
  // if it is sunday then day = 0  and we need to go back 6 days
  const day = start.getUTCDay();

  const differneceToMonday = day === 0 ? 6 : day - 1;
  //set the start Date to the first day of the week
  start.setUTCDate(start.getUTCDate() - differneceToMonday);
  start.setUTCHours(0, 0, 0, 0); // Use UTC to match MongoDB storage

  const end = new Date(date);
  //Start is the first day of the week so we can just 6
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}
