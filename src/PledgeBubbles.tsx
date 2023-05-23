import { Pledge } from "./pledges";

export function PledgeBubbles ({ pledges, overdueTotal, pendingTotal, now }: { pledges: Pledge[], overdueTotal: number, pendingTotal: number, now: number }) {
    const rings = [];
    const bubbles = [];

    const AMOUNT_SCALE = 5e-1;
    const ORBIT_SCALE = 5e-9;
    const ONE_YEAR = 365.25 * 86400 * 1000;
    const ONE_MONTH = ONE_YEAR / 12;

    let i = 0;

    const WIDTH = 1000;
    const HEIGHT = 1000;
    const MARGIN = 100;

    const cx = WIDTH / 2;

    for (const pledge of pledges) {
        const duration = +pledge.endDate - +pledge.startDate;
        const orbitRadius = duration * ORBIT_SCALE;
        const cy = MARGIN + orbitRadius;
        const actualDuration = now - +pledge.startDate;
        const durationFraction = Math.min(actualDuration / duration, 1);
        const theta = durationFraction * Math.PI * 2;
        const x = cx + orbitRadius * Math.sin(theta);
        const y = cy - orbitRadius * Math.cos(theta);
        const interestAmount = pledge.amount * pledge.interestRate * actualDuration / ONE_YEAR * 5e-2;
        const r = Math.sqrt(pledge.amount) * AMOUNT_SCALE;

        const isOverdue = actualDuration > duration;

        rings.push(<ellipse key={i} cx={500} cy={cy} rx={orbitRadius} ry={orbitRadius} stroke="rgba(255,255,255,0.1)" fill="none" />);
        bubbles.push(<ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill={isOverdue ? "red" : "green"} stroke={isOverdue ? "darkred" : "darkgreen"} strokeWidth={interestAmount}><title>{pledge.projectName}{"\n"}{(pledge.interestRate*100).toFixed(1)}%</title></ellipse>);

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
        "Two Years": ONE_YEAR  *2,
    };

    return <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <ellipse cx={overdueX} cy={overdueY} rx={overdueRadius} ry={overdueRadius} fill="red" />
        <ellipse cx={pendingX} cy={pendingY} rx={pendingRadius} ry={pendingRadius} fill="green" />
        <path d={ markerPath } stroke="rgba(255,255,255,0.1)" fill="none" />
        {
            Object.entries(labels).map(([label, value]) => {
                const radius = value * ORBIT_SCALE;
                const y = MARGIN + radius * 2;
                return <text key={label} x={500} y={y} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={10}>{label}</text>;
            })
        }
        { rings }
        { bubbles }
    </svg>;
}