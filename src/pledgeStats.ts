import { Pledge, PledgeStatus } from "./pledges";

const ONE_DAY = 86400 * 1000;

export function filterLivePledges (pledges: Pledge[], now: number) {
    return pledges.filter(p => {
        const start = +p.startDate;
        const end = +p.endDate;
        return start <= now && (now < end || p.status === PledgeStatus.live);
    });
}

export function calcAmountPledged (pledges: Pledge[]) {
    return pledges.reduce((total, pledge) => total + pledge.amount, 0);
}

export function calcAvgInterestRate (pledges: Pledge[]) {
    const sumAmount = pledges.reduce((total, p) => total + p.amount, 0);
    const aprInterest = pledges.reduce((total, p) => total + p.interestRate * p.amount, 0);
    return aprInterest / sumAmount;
}

export function calcInterestPerDay (pledges: Pledge[]) {
    return pledges.reduce((total, pledge) => {
        const effectiveEnd = Math.min(+pledge.endDate, Date.now());
        const duration = effectiveEnd - +pledge.startDate;
        const perDay = pledge.paidInterest / duration * ONE_DAY;
        return total + perDay;
    }, 0);
}

export function calcInterestPaid(pledges: Pledge[], now: number) {
    return pledges.reduce((total, pledge) => {
        const start = +pledge.startDate;
        const end = +pledge.endDate;
        const effectiveEnd = Math.min(end, Date.now());
        const projectProgress = Math.min(1, (now - start) / (effectiveEnd - start));
        return total + projectProgress * pledge.paidInterest;
    }, 0);
}