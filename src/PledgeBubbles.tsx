import { Pledge, PledgeStatus } from "./pledges";

export function PledgeBubbles ({ pledges, pendingTotal, now, isPrescient = false }: { pledges: Pledge[], pendingTotal: number, now: number, isPrescient: boolean }) {
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

        const isOverdue = isPrescient ?
            pledge.status === PledgeStatus.live && (+pledge.endDate < Date.now()) :
            actualFraction > 1;

        if (actualFraction > 1 && (!isOverdue && !isUnfinished)) {
            continue;
        }

        const ring = makeRing(i, duration);

        rings.push(ring);
        bubbles.push(<ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill={isUnfinished ? "lightgrey" : (isOverdue ? "red" : "green")} stroke={isUnfinished ? "darkgrey" : (isOverdue ? "darkred" : "darkgreen")} strokeWidth={interestAmount}><title>{pledge.projectName}{"\n"}{(pledge.interestRate*100).toFixed(1)}%</title></ellipse>);

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
