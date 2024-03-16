import { AxisType } from "./LineGraph";

type LineGraphProps = {
    values: number[];
    bucketSize: number;
    xAxisType?: AxisType;
    width?: number;
    height?: number;
    proportionalMode?: boolean;
};


export function Histogram(
    {
        values,
        bucketSize,
        xAxisType = AxisType.Number,
        width = 300,
        height = NaN,
        proportionalMode = false,
    }: LineGraphProps
) {
    const buckets = [];
    let xMin = 0;
    let xMax = 0;

    for (const value of values) {
        const bucketIndex = Math.floor(value / bucketSize);

        if (!buckets[bucketIndex]) {
            buckets[bucketIndex] = 0;
        }

        if (proportionalMode) {
            buckets[bucketIndex] += value / Math.max(bucketSize, bucketIndex * bucketSize);
        }
        else {
            buckets[bucketIndex] += value;
        }

        xMax = Math.max(xMax, bucketIndex);
    }

    if (isNaN(height)) {
        height = width / 2;
    }

    const aspectRatio = width / height;

    const viewWidth = 300;
    const viewHeight = viewWidth / aspectRatio;
    const leftGutter = 50;
    const rightGutter = 50;
    const gutter = 10;

    const viewBox = `${-leftGutter} ${-gutter} ${viewWidth + leftGutter + rightGutter} ${viewHeight + gutter * 2}`

    const yMin = 0;
    const yMax = Math.max(...buckets.filter(x => x));

    const minorGridLinesPath = [];
    const xAxisLabels: string[][] = [];

    const xRange = xMax - xMin;

    let xScale = viewWidth / (xRange + 1);

    if (proportionalMode) {
        /*
        Proportional Mode: Triangle numbers
                        (n * (n + 1))/2
        100     100     (1 * 2)/2 = 1
        200     300     (2 * 3) / 2 = 3
        300     600     (3 * 4) / 2 = 6
        400     1000
        500     1500
        */
        const t = xMax + 1;
        const triangleNumber = t * (t + 1) / 2;

        xScale = viewWidth / (triangleNumber * bucketSize);
    }

    const yRange = yMax - yMin;

    let yScale = 0;
    let minorGridLineInterval = 1000;

    if (proportionalMode) {
        minorGridLineInterval = 10;
    }

    if (xRange > 0 && yRange > 0) {
        yScale = viewHeight / yRange;

        for (let yVal = 0; yVal <= yMax; yVal += minorGridLineInterval) {
            const y = yVal * yScale;
            minorGridLinesPath.push(`M 0 ${viewHeight - y} H ${viewWidth}`);
        }
    }

    let yMinLabel = yMin.toFixed(0);
    let yMaxLabel = yMax.toFixed(0);

    if (xAxisType === AxisType.Currency) {
        const currencyFormatter = new Intl.NumberFormat([], { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
        for (let bucketIndex = 0; bucketIndex <= xMax; bucketIndex++) {
            xAxisLabels.push([
                `[${currencyFormatter.format(bucketIndex * bucketSize)} -`,
                `${currencyFormatter.format((bucketIndex + 1) * bucketSize)})`,
            ]);
        }

        if (!proportionalMode) {
            yMinLabel = currencyFormatter.format(yMin);
            yMaxLabel = currencyFormatter.format(yMax);
        }
    }
    // else if (yAxisType === AxisType.Percent) {
    //     yMinLabel = (yMin * 100).toFixed(1) + "%";
    //     yMaxLabel = (yMax * 100).toFixed(1) + "%";
    //     yFinalLabel = (yFinalValue * 100).toFixed(1) + "%";
    // }

    if (proportionalMode) {
        yMinLabel = `${yMin.toFixed(1)}×`;
        yMaxLabel = `${yMax.toFixed(1)}×`;
    }

    return (
        <svg viewBox={viewBox} width={width} height={height}>
            {/* <rect x={0} y={0} width={viewWidth} height={viewHeight} fill="none" stroke="#999" /> */}
            <path d={minorGridLinesPath.join(" ")} fill="none" stroke="#CCC" strokeWidth={0.5} />
            <path d={`M 0 0 V ${viewHeight} H ${viewWidth}`} fill="none" stroke="#999" strokeWidth={1} />
            {buckets.map((count, bucketIndex) => {
                let x = bucketIndex * xScale;
                let width = xScale;

                if (proportionalMode) {
                    const t = bucketIndex
                    const triangleNumber = t * (t + 1) / 2;

                    x = triangleNumber * bucketSize * xScale;
                    width = (bucketIndex + 1) * bucketSize * xScale;
                }

                let height = count * yScale;
                let y = viewHeight - height;

                return (
                    <rect x={x} y={y} width={width} height={height} fill="red" />
                );
            })}
            <text x={-2} y={0} textAnchor="end" style={{ fontSize: 9 }}>{yMaxLabel}</text>
            <text x={-2} y={viewHeight} textAnchor="end" style={{ fontSize: 9 }}>{yMinLabel}</text>
            {/* <text x={viewWidth+2} y={yFinalValuePY} textAnchor="start" style={{fontSize:9}}>{yFinalLabel}</text> */}
            {
                xAxisLabels.map((labelLines, i) => {
                    let x = (i + 0.5) * xScale;
                    if (proportionalMode) {
                        const t = i + 0.5
                        const triangleNumber = t * (t + 1) / 2;

                        x = triangleNumber * bucketSize * xScale;
                    }

                    return (
                        <text key={i} x={x} y={viewHeight + 10} style={{ fontSize: 4 }} textAnchor="middle">
                            {labelLines.map((line, j) => <tspan key={j} x={x} dy={j * 5}>{line}</tspan>)}
                        </text>
                    );
                })
            }
        </svg>
    );
}