import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThreatPanel } from './ThreatPanel';
import type { ThreatModelDecorator } from '../../contracts/contracts.js';

const mockDecorator: ThreatModelDecorator = {
    schema: 'https://calm.finos.org/draft/2026-03/standards/threat-model/threat-model.decorator.standard.json',
    uniqueId: 'tm-1',
    type: 'threat-model',
    target: ['/calm/namespaces/workshop/architectures/1/versions/1-0-0'],
    data: {
        summary: {
            date: '2024-06-01',
            methodology: 'STRIDE',
            'overall-risk': 'high',
            'total-threats': 3,
        },
        'trust-boundaries': [
            { id: 'tb-external-api', name: 'External to API Gateway', criticality: 'critical' },
            { id: 'tb-api-db', name: 'API to Database', criticality: 'high' },
        ],
        threats: [
            {
                id: 'T-001',
                'trust-boundary': 'tb-external-api',
                'stride-category': 'spoofing',
                description: 'Attacker impersonates a legitimate user',
                risk: 'high',
                'mitigation-status': 'mitigated',
                'existing-controls': ['CTRL-AUTH-001'],
                notes: 'OAuth 2.0 with PKCE implemented',
            },
            {
                id: 'T-002',
                'trust-boundary': 'tb-external-api',
                'stride-category': 'denial-of-service',
                description: 'API overwhelmed by excessive requests',
                risk: 'medium',
                'mitigation-status': 'partial',
            },
            {
                id: 'T-003',
                'trust-boundary': 'tb-api-db',
                'stride-category': 'tampering',
                description: 'SQL injection on database queries',
                risk: 'high',
                'mitigation-status': 'unmitigated',
            },
        ],
        recommendations: [
            {
                id: 'REC-001',
                priority: 'high',
                threats: ['T-003'],
                description: 'Implement parameterised queries',
                implementation: 'Use prepared statements in all database access layers',
            },
            {
                id: 'REC-002',
                priority: 'medium',
                threats: ['T-002'],
                description: 'Add rate limiting',
            },
        ],
    },
};

describe('ThreatPanel', () => {
    it('renders empty state when no decorators are provided', () => {
        render(<ThreatPanel decorators={[]} />);

        expect(screen.getByText('No threat model found for this architecture.')).toBeInTheDocument();
    });

    it('renders summary section with overall risk', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('Overall Risk')).toBeInTheDocument();
    });

    it('renders total threats count in summary', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Total Threats')).toBeInTheDocument();
    });

    it('renders methodology in summary', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('STRIDE')).toBeInTheDocument();
        expect(screen.getByText('Methodology')).toBeInTheDocument();
    });

    it('renders mitigation counts in summary', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        // These labels appear in both summary and filter dropdowns, so use getAllByText
        expect(screen.getAllByText('Mitigated').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Unmitigated').length).toBeGreaterThanOrEqual(1);
    });

    it('renders threat list with all threats', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText(/Threats \(3\)/)).toBeInTheDocument();
    });

    it('displays threat IDs in the list', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        // T-001 appears in both list and detail (it's selected by default), so use getAllByText
        expect(screen.getAllByText('T-001').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('T-002').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('T-003').length).toBeGreaterThanOrEqual(1);
    });

    it('shows detail view for the first threat by default', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        // Description appears in both the list item and the detail pane
        expect(screen.getAllByText('Attacker impersonates a legitimate user').length).toBeGreaterThanOrEqual(1);
    });

    it('shows existing controls in detail view', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('CTRL-AUTH-001')).toBeInTheDocument();
    });

    it('shows notes in detail view when present', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('OAuth 2.0 with PKCE implemented')).toBeInTheDocument();
    });

    it('switches detail view when clicking a different threat', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        const buttons = screen.getAllByRole('button');
        const tamperingButton = buttons.find((btn) => btn.textContent?.includes('T-003'));
        expect(tamperingButton).toBeDefined();
        fireEvent.click(tamperingButton!);

        // Description appears in both list item and detail pane
        expect(screen.getAllByText('SQL injection on database queries').length).toBeGreaterThanOrEqual(1);
    });

    it('shows recommendations related to selected threat', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        // Select T-003 which has REC-001
        const buttons = screen.getAllByRole('button');
        const tamperingButton = buttons.find((btn) => btn.textContent?.includes('T-003'));
        fireEvent.click(tamperingButton!);

        expect(screen.getByText('Implement parameterised queries')).toBeInTheDocument();
        expect(screen.getByText('Use prepared statements in all database access layers')).toBeInTheDocument();
    });

    it('renders filter dropdowns', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByRole('combobox', { name: /filter by stride category/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /filter by mitigation status/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /filter by trust boundary/i })).toBeInTheDocument();
    });

    it('filters by STRIDE category', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        fireEvent.change(screen.getByRole('combobox', { name: /filter by stride category/i }), {
            target: { value: 'tampering' },
        });

        expect(screen.getByText(/Threats \(1 of 3\)/)).toBeInTheDocument();
        // T-003 appears in both list and detail
        expect(screen.getAllByText('T-003').length).toBeGreaterThanOrEqual(1);
    });

    it('filters by mitigation status', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        fireEvent.change(screen.getByRole('combobox', { name: /filter by mitigation status/i }), {
            target: { value: 'unmitigated' },
        });

        expect(screen.getByText(/Threats \(1 of 3\)/)).toBeInTheDocument();
    });

    it('filters by trust boundary', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        fireEvent.change(screen.getByRole('combobox', { name: /filter by trust boundary/i }), {
            target: { value: 'tb-api-db' },
        });

        expect(screen.getByText(/Threats \(1 of 3\)/)).toBeInTheDocument();
    });

    it('shows no-match message when filters yield zero results', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        // Filter by trust boundary that only has tampering, then filter by spoofing category
        fireEvent.change(screen.getByRole('combobox', { name: /filter by trust boundary/i }), {
            target: { value: 'tb-api-db' },
        });
        fireEvent.change(screen.getByRole('combobox', { name: /filter by stride category/i }), {
            target: { value: 'spoofing' },
        });

        expect(screen.getByText('No threats match the current filters.')).toBeInTheDocument();
    });

    it('renders trust boundaries footer', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText(/Trust Boundaries: 2/)).toBeInTheDocument();
        expect(screen.getByText(/External to API Gateway/)).toBeInTheDocument();
        expect(screen.getByText(/API to Database/)).toBeInTheDocument();
    });

    it('renders date from summary', () => {
        render(<ThreatPanel decorators={[mockDecorator]} />);

        expect(screen.getByText('2024-06-01')).toBeInTheDocument();
    });
});
