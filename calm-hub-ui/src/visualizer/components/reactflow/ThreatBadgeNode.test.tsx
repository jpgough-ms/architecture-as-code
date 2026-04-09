import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreatBadgeNode } from './ThreatBadgeNode';
import { ReactFlowProvider } from 'reactflow';
import type { Threat } from '../../contracts/contracts.js';

const mockThreats: Threat[] = [
    {
        id: 'T-001',
        'trust-boundary': 'tb-1',
        'stride-category': 'spoofing',
        description: 'Attacker impersonates a user',
        risk: 'high',
        'mitigation-status': 'mitigated',
    },
    {
        id: 'T-002',
        'trust-boundary': 'tb-1',
        'stride-category': 'spoofing',
        description: 'Token forgery attack',
        risk: 'medium',
        'mitigation-status': 'unmitigated',
    },
];

function renderBadge(overrides: Partial<Parameters<typeof ThreatBadgeNode>[0]['data']> = {}) {
    const defaultData = {
        emoji: '🎭',
        category: 'spoofing',
        count: 2,
        worstStatus: 'unmitigated',
        threats: mockThreats,
        onThreatSelect: vi.fn(),
        ...overrides,
    };

    return render(
        <ReactFlowProvider>
            <ThreatBadgeNode
                id="badge-1"
                type="threatBadge"
                data={defaultData}
                xPos={0}
                yPos={0}
                isConnectable={false}
                selected={false}
                zIndex={0}
                dragging={false}
            />
        </ReactFlowProvider>
    );
}

describe('ThreatBadgeNode', () => {
    it('renders the emoji and category name', () => {
        renderBadge();
        expect(screen.getByText('🎭')).toBeInTheDocument();
        expect(screen.getByText(/spoofing/i)).toBeInTheDocument();
    });

    it('renders count badge when greater than 1', () => {
        renderBadge({ count: 2 });
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not render count badge when equal to 1', () => {
        renderBadge({ count: 1 });
        expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('renders status indicator dot', () => {
        renderBadge();
        const dot = screen.getByTitle('unmitigated');
        expect(dot).toBeInTheDocument();
    });

    it('calls onThreatSelect with first threat id on click', () => {
        const onSelect = vi.fn();
        renderBadge({ onThreatSelect: onSelect });

        fireEvent.click(screen.getByText(/spoofing/i));

        expect(onSelect).toHaveBeenCalledWith('T-001');
    });

    it('renders with different category', () => {
        renderBadge({ emoji: '🔧', category: 'tampering', worstStatus: 'partial' });
        expect(screen.getByText('🔧')).toBeInTheDocument();
        expect(screen.getByText(/tampering/i)).toBeInTheDocument();
        expect(screen.getByTitle('partial')).toBeInTheDocument();
    });
});
