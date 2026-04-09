import { THEME } from '../theme.js';
import type { Threat, Recommendation } from '../../../contracts/contracts.js';
import { STRIDE_LABELS, MITIGATION_STYLES, RISK_STYLES } from './threat-types.js';

const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    color: THEME.colors.foreground,
    borderBottom: `1px solid ${THEME.colors.border}`,
    lineHeight: '1.5',
};

function MitigationBadge({ status }: { status: Threat['mitigation-status'] }) {
    const style = MITIGATION_STYLES[status];
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                background: style.background,
                color: style.color,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
            {status}
        </span>
    );
}

function TableRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <tr>
            <td style={{ ...tdStyle, width: '40%', fontWeight: 600, color: THEME.colors.muted, fontSize: '12px' }}>{label}</td>
            <td style={tdStyle}>{children}</td>
        </tr>
    );
}

export function ThreatDetail({ threat, recommendations }: { threat: Threat; recommendations?: Recommendation[] }) {
    const strideInfo = STRIDE_LABELS[threat['stride-category']];
    const riskStyle = RISK_STYLES[threat.risk];
    const relatedRecs = recommendations?.filter((r) => r.threats?.includes(threat.id)) ?? [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
                style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${THEME.colors.border}`,
                    background: THEME.colors.backgroundSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MitigationBadge status={threat['mitigation-status']} />
                    <span style={{ fontSize: '12px', color: THEME.colors.muted, fontFamily: 'monospace' }}>
                        {threat.id}
                    </span>
                </div>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: riskStyle.background,
                        color: riskStyle.color,
                        textTransform: 'uppercase',
                    }}
                >
                    {threat.risk} risk
                </span>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                        <TableRow label="STRIDE Category">
                            <span>{strideInfo.emoji} {strideInfo.label}</span>
                        </TableRow>
                        <TableRow label="Description">
                            <span>{threat.description}</span>
                        </TableRow>
                        {threat['trust-boundary'] && (
                            <TableRow label="Trust Boundary">
                                <span style={{ fontFamily: 'monospace' }}>{threat['trust-boundary']}</span>
                            </TableRow>
                        )}
                        {threat['existing-controls'] && threat['existing-controls'].length > 0 && (
                            <TableRow label="Existing Controls">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {threat['existing-controls'].map((ctrl) => (
                                        <span
                                            key={ctrl}
                                            style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: THEME.colors.backgroundSecondary,
                                                border: `1px solid ${THEME.colors.border}`,
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {ctrl}
                                        </span>
                                    ))}
                                </div>
                            </TableRow>
                        )}
                        {threat.notes && (
                            <TableRow label="Notes">
                                <span>{threat.notes}</span>
                            </TableRow>
                        )}
                    </tbody>
                </table>

                {relatedRecs.length > 0 && (
                    <>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: THEME.colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Recommendations
                        </div>
                        {relatedRecs.map((rec) => {
                            const priStyle = RISK_STYLES[rec.priority];
                            return (
                                <div
                                    key={rec.id}
                                    style={{
                                        padding: '12px',
                                        background: THEME.colors.backgroundSecondary,
                                        borderRadius: '6px',
                                        border: `1px solid ${THEME.colors.border}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: THEME.colors.muted }}>{rec.id}</span>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                background: priStyle.background,
                                                color: priStyle.color,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: THEME.colors.foreground }}>{rec.description}</div>
                                    {rec.implementation && (
                                        <div style={{ fontSize: '12px', color: THEME.colors.muted, fontStyle: 'italic' }}>
                                            {rec.implementation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
