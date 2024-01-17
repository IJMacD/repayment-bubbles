import { CSSProperties, useEffect, useRef } from "react";
import { Pledge, PledgeStatus } from "./pledges";

interface PledgeLavaProps {
    pledges: Pledge[];
    now: number;
}

export const PledgeLava = PledgeLavaBasic;

export function PledgeLavaCanvas ({ pledges, now }: PledgeLavaProps) {
    const canvasRef: React.MutableRefObject<HTMLCanvasElement|null> = useRef(null);

    useEffect(() => {

        const bucketSize = 3 * (365.25/12) * 86400 * 1000; // 3 months
        const buckets: { [bucket: string]: Pledge[] } = {};
        let minBucket = Number.POSITIVE_INFINITY;
        let maxBucket = Number.NEGATIVE_INFINITY;

        for (const pledge of pledges) {
            const due = +pledge.endDate - now;
            if (due > 0 || pledge.status === PledgeStatus.live) {
                const bucket = Math.floor(due/bucketSize);
                if (bucket < minBucket) minBucket = +bucket;
                if (bucket > maxBucket) maxBucket = +bucket;
                if (!buckets[bucket]) buckets[bucket] = [];
                buckets[bucket].push(pledge);
            }
        }

        const bucketIndex: string[] = [];
        for (let i = maxBucket; i >= 0; i--) {
            bucketIndex.push(i.toString());
        }
        for (let i = 0; i >= minBucket; i--) {
            // ensure preservation of negative 0
            bucketIndex.push(`-${Math.abs(i)}`);
        }
        bucketIndex.reverse();

        const maxVal = 6000;
        const width = 300;
        const barHeight = 20;
        const height = bucketIndex.length * barHeight;

        const ctx = canvasRef.current?.getContext("2d");

        if (!ctx) {
            return;
        }

        ctx.canvas.width = width;
        ctx.canvas.height = height;

        const context = {
            width,
            height,
            yOffset: 0,
            xScale: width / maxVal,
            barHeight,
        };

        // Overdue
        context.yOffset = drawBulges(ctx, buckets, minBucket, 0, context, "#F00");
        // Due
        drawBulges(ctx, buckets, 0, maxBucket, context, "#0C0");

    }, [pledges]);

    return <canvas ref={canvasRef} />;
}

function drawBulges(
    ctx: CanvasRenderingContext2D,
    buckets: { [bucket: string]: Pledge[]; },
    startBucket: number,
    endBucket: number,
    context: {
        yOffset: number,
        width: number,
        height: number,
        xScale: number,
        barHeight: number,
    },
    fillColour: string
) {
    const widths = [];

    const { width, barHeight, yOffset, xScale } = context;

    const cx = width / 2;

    for (let i = startBucket; i <= endBucket; i++) {
        const pledges = buckets[i] || [];
        const total = pledges.reduce((total, pledge) => pledge.amount + total, 0);

        widths.push(total * xScale);
    }

    ctx.beginPath();

    let y = yOffset;

    // Centre
    ctx.moveTo(cx, y);

    // Down left side
    y += 0.5 * barHeight;
    for (let i = 0; i < widths.length; i++) {
        const barWidth = widths[i];
        const x = cx - barWidth / 2;
        ctx.lineTo(x, y);
        y += barHeight;
    }

    y -= 0.5 * barHeight;

    // Centre
    ctx.lineTo(cx, y);

    let maxY = y;

    // Up right side
    y -= 0.5 * barHeight;
    for (let i = widths.length - 1; i >= 0; i--) {
        const barWidth = widths[i];
        const x = cx + barWidth / 2;
        ctx.lineTo(x, y);
        y -= barHeight;
    }

    ctx.fillStyle = fillColour;

    y += 0.5 * barHeight;
    // Centre
    ctx.lineTo(cx, y);

    ctx.fill();

    return maxY;
}

export function PledgeLavaBasic ({ pledges, now }: PledgeLavaProps) {
    const bucketSize = 3 * (365.25/12) * 86400 * 1000; // 3 months
    const buckets: { [bucket: string]: Pledge[] } = {};
    let minBucket = Number.POSITIVE_INFINITY;
    let maxBucket = Number.NEGATIVE_INFINITY;

    for (const pledge of pledges) {
        const due = +pledge.endDate - now;
        if (due > 0 || pledge.status === PledgeStatus.live) {
            const bucket = Math.trunc(due/bucketSize);
            if (+bucket < minBucket) minBucket = +bucket;
            if (+bucket > maxBucket) maxBucket = +bucket;
            // Preserve negative zero
            const prefix = due > 0 && bucket === 0 ? "-" : "";
            const bucketID = prefix + bucket;
            if (!buckets[bucketID]) buckets[bucketID] = [];
            buckets[bucketID].push(pledge);
        }
    }

    const bucketIndex: string[] = [];
    for (let i = maxBucket; i >= 0; i--) {
        bucketIndex.push(i.toString());
    }
    for (let i = 0; i >= minBucket; i--) {
        bucketIndex.push(`-${Math.abs(i)}`);
    }
    bucketIndex.reverse();

    const maxVal = 6000;
    const barWidth = 300;

    return (
        <div>
            {
                bucketIndex.map(bucket => {
                    const pledges = buckets[bucket] || [];
                    const total = pledges.reduce((total, pledge) => pledge.amount + total, 0);
                    const frac = total / maxVal;
                    const isOverdue = bucket[0] === "-";

                    const barStyle: CSSProperties = {
                        height: 20,
                        width: barWidth * frac,
                        backgroundColor: isOverdue ? "#F00" : "#0C0",
                        margin: "0 auto",
                        borderRadius: 10,
                        color: "#DDD",
                        textAlign: "center",
                        fontSize: 8,
                        lineHeight: "20px",
                        overflow: "hidden"
                    };

                    return (
                        <div key={bucket} title={`${(+bucket+1) * 3} months £${total.toFixed(2)}`} style={barStyle}>
                            {`${(+bucket+1) * 3} months`}
                        </div>
                    );
                })
            }
        </div>
    );
}