export enum AxisType {
    Number,
    Date,
    Currency,
    Percent,
} ;

type LineGraphProps = {
    xMin: number;
    xMax: number;
    yValueFn: (x: number) => number;
    xAxisType?: AxisType;
    yAxisType?: AxisType;
    width?: number;
    height?: number;
};

const ONE_YEAR = 365.25 * 86400 * 1000;
const ONE_MONTH = ONE_YEAR / 12;

export function LineGraph (
    {
        xMin,
        xMax,
        yValueFn,
        xAxisType = AxisType.Number,
        yAxisType = AxisType.Number,
        width = 300,
        height = -1,
    }: LineGraphProps
) {
    const xRange = xMax - xMin;
    const pointCount = 100;
    const step = xRange / pointCount;

    if (height < 0) {
        height = width / 2;
    }

    const aspectRatio = width / height;

    const viewWidth = 300;
    const viewHeight = viewWidth / aspectRatio;
    const leftGutter = 50;
    const rightGutter = 50;
    const gutter = 10;

    const viewBox = `${-leftGutter} ${-gutter} ${viewWidth + leftGutter + rightGutter} ${viewHeight + gutter * 2}`

    const path = [];

    let yMin = 0;
    let yMax = 0;
    let yFinalValue = yValueFn(xMax);
    let yFinalValuePY;

    const gridLinesPath = [];
    const majorGridLinesPath = [];
    const majorLabels: [number, string][] = [];

    if (step > 0) {
        const xScale = viewWidth / xRange;

        const xValues = [];
        const yValues = [];

        for (let x = xMin; x <= xMax; x += step) {
            const y = yValueFn(x);
            yMin = Math.min(yMin, y);
            yMax = Math.max(yMax, y);
            xValues.push(x);
            yValues.push(y);
        }

        const yRange = yMax - yMin;

        if (yRange > 0) {
            const yScale = viewHeight / yRange;
            const xScale = viewWidth / xRange;

            yFinalValuePY = (yMax - yFinalValue) * yScale;

            for (let i = 0; i < xValues.length; i++) {
                const c = i === 0 ? "M" : "L";

                const px = (xValues[i] - xMin) * xScale;
                const py = (yMax - yValues[i]) * yScale;

                path.push(`${c} ${px} ${py}`);
            }
        }

        if (xAxisType === AxisType.Date) {
            const minOffset = xMin % ONE_MONTH;
            for (let x = xMin - minOffset + ONE_MONTH; x < xMax; x += ONE_MONTH) {

                const px = (x - xMin) * xScale;
                const d = `M ${px} 0 L ${px} ${viewHeight}`;
                if (x % ONE_YEAR) {
                    gridLinesPath.push(d);
                } else {
                    majorGridLinesPath.push(d);
                    majorLabels.push([px, new Date(x).getFullYear().toString()]);
                }
            }
        }
    }

    let yMinLabel = yMin.toString();
    let yMaxLabel = yMax.toString();
    let yFinalLabel = yFinalValue.toString();

    if (yAxisType === AxisType.Currency) {
        const currencyFormatter = new Intl.NumberFormat([], { style: "currency", currency: "GBP" });
        yMinLabel = currencyFormatter.format(yMin);
        yMaxLabel = currencyFormatter.format(yMax);
        yFinalLabel = currencyFormatter.format(yFinalValue);
    }
    else if (yAxisType === AxisType.Percent) {
        yMinLabel = (yMin * 100).toFixed(1) + "%";
        yMaxLabel = (yMax * 100).toFixed(1) + "%";
        yFinalLabel = (yFinalValue * 100).toFixed(1) + "%";
    }

    return (
        <svg viewBox={viewBox} width={width} height={height}>
            <rect x={0} y={0} width={viewWidth} height={viewHeight} fill="none" stroke="#999" />
            <path d={gridLinesPath.join(" ")} fill="none" stroke="#CCC" strokeWidth={0.5} />
            <path d={majorGridLinesPath.join(" ")} fill="none" stroke="#999" strokeWidth={1} />
            <path d={path.join(" ")} fill="none" stroke="red" />
            <text x={-2} y={0} textAnchor="end" style={{fontSize:9}}>{yMaxLabel}</text>
            <text x={-2} y={viewHeight} textAnchor="end" style={{fontSize:9}}>{yMinLabel}</text>
            <text x={viewWidth+2} y={yFinalValuePY} textAnchor="start" style={{fontSize:9}}>{yFinalLabel}</text>
            {
                majorLabels.map(([px,label], i) => <text key={i} x={px} y={viewHeight+10} style={{fontSize:9}}>{label}</text>)
            }
        </svg>
    );
}