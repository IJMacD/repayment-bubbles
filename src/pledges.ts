export enum PledgeStatus {
    unknown,
    pending,
    live,
    completed,
}

export interface Pledge {
    projectName: string;
    amount: number;
    /** As raw fraction, not percent */
    interestRate: number;
    expectedInterest: number,
    repaidFraction: number;
    status: PledgeStatus;
    startDate: Date,
    endDate: Date,
}

export function parsePledges (data: { [key: string]: string }[]): Pledge[] {
    return data.filter(data => data["Loan Start"] != "N/A").map(data => ({
        projectName: data["Project"],
        amount: +data["Amount"],
        interestRate: parseFloat(data["Interest Rate"]) / 100,
        expectedInterest: parseFloat(data["Expected Interest"]),
        repaidFraction: parseFloat(data["Interest Paid"]) / parseFloat(data["Expected Interest"]),
        status: parseStatus(data["Status"]),
        startDate: parseDate(data["Loan Start"]),
        endDate: parseDate(data["Loan End"]),
    }));
}

function parseStatus (text: string) {
    if (text === "Live" || text === "Partially Repaid")
        return PledgeStatus.live;

    if (text === "Loan not yet started")
        return PledgeStatus.pending;

    if (text === "Paid Back")
        return PledgeStatus.completed;

    return PledgeStatus.unknown;
}

function parseDate (text: string) {
    const [, d, m, y ] = text.match(/(\d{2})\/(\d{2})\/(\d{4})/) || [];
    if (typeof d === "undefined") {
        throw Error("Unable to parse date: " + text);
    }
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
}