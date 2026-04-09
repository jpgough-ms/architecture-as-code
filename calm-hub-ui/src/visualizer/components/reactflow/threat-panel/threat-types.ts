import type {
    StrideCategory,
    MitigationStatus,
    OverallRisk,
    TrustBoundaryCriticality,
    Threat,
} from '../../../contracts/contracts.js';

export const STRIDE_LABELS: Record<StrideCategory, { emoji: string; label: string }> = {
    'spoofing': { emoji: '🎭', label: 'Spoofing' },
    'tampering': { emoji: '🔧', label: 'Tampering' },
    'repudiation': { emoji: '🙈', label: 'Repudiation' },
    'information-disclosure': { emoji: '📤', label: 'Info Disclosure' },
    'denial-of-service': { emoji: '🚫', label: 'Denial of Service' },
    'elevation-of-privilege': { emoji: '⬆️', label: 'Elevation of Privilege' },
};

export const MITIGATION_STYLES: Record<MitigationStatus, { background: string; color: string; dot: string }> = {
    'mitigated': { background: '#dcfce7', color: '#15803d', dot: '#16a34a' },
    'partial': { background: '#fef3c7', color: '#92400e', dot: '#d97706' },
    'unmitigated': { background: '#fee2e2', color: '#b91c1c', dot: '#dc2626' },
};

export const RISK_STYLES: Record<OverallRisk | TrustBoundaryCriticality, { background: string; color: string }> = {
    'critical': { background: '#fecaca', color: '#991b1b' },
    'high': { background: '#fee2e2', color: '#b91c1c' },
    'medium': { background: '#fef3c7', color: '#92400e' },
    'low': { background: '#dcfce7', color: '#15803d' },
};

export interface ThreatFilters {
    strideCategory: string;
    mitigationStatus: string;
    trustBoundary: string;
}

export function countByMitigation(threats: Threat[]): Record<MitigationStatus, number> {
    const counts: Record<MitigationStatus, number> = { mitigated: 0, partial: 0, unmitigated: 0 };
    for (const t of threats) {
        const status = t['mitigation-status'];
        if (status in counts) {
            counts[status]++;
        }
    }
    return counts;
}

export function countByStride(threats: Threat[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const t of threats) {
        const cat = t['stride-category'];
        counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
}
