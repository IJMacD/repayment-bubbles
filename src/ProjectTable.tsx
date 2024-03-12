import React, { useContext, useState } from 'react';
import { filterLivePledges, calcInterestPaid, calcInterestPerDayContracted } from './pledgeStats';
import { Pledge, PledgeStatus } from './pledges';

export function ProjectTable({ pledges, now }: { pledges: Pledge[], now: number }) {
    const projectSet = new Set(pledges.map(p => p.projectName));
    const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" });

    const [sortColumn, setSortColumn] = useState("");
    const [sortOrder, setSortOrder] = useState(1);

    const projects = [...projectSet];

    function setSort(column: string) {
        if (sortColumn === column) {
            setSortOrder(order => order * -1);
        }
        else {
            setSortColumn(column);
        }
    }

    function getPledges(projectName: string) {
        const projectPledges = pledges.filter(p => p.projectName === projectName);
        const startedPledges = projectPledges.filter(p => +p.startDate < now);
        return startedPledges;
    }

    if (sortColumn === "name") {
        projects.sort((a, b) => sortOrder * a.localeCompare(b));
    }
    else if (sortColumn === "amount") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            return sortOrder * (getTotalAmount(aPledges) - getTotalAmount(bPledges));
        });
    }
    else if (sortColumn === "expectedInterest") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            return sortOrder * (getExpectedInterest(aPledges) - getExpectedInterest(bPledges));
        });
    }
    else if (sortColumn === "paidInterest") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            return sortOrder * (calcInterestPaid(aPledges, now) - calcInterestPaid(bPledges, now));
        });
    }
    else if (sortColumn === "apr") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            const aTotal = getTotalAmount(aPledges);
            const bTotal = getTotalAmount(bPledges);
            return sortOrder * (getAPR(aPledges, aTotal) - getAPR(bPledges, bTotal));
        });
    }
    else if (sortColumn === "interestPerDay") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            return sortOrder * (calcInterestPerDayContracted(aPledges, now) - calcInterestPerDayContracted(bPledges, now));
        });
    }
    else if (sortColumn === "pledgeCount") {
        projects.sort((a, b) => {
            const aPledges = getPledges(a);
            const bPledges = getPledges(b);
            return sortOrder * (aPledges.length - bPledges.length);
        });
    }

    return (
        <table className="ProjectTable">
            <SortableTableContext.Provider value={{ setSort, sortColumn, sortOrder }}>
                <thead>
                    <tr>
                        <SortableHeader name="name">Project Name</SortableHeader>
                        <SortableHeader name="amount">Invested Amount</SortableHeader>
                        <SortableHeader name="expectedInterest">Expected Interest</SortableHeader>
                        <SortableHeader name="paidInterest">Paid Interest</SortableHeader>
                        <SortableHeader name="apr">A.P.R</SortableHeader>
                        {/* <th>Interest per Day</th> */}
                        <SortableHeader name="interestPerDay">Interest per Day (Contracted)</SortableHeader>
                        <th>Repaid Fraction</th>
                        {/* <th>Pledge Count</th> */}
                        <SortableHeader name="pledgeCount">Pledges</SortableHeader>
                    </tr>
                </thead>
            </SortableTableContext.Provider>
            <tbody>
                {
                    projects.map(projectName => {
                        const startedPledges = getPledges(projectName);

                        if (startedPledges.length === 0) {
                            return null;
                        }

                        const totalAmount = getTotalAmount(startedPledges);
                        const expectedInterest = getExpectedInterest(startedPledges);
                        const paidInterest = calcInterestPaid(startedPledges, now);
                        const aprInterest = getAPR(startedPledges, totalAmount);
                        const isOverdue = startedPledges.some(p => (+p.endDate < now) && p.status === PledgeStatus.live);

                        const livePledges = filterLivePledges(startedPledges, now);
                        // const interestPerDay = calcInterestPerDay(livePledges);
                        const interestPerDayContracted = calcInterestPerDayContracted(livePledges, now);

                        const repaidPercent = expectedInterest > 0 ? `${(paidInterest / expectedInterest * 100).toFixed()}%` : 0;
                        const unrepaidPercent = expectedInterest > 0 ? `${((1 - paidInterest / expectedInterest) * 100).toFixed()}%` : 0;
                        // const pledgeCount = projectPledges.length;

                        return (
                            <tr key={projectName}>
                                <td style={{ color: isOverdue ? "red" : "initial" }}>{projectName}</td>
                                <td style={{ color: isOverdue ? "red" : "initial" }}>{currencyFormatter.format(totalAmount)}</td>
                                <td>{currencyFormatter.format(expectedInterest)}</td>
                                <td>{currencyFormatter.format(paidInterest)}</td>
                                <td>
                                    {(aprInterest * 100).toFixed(1)}%{' '}
                                    {isOverdue && <span style={{ color: "red" }}>{(aprInterest * 100 + 2).toFixed(1)}%</span>}
                                </td>
                                {/* <td>{interestPerDay > 0 ? currencyFormatter.format(interestPerDay) : null}</td> */}
                                <td>{interestPerDayContracted > 0 ? currencyFormatter.format(interestPerDayContracted) : null}</td>
                                <td style={{ display: "flex", padding: "10px 0 8px" }}>
                                    <div title={repaidPercent || ""} style={{ height: 8, width: repaidPercent, backgroundColor: repaidPercent === "100%" ? "#383" : "#333" }} />
                                    <div title={repaidPercent || ""} style={{ height: 8, width: unrepaidPercent, backgroundColor: isOverdue ? "#FDD" : "#DDD" }} />
                                </td>
                                {/* <td>{pledgeCount}</td> */}

                                <td>{
                                    startedPledges.map((p, i) => {
                                        const isStarted = +p.startDate < now;
                                        const isOverdue = (+p.endDate < now) && p.status === PledgeStatus.live;

                                        if (!isStarted) return null;

                                        return (
                                            <span key={i} style={{ opacity: isStarted ? 1 : 0.5, color: isOverdue ? "red" : "initial", marginLeft: "0.25em" }}>
                                                {currencyFormatter.format(p.amount)}{' '}
                                                <span style={{ fontSize: "0.7em" }}>@ {(p.interestRate * 100).toFixed(1)}%</span>
                                            </span>
                                        );
                                    })
                                }</td>
                            </tr>
                        );
                    })
                }
            </tbody>
        </table>
    );
}
function getAPR(startedPledges: Pledge[], totalAmount: number) {
    return startedPledges.reduce((total, pledge) => total + pledge.interestRate * pledge.amount, 0) / totalAmount;
}

function getExpectedInterest(startedPledges: Pledge[]) {
    return startedPledges.reduce((total, pledge) => total + pledge.expectedInterest, 0);
}

function getTotalAmount(startedPledges: Pledge[]) {
    return startedPledges.reduce((total, pledge) => total + pledge.amount, 0);
}

interface SortableTableContextValue {
    setSort: (name: string) => void;
    sortColumn: string;
    sortOrder: number;
}

const SortableTableContext = React.createContext({} as SortableTableContextValue);

interface SortableHeaderProps {
    name: string;
    children: React.ReactNode;
}

function SortableHeader({ name, children }: SortableHeaderProps) {
    const { setSort, sortColumn, sortOrder } = useContext(SortableTableContext);

    return (
        <th onClick={() => setSort(name)} style={{ cursor: "pointer" }}>
            {children}{' '}
            {name === sortColumn ? (sortOrder > 0 ? "▲" : "▼") : ""}
        </th>
    );
}
