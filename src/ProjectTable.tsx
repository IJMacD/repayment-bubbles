import { filterLivePledges, calcInterestPerDay, calcInterestPaid } from './pledgeStats';
import { Pledge, PledgeStatus } from './pledges';

export function ProjectTable ({ pledges, now }: { pledges: Pledge[], now: number }) {
    const projects = new Set(pledges.map(p => p.projectName));
    const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" });

    return (
        <table className="ProjectTable">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Invested Amount</th>
                    <th>Expected Interest</th>
                    <th>Paid Interest</th>
                    <th>A.P.R.</th>
                    <th>Interest per Day</th>
                    <th>Repaid Fraction</th>
                    {/* <th>Pledge Count</th> */}
                    <th>Pledges</th>
                </tr>
            </thead>
            <tbody>
            {
                [...projects].map(projectName => {
                    const projectPledges = pledges.filter(p => p.projectName === projectName);
                    const startedPledges = projectPledges.filter(p => +p.startDate < now);

                    if (startedPledges.length === 0) {
                        return null;
                    }

                    const totalAmount = startedPledges.reduce((total, pledge) => total + pledge.amount, 0);
                    const expectedInterest = startedPledges.reduce((total, pledge) => total + pledge.expectedInterest, 0);
                    const paidInterest = calcInterestPaid(startedPledges, now);
                    const aprInterest = startedPledges.reduce((total, pledge) => total + pledge.interestRate * pledge.amount, 0) / totalAmount;
                    const isOverdue = startedPledges.some(p => (+p.endDate < now) && p.status === PledgeStatus.live);

                    const livePledges = filterLivePledges(startedPledges, now);
                    const interestPerDay = calcInterestPerDay(livePledges);

                    const repaidPercent = expectedInterest > 0 ? `${(paidInterest / expectedInterest * 100).toFixed()}%` : 0;
                    // const pledgeCount = projectPledges.length;

                    return (
                        <tr key={projectName}>
                            <td style={{color:isOverdue?"red":"initial"}}>{projectName}</td>
                            <td style={{color:isOverdue?"red":"initial"}}>{currencyFormatter.format(totalAmount)}</td>
                            <td>{currencyFormatter.format(expectedInterest)}</td>
                            <td>{currencyFormatter.format(paidInterest)}</td>
                            <td>
                                {(aprInterest*100).toFixed(1)}%{' '}
                                { isOverdue && <span style={{color:"red"}}>{(aprInterest*100+2).toFixed(1)}%</span> }
                            </td>
                            <td>{interestPerDay > 0 ? currencyFormatter.format(interestPerDay) : null}</td>
                            <td><div title={repaidPercent||""} style={{height:8,width:repaidPercent,backgroundColor:"#333"}} /></td>
                            {/* <td>{pledgeCount}</td> */}

                            <td>{
                                projectPledges.map((p, i) => {
                                    const isStarted = +p.startDate < now;
                                    const isOverdue = (+p.endDate < now) && p.status === PledgeStatus.live;

                                    if (!isStarted) return null;

                                    return (
                                        <span key={i} style={{opacity:isStarted?1:0.5,color:isOverdue?"red":"initial",marginLeft:"0.25em"}}>
                                            {currencyFormatter.format(p.amount)}{' '}
                                                <span style={{fontSize: "0.7em"}}>@ {(p.interestRate*100).toFixed(1)}%</span>
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
