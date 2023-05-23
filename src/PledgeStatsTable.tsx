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
                </tr>
            </thead>
            <tbody>
                {
                    rows.map((row, i) => {
                        return (
                            <tr key={i}>
                                <td>{row.label}</td>
                                <td>{row.pledges.length}</td>
                                <td>{currencyFormatter.format(row.pledges.reduce((total, p) => total + p.amount, 0))}</td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
    )
}