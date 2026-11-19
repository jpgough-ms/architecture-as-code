import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThreatModelPanel } from './ThreatModelPanel.js';
import { BUILTIN_DECORATOR_VIEWS } from '../../../../test-support/decorator-views.js';
import type { ThreatModelDecorator } from '../../../contracts/contracts.js';

const overlay = BUILTIN_DECORATOR_VIEWS.find((v) => v.id === 'threat-model')!.overlay;
const architecture = {
    nodes: [
        { 'unique-id': 'gw', name: 'API Gateway', controls: { oauth: { description: 'o', requirements: [] } } },
        { 'unique-id': 'api', name: 'Payments API' },
    ],
    relationships: [],
    flows: [{ 'unique-id': 'flow-1', name: 'Submit Payment', transitions: [] }],
};
const model = (threats: unknown, extra: Record<string, unknown> = {}) =>
    ({ uniqueId: 'tm', type: 'threat-model', target: [], appliesTo: [], data: { flow: 'flow-1', methodology: 'STRIDE', 'assessed-on': '2026-10-13', threats, ...extra } }) as unknown as ThreatModelDecorator;

describe('ThreatModelPanel', () => {
    it('renders malformed threat data without throwing', () => {
        render(
            <ThreatModelPanel
                architecture={architecture}
                overlay={overlay}
                models={[model([
                    { 'unique-id': 'a', name: 'A', status: 'identified', 'applies-to': ['gw'], classification: 'spoofing', mitigations: [null, 'oauth', { control: 'oauth', state: 'planned' }], 'residual-risk': 'high' },
                    { 'unique-id': 'a', name: 'Duplicate id', status: 42, 'applies-to': 'gw' },
                    null,
                ], { 'trust-boundaries': [null, { 'unique-id': 'tb', name: 'Edge', elements: ['gw', 'gw'] }] })]}
            />,
        );
        expect(screen.getAllByTestId('threat-row')).toHaveLength(2);
        expect(screen.getAllByTestId('threat-mitigation')).toHaveLength(1);
        expect(screen.getAllByTestId('threat-status').map((c) => c.textContent)).toEqual(['Identified', '(no status)']);
        expect(screen.getAllByTestId('trust-boundary')).toHaveLength(2);
    });

    it('says when a control is not on the element that attached-to names', () => {
        render(
            <ThreatModelPanel
                architecture={architecture}
                overlay={overlay}
                models={[model([
                    { 'unique-id': 'a', name: 'A', status: 'mitigated', 'applies-to': ['gw'], mitigations: [
                        { control: 'oauth', state: 'verified', 'attached-to': 'api' },
                        { control: 'oauth', state: 'verified', 'attached-to': 'gw' },
                    ] },
                ])]}
            />,
        );
        const [moved, onTarget] = screen.getAllByTestId('threat-mitigation');
        expect(moved).toHaveTextContent('on API Gateway');
        expect(moved).toHaveTextContent('(not on Payments API)');
        expect(onTarget.querySelector('[data-testid="mitigation-not-attached"]')).toBeNull();
    });

    it('shows the newest assessment of a flow, and the earlier one only under its collapsed section', () => {
        const older = { ...model([{ 'unique-id': 'a', name: 'Old threat', status: 'identified', 'applies-to': ['gw'] }], { 'assessed-on': '2026-09-01' }), uniqueId: 'tm-old' };
        const newer = { ...model([{ 'unique-id': 'a', name: 'New threat', status: 'mitigated', 'applies-to': ['gw'], mitigations: [{ control: 'oauth', state: 'verified' }] }]), uniqueId: 'tm-new' };
        render(<ThreatModelPanel architecture={architecture} overlay={overlay} models={[older, newer]} />);

        const earlier = screen.getByTestId('earlier-assessments') as HTMLDetailsElement;
        expect(earlier.open).toBe(false);
        expect(within(earlier).getByText('Earlier assessments (1)')).toBeInTheDocument();
        const [current, superseded] = screen.getAllByTestId('threat-model-section');
        expect(within(current).getByText('New threat')).toBeInTheDocument();
        expect(within(current).queryByTestId('superseded')).toBeNull();
        expect(earlier).toContainElement(superseded);

        fireEvent.click(within(earlier).getByText('Earlier assessments (1)'));
        expect(earlier.open).toBe(true);
        expect(within(superseded).getByTestId('superseded')).toBeInTheDocument();
        expect(within(superseded).getByText('Old threat')).toBeInTheDocument();
        expect(superseded).toHaveTextContent('assessed 2026-09-01');
    });
});
