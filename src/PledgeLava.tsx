import { CSSProperties, useEffect, useRef } from "react";
import { Pledge, PledgeStatus } from "./pledges";

interface PledgeLavaProps {
    pledges: Pledge[];
    now: number;
}

export const PledgeLava = PledgeLavaCanvas;

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

        // const maxVal = Object.values(buckets).reduce((max, pledges) => Math.max(max, pledges.reduce((total, pledge) => total + pledge.amount, 0)), 0);
        const maxVal = 7000;
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

        ctx.translate(0, barHeight/2);

        // Horizontal grid lines
        ctx.beginPath();
        for (let i = 0; i < bucketIndex.length; i++) {
            ctx.moveTo(0, barHeight*(i+0.5));
            ctx.lineTo(width, barHeight*(i+0.5));
        }
        ctx.strokeStyle = "#CCC";
        ctx.stroke();

        // Vertical grid lines
        ctx.beginPath();
        const cx = width / 2;
        for (let i = 0; i < maxVal/2; i += 1000) {
            ctx.moveTo(cx - i * context.xScale, -barHeight);
            ctx.lineTo(cx - i * context.xScale, height);
            ctx.moveTo(cx + i * context.xScale, -barHeight);
            ctx.lineTo(cx + i * context.xScale, height);
        }
        ctx.strokeStyle = "#CCC";
        ctx.stroke();

        // Overdue
        context.yOffset = drawBulges(ctx, buckets, minBucket, 0, context, "#F00") - barHeight;

        // Now line
        ctx.beginPath();
        ctx.moveTo(0, context.yOffset+barHeight/2);
        ctx.lineTo(width, context.yOffset+barHeight/2);
        ctx.strokeStyle = "#999";
        ctx.stroke();

        // Due
        drawBulges(ctx, buckets, 0, maxBucket, context, "#0C0");

    }, [pledges]);

    return <canvas ref={canvasRef} style={{display:"block", margin: "0 auto"}} />;
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

    if (widths.length < 2) {
        return 0;
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
        // ctx.lineTo(x, y);
        const prevX = i > 0 ? cx - widths[i-1]/2 : cx;
        const midY = y - barHeight / 2;
        ctx.bezierCurveTo(prevX, midY, x, midY, x, y);
        y += barHeight;
    }

    y -= 0.5 * barHeight;

    // Centre
    // ctx.lineTo(cx, y);
    let prevX = cx - widths[widths.length - 1]/2;
    let midY = y ;
    ctx.quadraticCurveTo(prevX, midY, cx, y);
    // ctx.bezierCurveTo(prevX, midY, x, midY, x, y);

    // Store for later
    let maxY = y;

    // Up right side
    y -= 0.5 * barHeight;
    for (let i = widths.length - 1; i >= 0; i--) {
        const barWidth = widths[i];
        const x = cx + barWidth / 2;
        const prevX = cx + widths[i+1]/2;
        const midY = y + barHeight / 2;
        if (i === widths.length - 1) {
            // ctx.lineTo(x, y);
            ctx.quadraticCurveTo(x, midY, x, y);
        }
        else {
            ctx.bezierCurveTo(prevX, midY, x, midY, x, y);
        }
        y -= barHeight;
    }

    ctx.fillStyle = fillColour;

    y += 0.5 * barHeight;
    // y = context.yOffset;

    // Centre
    // ctx.lineTo(cx, y);
    prevX = cx + widths[0]/2;
    midY = y ;
    ctx.quadraticCurveTo(prevX, midY, cx, y);
    // ctx.bezierCurveTo(prevX, midY, cx, midY, cx, y);

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
            const prefix = due < 0 && bucket === 0 ? "-" : "";
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

                    let label = (+bucket + 1) * 3;
                    if (bucket[0] === "-") {
                        label = (+bucket - 1) * 3;
                    }

                    return (
                        <div key={bucket} title={`${label} months £${total.toFixed(2)}`} style={barStyle}>
                            {`${label} months`}
                        </div>
                    );
                })
            }
        </div>
    );
}