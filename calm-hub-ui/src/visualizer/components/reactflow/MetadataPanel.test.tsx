import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MetadataPanel } from './MetadataPanel';
import type { ControlEvaluationDecorator, ThreatModelDecorator } from '../../contracts/contracts.js';
import { BUILTIN_DECORATOR_VIEWS } from '../../../test-support/decorator-views.js';

// Mock child components

vi.mock('./ControlsPanel', () => ({
    ControlsPanel: ({ controls }: { controls: Record<string, unknown> }) => (
        <div data-testid="controls-panel">Controls: {Object.keys(controls).length}</div>
    ),
}));

vi.mock('./AdrsPanel', () => ({
    AdrsPanel: ({ adrs }: { adrs: string[] }) => (
        <div data-testid="adrs-panel">ADRs: {adrs.length}</div>
    ),
}));

describe('MetadataPanel', () => {

    const mockControls = {
        'control-1': {
            description: 'Test control',
            requirements: [],
        },
    };

    const defaultProps = {
        controls: mockControls,
        adrs: [] as string[],
        isCollapsed: false,
        onToggleCollapse: vi.fn(),
        height: 250,
        onHeightChange: vi.fn(),
    };

    it('renders nothing when there are no controls, evaluations or adrs', () => {
        const { container } = render(
            <MetadataPanel {...defaultProps} controls={{}} adrs={[]} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders collapsed view with counts when collapsed', () => {
        render(<MetadataPanel {...defaultProps} isCollapsed={true} />);

        expect(screen.getByText('Controls (1)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Expand metadata panel' })).toBeInTheDocument();
    });

    it('renders expanded view with Metadata header when not collapsed', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Collapse metadata panel' })).toBeInTheDocument();
    });

    it('renders tab buttons when expanded', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.getByRole('button', { name: /Controls \(1\)/ })).toBeInTheDocument();
    });

    it('has no flows tab — flows have their own dedicated view', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.queryByRole('button', { name: /Flows/ })).not.toBeInTheDocument();
        expect(screen.queryByTestId('flows-panel')).not.toBeInTheDocument();
    });

    it('shows ControlsPanel by default when controls exist', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
    });

    it('switches to ControlsPanel when clicking Controls tab', () => {
        render(<MetadataPanel {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Controls \(1\)/ }));

        expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
    });

    it('calls onToggleCollapse when clicking expand button in collapsed view', () => {
        const onToggleCollapse = vi.fn();
        render(<MetadataPanel {...defaultProps} isCollapsed={true} onToggleCollapse={onToggleCollapse} />);

        fireEvent.click(screen.getByRole('button', { name: 'Expand metadata panel' }));

        expect(onToggleCollapse).toHaveBeenCalled();
    });

    it('calls onToggleCollapse when clicking collapse button in expanded view', () => {
        const onToggleCollapse = vi.fn();
        render(<MetadataPanel {...defaultProps} onToggleCollapse={onToggleCollapse} />);

        fireEvent.click(screen.getByRole('button', { name: 'Collapse metadata panel' }));

        expect(onToggleCollapse).toHaveBeenCalled();
    });

    it('hides the controls tab when there are no controls', () => {
        render(<MetadataPanel {...defaultProps} controls={{}} adrs={['https://example.com/adr/0001.md']} />);

        expect(screen.queryByRole('button', { name: /Controls/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ADRs/ })).toBeInTheDocument();
    });

    it('defaults to the controls tab when controls exist', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
    });

    it('renders resize handle with drag indicator', () => {
        render(<MetadataPanel {...defaultProps} />);

        expect(screen.getByTitle('Drag to resize')).toBeInTheDocument();
    });

    it('shows ADRs tab button when adrs exist', () => {
        render(<MetadataPanel {...defaultProps} adrs={['https://example.com/adr/0001.md', 'https://example.com/adr/0002.md']} />);

        expect(screen.getByRole('button', { name: /ADRs \(2\)/ })).toBeInTheDocument();
    });

    it('does not show ADRs tab when adrs is empty', () => {
        render(<MetadataPanel {...defaultProps} adrs={[]} />);

        expect(screen.queryByRole('button', { name: /ADRs/ })).not.toBeInTheDocument();
    });

    it('switches to AdrsPanel when clicking ADRs tab', () => {
        render(<MetadataPanel {...defaultProps} adrs={['https://example.com/adr/0001.md']} />);

        fireEvent.click(screen.getByRole('button', { name: /ADRs \(1\)/ }));

        expect(screen.getByTestId('adrs-panel')).toBeInTheDocument();
    });

    it('defaults to adrs tab when only adrs exist', () => {
        render(<MetadataPanel {...defaultProps} controls={{}} adrs={['https://example.com/adr/0001.md']} />);

        expect(screen.getByTestId('adrs-panel')).toBeInTheDocument();
    });

    it('renders ADR count in collapsed view when adrs exist', () => {
        render(<MetadataPanel {...defaultProps} adrs={['https://example.com/adr/0001.md']} isCollapsed={true} />);

        expect(screen.getByText('ADRs (1)')).toBeInTheDocument();
    });

    it('renders only with adrs and no other metadata', () => {
        const { container } = render(
            <MetadataPanel
                {...defaultProps}
                controls={{}}

                adrs={['https://example.com/adr/0001.md']}
            />
        );
        expect(container.firstChild).not.toBeNull();
    });

    it('resets to valid tab when active tab data disappears', () => {
        const { rerender } = render(
            <MetadataPanel
                {...defaultProps}

                adrs={['https://example.com/adr/0001.md']}
            />
        );

        // Initially on the controls tab
        expect(screen.getByTestId('controls-panel')).toBeInTheDocument();

        // Switch to ADRs tab
        fireEvent.click(screen.getByRole('button', { name: /ADRs \(1\)/ }));
        expect(screen.getByTestId('adrs-panel')).toBeInTheDocument();

        // Re-render with no ADRs. activeTab must fall back to controls.
        rerender(<MetadataPanel {...defaultProps} adrs={[]} />);

        expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
        expect(screen.queryByTestId('adrs-panel')).not.toBeInTheDocument();
    });

    describe('control evaluations', () => {
        const evaluations: ControlEvaluationDecorator[] = [
            {
                schema: 's',
                uniqueId: 'eval-1',
                type: 'control-evaluation',
                target: ['t'],
                appliesTo: ['trade-api'],
                data: {
                    control: { 'unique-id': 'client-ledger-human-approval', 'requirement-url': 'https://example.org/r' },
                    status: 'met',
                    'evaluated-at': '2026-11-04T15:00:00Z',
                },
            },
        ];
        const onlyEvaluations = { ...defaultProps, controls: {}, adrs: [], evaluations };

        it('gives the evaluations panel the overlay that colours its chips', () => {
            const { unmount } = render(<MetadataPanel {...onlyEvaluations} />);
            expect(screen.getByTestId('control-evaluation-chip').textContent).toBe('met');
            unmount();

            render(<MetadataPanel {...onlyEvaluations} evaluationOverlay={{ status: '/status', map: { met: 'ok' } }} />);
            expect(screen.getByTestId('control-evaluation-chip').textContent).toBe('Met');
        });

        it('counts evaluations in the collapsed bar', () => {
            render(<MetadataPanel {...onlyEvaluations} isCollapsed={true} />);

            expect(screen.getByText('Evaluations (1)')).toBeInTheDocument();
        });

        it('opens on the evaluations tab when there are evaluations', () => {
            render(<MetadataPanel {...onlyEvaluations} />);

            expect(screen.getByTestId('control-evaluation-row')).toBeInTheDocument();
        });

        it('switches to the evaluations tab when evaluations arrive after mount', () => {
            const { rerender } = render(<MetadataPanel {...defaultProps} isCollapsed={true} />);
            rerender(<MetadataPanel {...defaultProps} evaluations={evaluations} isCollapsed={true} />);
            rerender(<MetadataPanel {...defaultProps} evaluations={evaluations} isCollapsed={false} />);

            expect(screen.getByTestId('control-evaluation-row')).toBeInTheDocument();
            expect(screen.queryByTestId('controls-panel')).not.toBeInTheDocument();
        });

        it('keeps the tab the user chose when evaluations update later', () => {
            const { rerender } = render(<MetadataPanel {...defaultProps} evaluations={evaluations} />);
            fireEvent.click(screen.getByRole('button', { name: /Controls \(1\)/ }));
            const updated = [...evaluations, { ...evaluations[0], uniqueId: 'eval-2' }];
            rerender(<MetadataPanel {...defaultProps} evaluations={updated} />);

            expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
            expect(screen.queryByTestId('control-evaluation-row')).not.toBeInTheDocument();
        });
    });

    describe('threat models', () => {
        const overlay = BUILTIN_DECORATOR_VIEWS.find((v) => v.id === 'threat-model')!.overlay;
        const architecture = {
            nodes: [{ 'unique-id': 'gw', name: 'API Gateway', controls: { oauth: { description: 'o', requirements: [] } } }],
            relationships: [],
            flows: [{ 'unique-id': 'flow-1', name: 'Submit Payment', transitions: [] }],
        };
        const model = {
            uniqueId: 'tm', type: 'threat-model', target: [], appliesTo: ['flow-1', 'gw'],
            data: {
                flow: 'flow-1', methodology: 'STRIDE', 'assessed-on': '2026-10-13', assessor: 'sec',
                'trust-boundaries': [{ 'unique-id': 'tb', name: 'Internet to DMZ', elements: ['gw'] }],
                threats: [
                    { 'unique-id': 'a', name: 'Token replay', status: 'mitigated', 'applies-to': ['gw'], classification: [{ scheme: 'STRIDE', value: 'spoofing' }],
                        mitigations: [{ control: 'oauth', state: 'verified' }] },
                    { 'unique-id': 'b', name: 'Flooding', status: 'identified', 'applies-to': ['gw'], mitigations: [{ control: 'rate-limiting', state: 'planned' }] },
                ],
            },
        } as unknown as ThreatModelDecorator;
        const onlyThreats = { ...defaultProps, controls: {}, threatModels: [model], threatModelOverlay: overlay, architecture };

        it('opens on the threats tab and shows the flow, boundaries, threats and gaps', () => {
            render(<MetadataPanel {...onlyThreats} />);
            expect(screen.getByRole('button', { name: 'Threats (2)' })).toBeInTheDocument();
            expect(screen.getByText('Submit Payment')).toBeInTheDocument();
            expect(screen.getAllByTestId('trust-boundary')).toHaveLength(1);
            expect(screen.getAllByTestId('threat-status').map((c) => c.textContent)).toEqual(['Mitigated', 'Identified']);
            expect(screen.getAllByTestId('threat-mitigation').map((m) => m.textContent)).toEqual([
                expect.stringContaining('on API Gateway'),
                expect.stringContaining('Gap'),
            ]);
        });

        it('selects an element that a threat names', () => {
            const onElementClick = vi.fn();
            render(<MetadataPanel {...onlyThreats} onElementClick={onElementClick} />);
            fireEvent.click(screen.getAllByRole('button', { name: 'API Gateway' })[0]);
            expect(onElementClick).toHaveBeenCalledWith('gw');
        });

        it('counts only the threats of the newest assessment of each flow in the tab', () => {
            const older = { ...model, uniqueId: 'tm-old', data: { ...model.data, 'assessed-on': '2026-01-01', threats: [...model.data.threats, ...model.data.threats] } } as ThreatModelDecorator;
            render(<MetadataPanel {...onlyThreats} threatModels={[older, model]} />);
            expect(screen.getByRole('button', { name: 'Threats (2)' })).toBeInTheDocument();
        });

        it('keeps evaluations as the default tab when both exist', () => {
            const evaluation = { uniqueId: 'e', type: 'control-evaluation', target: [], appliesTo: ['gw'],
                data: { control: { 'unique-id': 'c', 'requirement-url': 'r' }, status: 'met', 'evaluated-at': '2026-11-04T15:00:00Z' } } as unknown as ControlEvaluationDecorator;
            render(<MetadataPanel {...onlyThreats} evaluations={[evaluation]} />);
            expect(screen.getByTestId('control-evaluation-row')).toBeInTheDocument();
            expect(screen.queryByTestId('threat-row')).not.toBeInTheDocument();
        });
    });
});
