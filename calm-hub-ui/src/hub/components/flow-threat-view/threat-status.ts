import type { ThreatStatus } from '../../../visualizer/contracts/decorator-contracts.js';

/** Literal class strings, so Tailwind sees them. */
export const STATUS_STYLE: Record<ThreatStatus, { label: string; badge: string; fill: string; text: string }> = {
    identified: { label: 'Identified', badge: 'badge badge-error', fill: 'fill-error', text: 'fill-error-content' },
    'partially-mitigated': {
        label: 'Partially mitigated',
        badge: 'badge badge-warning',
        fill: 'fill-warning',
        text: 'fill-warning-content',
    },
    mitigated: { label: 'Mitigated', badge: 'badge badge-success', fill: 'fill-success', text: 'fill-success-content' },
    accepted: { label: 'Accepted', badge: 'badge badge-info', fill: 'fill-info', text: 'fill-info-content' },
};

export const STATUS_ORDER: ThreatStatus[] = ['identified', 'partially-mitigated', 'mitigated', 'accepted'];
