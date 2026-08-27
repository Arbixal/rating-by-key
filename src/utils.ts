export function formatTime(date: Date) {
    const hours = date.getUTCHours();
    const mins = date.getUTCMinutes() + (hours * 60);
    const seconds = date.getUTCSeconds();

    return mins.toString() + ":" + (seconds < 10 ? "0" : "") + seconds.toString();
}

export function roundToOneDecimal(num: number): number {
    return Math.round(num * 10) / 10;
}
