import { Pledge, PledgeStatus } from './pledges';

export function ProjectTable ({ pledges, now }: { pledges: Pledge[], now: number }) {
    const projects = new Set(pledges.map(p => p.projectName));
    const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" });

    return (
        <table>
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Invested Amount</th>
                    <th>Pledges</th>
                </tr>
            </thead>
            <tbody>
            {
                [...projects].map(projectName => {
                    const projectPledges = pledges.filter(p => p.projectName === projectName);
                    const startedPledges = projectPledges.filter(p => +p.startDate < now);
                    const totalAmount = startedPledges.reduce((total, pledge) => total + pledge.amount, 0);
                    const isOverdue = startedPledges.some(p => (+p.endDate < now) && p.status === PledgeStatus.live);

                    if (startedPledges.length === 0) {
                        return null;
                    }

                    return (
                        <tr>
                            <td style={{color:isOverdue?"red":"initial"}}>{projectName}</td>
                            <td style={{color:isOverdue?"red":"initial"}}>{currencyFormatter.format(totalAmount)}</td>
                            <td>
                            {
                                projectPledges.map((p, i) => {
                                    const isStarted = +p.startDate < now;
                                    const isOverdue = (+p.endDate < now) && p.status === PledgeStatus.live;
                                    return <><span key={i} style={{opacity:isStarted?1:0.5,color:isOverdue?"red":"initial"}}>{currencyFormatter.format(p.amount)}</span>{' '}</>;
                                })
                            }
                            </td>
                        </tr>
                    );
                })
            }
            </tbody>
        </table>
    );
}