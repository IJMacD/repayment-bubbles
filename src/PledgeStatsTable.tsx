import { Pledge } from "./pledges";

export function PledgeStatsTable ({ rows }: { rows: { label: string, pledges: Pledge[] }[]}) {
    const currencyFormatter = new Intl.NumberFormat(undefined, { "style": "currency", "currency": "GBP" });

    return (
        <table>
            <thead>
                <tr>
                    <th>Label</th>
                    <th>Count</th>
                    <th>Amount</th>
                    <th>Interest</th>
                    <th>Interest Paid</th>
                    <th>Interest Rate</th>
                </tr>
            </thead>
            <tbody>
                {
                    rows.map((row, i) => {
                        const sumAmount = row.pledges.reduce((total, p) => total + p.amount, 0);
                        const sumInterest = row.pledges.reduce((total, p) => total + p.expectedInterest, 0);
                        const sumPaidInterest = row.pledges.reduce((total, p) => total + p.paidInterest, 0);
                        const aprInterest = row.pledges.reduce((total, p) => total + p.interestRate * p.amount, 0);
                        const avgInterest = aprInterest / sumAmount;

                        return (
                            <tr key={i}>
                                <td>{row.label}</td>
                                <td>{row.pledges.length}</td>
                                <td>{currencyFormatter.format(sumAmount)}</td>
                                <td>{currencyFormatter.format(sumInterest)}</td>
                                <td>{currencyFormatter.format(sumPaidInterest)}</td>
                                <td>{isNaN(avgInterest)?"":`${(avgInterest*100).toFixed(1)}%`}</td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
    )
}