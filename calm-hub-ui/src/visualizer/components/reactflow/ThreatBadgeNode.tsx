import type { NodeProps } from 'reactflow';
import { THEME } from './theme.js';
import type { Threat } from '../../contracts/contracts.js';

const STATUS_COLOR: Record<string, string> = {
    unmitigated: '#dc2626',
    partial: '#d97706',
    mitigated: '#16a34a',
};

interface ThreatBadgeData {
    emoji: string;
    category: string;
    count: number;
    worstStatus: string;
    threats: Threat[];
    onThreatSelect?: (threatId: string) => void;
}

export function ThreatBadgeNode({ data }: NodeProps<ThreatBadgeData>) {
    const statusColor = STATUS_COLOR[data.worstStatus] ?? STATUS_COLOR.partial;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                const firstThreat = data.threats[0];
                if (firstThreat) data.onThreatSelect?.(firstThreat.id);
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${THEME.colors.border}`,
                borderLeft: `3px solid ${statusColor}`,
                background: THEME.colors.card,
                cursor: 'pointer',
                boxShadow: THEME.shadows.sm,
                whiteSpace: 'nowrap',
                transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = THEME.shadows.lg;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = THEME.shadows.sm;
            }}
        >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{data.emoji}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: THEME.colors.foreground, textTransform: 'capitalize' }}>
                {data.category.replace(/-/g, ' ')}
            </span>
            {data.count > 1 && (
                <span
                    style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white',
                        background: statusColor,
                        borderRadius: '8px',
                        padding: '1px 6px',
                        lineHeight: '16px',
                    }}
                >
                    {data.count}
                </span>
            )}
            <span
                style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: statusColor,
                    flexShrink: 0,
                }}
                title={data.worstStatus}
            />
        </div>
    );
}
