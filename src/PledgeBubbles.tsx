import { ColourMode } from "./ColourMode";
import { Pledge, PledgeStatus } from "./pledges";

export function PledgeBubbles ({ pledges, pendingTotal, now, colourMode }: { pledges: Pledge[], pendingTotal: number, now: number, colourMode: ColourMode }) {
    const rings = [];
    const bubbles = [];

    const ACCUMULATE_OVERDUE = false;

    const AMOUNT_SCALE = 5e-1;
    const ORBIT_SCALE = 5e-9;
    const ONE_YEAR = 365.25 * 86400 * 1000;
    const ONE_MONTH = ONE_YEAR / 12;

    let i = 0;

    const WIDTH = 1000;
    const HEIGHT = 1000;
    const MARGIN = 100;

    const cx = WIDTH / 2;

    function makeRing (i: number, duration: number) {
        const orbitRadius = duration * ORBIT_SCALE;
        const cy = MARGIN + orbitRadius;

        return <ellipse key={i} cx={500} cy={cy} rx={orbitRadius} ry={orbitRadius} className="age-rings" fill="none" />;
    }

    function calcPosition (start: number, end: number) {
        const duration = Math.abs(end - start);
        const orbitRadius = duration * ORBIT_SCALE;
        const cy = MARGIN + orbitRadius;
        const actualDuration = now - start;
        const actualFraction = actualDuration / duration;
        const durationFraction = Math.min(actualFraction, 1);
        const theta = durationFraction * Math.PI * 2;
        const x = (actualFraction < 1) ?
            cx + orbitRadius * Math.sin(theta)
            : cx + (now - end) * ORBIT_SCALE;
        const y = (actualFraction < 1) ?
            cy - orbitRadius * Math.cos(theta)
            : MARGIN;

        return [x, y];
    }

    function getColour (colourMode: ColourMode, pledge: Pledge) {
        if (colourMode === ColourMode.Solid) {
            return [ "green", "darkgreen" ];
        }

        if (colourMode === ColourMode.Overdue) {
            const isUnfinished = +pledge.endDate > Date.now();
            const isOverdue = pledge.status === PledgeStatus.live && +pledge.endDate < Date.now();

            return [
                isUnfinished ? "lightgrey" : (isOverdue ? "red" : "green"),
                isUnfinished ? "darkgrey" : (isOverdue ? "darkred" : "darkgreen")
            ];
        }

        if (colourMode === ColourMode.Interest) {
            const minInterest = 0.06;
            const maxInterest = 0.11;
            const x = (pledge.interestRate - minInterest) / (maxInterest - minInterest);
            const fill = colourInterpolateHSL(x, "hsl(0deg 100% 50%)", "hsl(240deg 100% 50%)");

            return [fill, "#000"];
        }

        if (colourMode === ColourMode.Name) {
            const minChar = "0".charCodeAt(0);
            const maxChar = "Z".charCodeAt(0);
            const x = (pledge.projectName.charCodeAt(0) - minChar) / (maxChar - minChar);
            const fill = colourInterpolateHSL(x, "hsl(0deg 100% 50%)", "hsl(240deg 100% 50%)");

            return [fill, "#000"];
        }

        if (colourMode === ColourMode.Age) {
            const minAge = Date.now() - ONE_YEAR * 3;
            const maxAge = Date.now();
            const x = (+pledge.startDate - minAge) / (maxAge - minAge);
            const fill = colourInterpolateHSL(x, "hsl(0deg 100% 50%)", "hsl(240deg 100% 50%)");

            return [fill, "#000"];
        }

        if (colourMode === ColourMode.Repaid) {
            const fill = colourInterpolateHSL(pledge.repaidFraction, "hsl(0deg 100% 50%)", "hsl(240deg 100% 50%)");

            return [fill, "#000"];
        }

        return [];
    }

    const formatter = Intl.NumberFormat([], { style: "currency", currency: "GBP" })

    for (const pledge of pledges) {
        const start = +pledge.startDate;
        const end = +pledge.endDate;

        const [x, y] = calcPosition(start, end);

        const duration = Math.abs(end - start);
        const actualDuration = now - start;
        const actualFraction = actualDuration / duration;

        const interestAmount = pledge.amount * pledge.interestRate * actualFraction / ONE_YEAR * 5e-2;
        const r = Math.sqrt(pledge.amount) * AMOUNT_SCALE;

        const isUnfinished = end > Date.now();

        const isOverdue = pledge.status === PledgeStatus.live && +pledge.endDate < now;

        if (actualFraction > 1 && (!isOverdue && !isUnfinished)) {
            continue;
        }

        const ring = makeRing(i, duration);

        const [ fill, stroke ] = getColour(colourMode, pledge);

        rings.push(ring);
        bubbles.push(
            <ellipse
                key={i}
                cx={x} cy={y}
                rx={r} ry={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={interestAmount}
            >
                <title>{pledge.projectName}{"\n"}{formatter.format(pledge.amount)} {(pledge.interestRate*100).toFixed(1)}%</title>
            </ellipse>
        );

        i++;
    }

    const markerPath = Array.from({length: 26}).map((_, i) => {
        const w = 10;
        const x = cx - w / 2;
        const value = i * ONE_MONTH;
        const radius = value * ORBIT_SCALE;
        const y = MARGIN + radius * 2;
        return `M ${x} ${y} h ${w}`;
    }).join(" ");

    const overdueTotal = ACCUMULATE_OVERDUE ?
        pledges.filter(p => +p.endDate > Date.now()).reduce((total, p) => total + p.amount, 0)
        : 0;

    const overdueRadius = Math.sqrt(overdueTotal) * AMOUNT_SCALE;
    const overdueX = cx - overdueRadius;
    const overdueY = MARGIN - overdueRadius;

    const pendingRadius = Math.sqrt(pendingTotal) * AMOUNT_SCALE;
    const pendingX = cx + pendingRadius;
    const pendingY = MARGIN - pendingRadius;

    const labels = {
        "Three Months": ONE_YEAR * 0.25,
        "Six Months": ONE_YEAR * 0.5,
        "One Year": ONE_YEAR,
        "Eighteen Months": ONE_YEAR * 1.5,
        "Two Years": ONE_YEAR * 2,
    };

    const realNow = Date.now();

    const maxSpiral = ONE_YEAR * 3;

    const spiralLengths = Array.from({length:100}).map((_,i,a)=>maxSpiral*Math.pow(i/(a.length-1),2));

    const sweepPositions = spiralLengths.map(duration => {
        const start = Math.min(realNow - duration, now);
        return calcPosition(start, realNow);
    });

    const nowSweepPath = sweepPositions.reduce((path, p, i) => path += `${i===0?"M":" L"} ${p[0]} ${p[1]}`, "");

    return <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <ellipse cx={overdueX} cy={overdueY} rx={overdueRadius} ry={overdueRadius} fill="red" />
        { !isNaN(pendingX) && <ellipse cx={pendingX} cy={pendingY} rx={pendingRadius} ry={pendingRadius} fill="green" /> }
        <path d={ markerPath } className="age-rings" fill="none" />
        <path d={ nowSweepPath } stroke="rgba(128,128,255,0.5)" fill="none" />
        {
            Object.entries(labels).map(([label, value]) => {
                const radius = value * ORBIT_SCALE;
                const y = MARGIN + radius * 2;
                return <text key={label} x={500} y={y} textAnchor="middle" className="age-label" fontSize={10}>{label}</text>;
            })
        }
        {
            Object.values(labels).map((d, i) => makeRing(i, d))
        }
        {/* { rings } */}
        { bubbles }
    </svg>;
}


function colourInterpolateHex (x: number, start: string, end: string) {
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

function colourInterpolateHSL (x: number, start: string, end: string) {
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