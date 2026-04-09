import { THEME } from '../theme.js';
import type { ThreatFilters } from './threat-types.js';
import { STRIDE_LABELS, MITIGATION_STYLES } from './threat-types.js';
import type { StrideCategory, MitigationStatus } from '../../../contracts/contracts.js';

interface ThreatFilterBarProps {
    filters: ThreatFilters;
    onChange: (filters: ThreatFilters) => void;
    trustBoundaryOptions: string[];
}

const selectStyle: React.CSSProperties = {
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.card,
    color: THEME.colors.foreground,
    outline: 'none',
    minWidth: '140px',
};

export function ThreatFilterBar({ filters, onChange, trustBoundaryOptions }: ThreatFilterBarProps) {
    return (
        <div
            style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: THEME.colors.card,
            }}
        >
            <span style={{ fontSize: '11px', fontWeight: 600, color: THEME.colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Filter:
            </span>

            <select
                value={filters.strideCategory}
                onChange={(e) => onChange({ ...filters, strideCategory: e.target.value })}
                style={selectStyle}
                aria-label="Filter by STRIDE category"
            >
                <option value="">All Categories</option>
                {(Object.keys(STRIDE_LABELS) as StrideCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                        {STRIDE_LABELS[cat].emoji} {STRIDE_LABELS[cat].label}
                    </option>
                ))}
            </select>

            <select
                value={filters.mitigationStatus}
                onChange={(e) => onChange({ ...filters, mitigationStatus: e.target.value })}
                style={selectStyle}
                aria-label="Filter by mitigation status"
            >
                <option value="">All Statuses</option>
                {(Object.keys(MITIGATION_STYLES) as MitigationStatus[]).map((status) => (
                    <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                ))}
            </select>

            {trustBoundaryOptions.length > 0 && (
                <select
                    value={filters.trustBoundary}
                    onChange={(e) => onChange({ ...filters, trustBoundary: e.target.value })}
                    style={selectStyle}
                    aria-label="Filter by trust boundary"
                >
                    <option value="">All Boundaries</option>
                    {trustBoundaryOptions.map((tb) => (
                        <option key={tb} value={tb}>{tb}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
