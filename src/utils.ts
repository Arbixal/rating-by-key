export function formatTime(date: Date) {
    const mins = date.getMinutes();
    const seconds = date.getSeconds();

    return mins.toString() + ":" + (seconds < 10 ? "0" : "") + seconds.toString();
}

export function roundToOneDecimal(num: number): number {
    return Math.round(num * 10) / 10;
}