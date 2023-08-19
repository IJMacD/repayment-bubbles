export function colourInterpolateHex(x: number, start: string, end: string) {
    const startColour = [
        parseInt(start.substring(1, 3), 16),
        parseInt(start.substring(3, 5), 16),
        parseInt(start.substring(5, 7), 16),
    ];
    const endColour = [
        parseInt(end.substring(1, 3), 16),
        parseInt(end.substring(3, 5), 16),
        parseInt(end.substring(5, 7), 16),
    ];
    const diff = [
        endColour[0] - startColour[0],
        endColour[1] - startColour[1],
        endColour[2] - startColour[2],
    ];
    const result = [
        startColour[0] + diff[0] * x,
        startColour[1] + diff[1] * x,
        startColour[2] + diff[2] * x,
    ];
    const clamped = [
        Math.min(255, Math.max(Math.round(result[0]), 0)),
        Math.min(255, Math.max(Math.round(result[1]), 0)),
        Math.min(255, Math.max(Math.round(result[2]), 0)),
    ];
    const hex = [
        clamped[0].toString(16).padStart(2, "0"),
        clamped[1].toString(16).padStart(2, "0"),
        clamped[2].toString(16).padStart(2, "0"),
    ];
    return `#${hex.join("")}`;
}

export function colourInterpolateHSL(x: number, start: string, end: string) {
    const hslRe = /hsl\(([\d.]+)deg ([\d.]+)% ([\d.]+)%\)/;
    const startMatch = hslRe.exec(start);
    const endMatch = hslRe.exec(end);
    if (!startMatch) return end;
    if (!endMatch) return start;
    const startColour = [
        parseInt(startMatch[1], 10),
        parseInt(startMatch[2], 10),
        parseInt(startMatch[3], 10),
    ];
    const endColour = [
        parseInt(endMatch[1], 10),
        parseInt(endMatch[2], 10),
        parseInt(endMatch[3], 10),
    ];
    const diff = [
        endColour[0] - startColour[0],
        endColour[1] - startColour[1],
        endColour[2] - startColour[2],
    ];
    const result = [
        startColour[0] + diff[0] * x,
        startColour[1] + diff[1] * x,
        startColour[2] + diff[2] * x,
    ];
    const clamped = [
        Math.min(360, Math.max(result[0], 0)),
        Math.min(100, Math.max(result[1], 0)),
        Math.min(100, Math.max(result[2], 0)),
    ];
    return `hsl(${clamped[0]}deg ${clamped[1]}% ${clamped[2]}%)`;
}
