import { THEME } from '../theme.js';
import type { ThreatModelDecorator } from '../../../contracts/contracts.js';
import { countByMitigation, MITIGATION_STYLES, RISK_STYLES } from './threat-types.js';

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: THEME.colors.card,
                borderRadius: '6px',
                border: `1px solid ${THEME.colors.border}`,
                minWidth: '76px',
                gap: '4px',
            }}
        >
            <span style={{ fontSize: '20px', fontWeight: 700, color: accent ?? THEME.colors.foreground, lineHeight: 1 }}>
                {value}
            </span>
            <div style={{ fontSize: '10px', fontWeight: 600, color: THEME.colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </div>
        </div>
    );
}

export function ThreatSummarySection({ decorator }: { decorator: ThreatModelDecorator }) {
    const summary = decorator.data.summary;
    const threats = decorator.data.threats ?? [];
    const counts = countByMitigation(threats);
    const riskStyle = RISK_STYLES[summary['overall-risk']];

    return (
        <div
            style={{
                padding: '12px 14px',
                borderBottom: `1px solid ${THEME.colors.border}`,
                background: THEME.colors.backgroundSecondary,
                display: 'flex',
                gap: '8px',
                alignItems: 'stretch',
                flexWrap: 'wrap',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: riskStyle.background,
                    borderRadius: '6px',
                    border: `1px solid ${riskStyle.color}40`,
                    minWidth: '100px',
                    gap: '4px',
                }}
            >
                <span style={{ fontSize: '16px', fontWeight: 700, color: riskStyle.color, textTransform: 'uppercase' }}>
                    {summary['overall-risk']}
                </span>
                <div style={{ fontSize: '10px', fontWeight: 600, color: riskStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Overall Risk
                </div>
            </div>

            <StatCard label="Total Threats" value={summary['total-threats']} />
            <StatCard label="Unmitigated" value={counts.unmitigated} accent={MITIGATION_STYLES.unmitigated.color} />
            <StatCard label="Partial" value={counts.partial} accent={MITIGATION_STYLES.partial.color} />
            <StatCard label="Mitigated" value={counts.mitigated} accent={MITIGATION_STYLES.mitigated.color} />

            <div style={{ width: '1px', background: THEME.colors.border, alignSelf: 'stretch', margin: '0 4px' }} />

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: THEME.colors.card,
                    borderRadius: '6px',
                    border: `1px solid ${THEME.colors.border}`,
                    gap: '4px',
                    flex: 1,
                    minWidth: '120px',
                }}
            >
                <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Methodology
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: THEME.colors.foreground }}>
                    {summary.methodology}
                </span>
                <span style={{ fontSize: '11px', color: THEME.colors.muted }}>
                    {summary.date}
                </span>
            </div>
        </div>
    );
}
