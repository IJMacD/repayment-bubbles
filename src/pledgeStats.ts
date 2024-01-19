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

/**
 * Similar to calcAmountPledged but subtracts amount repaid
 * (Estimate)
 */
export function calcAmountUnrepaid (pledges: Pledge[]) {
    return pledges.reduce((total, pledge) => total + pledge.amount - (pledge.repaidFraction*pledge.amount||0), 0);
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

export function calcInterestPerDayContracted (pledges: Pledge[], now: number) {
    return pledges.reduce((total, pledge) => {
        const isLive = pledge.status === PledgeStatus.live || +pledge.endDate > now;

        if (!isLive) return 0;

        const isOverdue = +pledge.endDate > now;

        let interestRate = pledge.interestRate;
        if (isOverdue) {
            interestRate += 0.02;
        }

        const perDay = pledge.amount * interestRate / 365.25;

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

export function getLatestInterestRate (pledges: Pledge[]) {
    pledges.sort((a, b) => +a.startDate - +b.startDate);
    return pledges.at(-1)?.interestRate || 0;
}