export function formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }); 
    const year = date.getFullYear();
    return `${getOrdinal(day)} ${month} ${year}`;
  }
  function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

export const unixTimeStarmp = (date: Date) =>
    Math.floor(new Date(date).getTime() / 1000);