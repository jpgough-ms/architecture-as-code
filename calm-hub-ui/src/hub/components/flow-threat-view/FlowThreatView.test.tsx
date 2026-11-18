import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalmCore } from '@finos/calm-models/model';
import { FlowThreatView } from './FlowThreatView.js';
import { architecture, architectureJson, decorator, flowJson } from './payments-fixtures.js';

function mockViewport(isMobile: boolean) {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
        matches: isMobile,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    return () => {
        window.matchMedia = original;
    };
}

const renderView = (props: Partial<React.ComponentProps<typeof FlowThreatView>> = {}) =>
    render(
        <FlowThreatView
            flowJson={flowJson}
            architectureJson={architectureJson}
            architecture={architecture}
            threatModel={decorator}
            {...props}
        />,
    );

describe('FlowThreatView on desktop', () => {
    it('draws a lane for each node with the controls it declares', () => {
        renderView();

        for (const id of ['mobile-app', 'api-gateway', 'payments-api', 'payments-db']) {
            expect(screen.getByTestId(`lane-${id}`)).toBeInTheDocument();
        }
        const gateway = within(screen.getByTestId('lane-api-gateway'));
        expect(gateway.getByText('OAuth 2.0 Authentication')).toBeInTheDocument();
        expect(gateway.getByText('Request Validation')).toBeInTheDocument();
    });

    it('draws an arrow for each relationship of the flow and a trust boundary arc for each crossing', () => {
        renderView();

        expect(screen.getByRole('button', { name: /Mobile App to API Gateway, 3 threats/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /API Gateway to Payments API, 1 threat$/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Payments API to Payments DB, 2 threats/ })).toBeInTheDocument();
        for (const name of ['Internet to DMZ', 'DMZ to core services', 'Core services to data tier']) {
            expect(screen.getByRole('button', { name: new RegExp(`Trust boundary ${name}`) })).toBeInTheDocument();
        }
    });

    it('shows a chip for each threat on its arrow, labelled with the STRIDE initial', () => {
        renderView();

        const chip = screen.getByTestId('chip-t-submit-flood');
        expect(chip).toHaveTextContent('D');
        expect(chip.querySelector('title')).toHaveTextContent('Payment endpoint flooding (Identified)');
        expect(screen.getByTestId('chip-t-bola')).toHaveTextContent('E');
    });

    it('summarises the threat model until something is selected', () => {
        renderView();

        expect(screen.getByText('6 threats in this threat model')).toBeInTheDocument();
        const summary = within(screen.getByTestId('threat-summary'));
        expect(summary.getByText('1 identified')).toBeInTheDocument();
        expect(summary.getByText('2 partially mitigated')).toBeInTheDocument();
        expect(summary.getByText('2 mitigated')).toBeInTheDocument();
        expect(summary.getByText('1 accepted')).toBeInTheDocument();
        expect(screen.getByText('Click an arrow or a trust boundary to see its threats.')).toBeInTheDocument();
    });

    it('shows the threats of an arrow when it is clicked', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));

        const panel = within(screen.getByTestId('threat-panel'));
        expect(panel.getByText('Mobile App → API Gateway')).toBeInTheDocument();
        expect(panel.getByText('HTTPS')).toBeInTheDocument();
        expect(panel.getByText('Steps 1, 5')).toBeInTheDocument();
        expect(panel.getByText('Controls on this connection: Transport Security')).toBeInTheDocument();
        for (const id of ['t-token-replay', 't-amount-tamper', 't-submit-flood']) {
            expect(screen.getByTestId(`threat-${id}`)).toBeInTheDocument();
        }
    });

    it('reports a control that is declared nowhere as a gap', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));

        expect(screen.getByTestId('mitigation-t-submit-flood-rate-limiting')).toHaveTextContent('not declared: gap');
        expect(screen.getByTestId('mitigation-t-token-replay-oauth2-authentication')).toHaveTextContent('declared on API Gateway');
        expect(screen.getByTestId('mitigation-t-amount-tamper-transport-security')).toHaveTextContent('declared on this connection');
    });

    it('shows the threats of a trust boundary when it is clicked', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('boundary-tb-dmz-core'));

        const panel = within(screen.getByTestId('threat-panel'));
        expect(panel.getByText('DMZ to core services')).toBeInTheDocument();
        expect(panel.getByText('Crossed by: API Gateway → Payments API')).toBeInTheDocument();
        expect(screen.getByTestId('threat-t-bola')).toBeInTheDocument();
        expect(screen.getByTestId('mitigation-t-bola-authorization-checks')).toHaveTextContent('declared on Payments API');
        expect(screen.getByTestId('mitigation-t-bola-mutual-tls')).toHaveTextContent('declared on this connection');
    });

    it('shows accepted residual risk and a control declared on the architecture', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-payments-api-to-payments-db'));

        expect(screen.getByTestId('residual-t-no-audit')).toHaveTextContent('Residual risk: medium');
        expect(screen.getByTestId('residual-t-no-audit')).toHaveTextContent('Accepted by payments-security-lead, review by 2027-03-31');
        expect(screen.getByTestId('mitigation-t-no-audit-audit-logging')).toHaveTextContent('declared on the architecture');
    });

    it('clears the selection when the same arrow is clicked again', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));
        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));

        expect(screen.getByText('6 threats in this threat model')).toBeInTheDocument();
    });

    it('can be operated from the keyboard', async () => {
        const user = userEvent.setup();
        renderView();

        screen.getByTestId('boundary-tb-core-data').focus();
        await user.keyboard('{Enter}');

        expect(screen.getByTestId('threat-t-pan-at-rest')).toBeInTheDocument();
    });

    it('lights up the controls a threat relies on while it is hovered', async () => {
        const user = userEvent.setup();
        renderView();
        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));
        const control = screen.getByTestId('control-api-gateway-oauth2-authentication');
        expect(control).not.toHaveAttribute('data-highlighted');

        await user.hover(screen.getByTestId('threat-t-token-replay'));
        expect(control).toHaveAttribute('data-highlighted', 'true');
        expect(screen.getByTestId('control-api-gateway-request-validation')).not.toHaveAttribute('data-highlighted');

        await user.unhover(screen.getByTestId('threat-t-token-replay'));
        expect(control).not.toHaveAttribute('data-highlighted');
    });

    it('keeps the controls lit when a threat is pinned by a click, and unpins on the next click', async () => {
        const user = userEvent.setup();
        renderView();
        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));
        const control = screen.getByTestId('control-api-gateway-oauth2-authentication');
        const threat = screen.getByTestId('threat-t-token-replay');

        await user.click(threat);
        await user.unhover(threat);
        expect(control).toHaveAttribute('data-highlighted', 'true');

        await user.click(threat);
        await user.unhover(threat);
        expect(control).not.toHaveAttribute('data-highlighted');
    });

    it('lights up nothing for a control that is not declared on a node', async () => {
        const user = userEvent.setup();
        renderView();
        await user.click(screen.getByTestId('arrow-mobile-app-to-api-gateway'));

        await user.hover(screen.getByTestId('threat-t-submit-flood'));

        expect(document.querySelectorAll('[data-highlighted]')).toHaveLength(0);
    });

    it('shows the lanes of a flow whose threat model has no trust boundaries', () => {
        renderView({ threatModel: { ...decorator, data: { ...decorator.data, 'trust-boundaries': undefined } } });

        expect(screen.getByTestId('lane-mobile-app')).toBeInTheDocument();
        expect(screen.queryByTestId('boundary-tb-dmz-core')).not.toBeInTheDocument();
    });

    it('says so when a selected arrow has no threats', async () => {
        const user = userEvent.setup();
        renderView({ threatModel: { ...decorator, data: { ...decorator.data, threats: [] } } });

        await user.click(screen.getByTestId('arrow-api-gateway-to-payments-api'));

        expect(screen.getByText('No threats recorded here.')).toBeInTheDocument();
    });

    it('prompts for a threat model when none applies to the flow', () => {
        renderView({ threatModel: null });

        expect(screen.getByText(/No threat model applies to this flow/)).toBeInTheDocument();
        expect(screen.queryByTestId('lane-mobile-app')).not.toBeInTheDocument();
    });

    it('says so when the architecture is not available', () => {
        renderView({ architecture: null, architectureJson: null });

        expect(screen.getByText('The architecture for this flow could not be loaded.')).toBeInTheDocument();
    });

    it('says so when none of the relationships of the flow are in the architecture', () => {
        const withoutRelationships = { ...architectureJson, relationships: [] };
        renderView({ architectureJson: withoutRelationships, architecture: CalmCore.fromSchema(withoutRelationships) });

        expect(screen.getByText('None of the relationships in this flow are in the architecture.')).toBeInTheDocument();
    });
});

describe('FlowThreatView on mobile', () => {
    let restore: () => void;
    beforeEach(() => { restore = mockViewport(true); });
    afterEach(() => { restore(); });

    it('keeps the summary inline until something is selected', () => {
        renderView();

        expect(screen.getByText('6 threats in this threat model')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens the threats of the selection full screen and closes them again', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-api-gateway-to-payments-api'));

        const dialog = screen.getByRole('dialog', { name: 'Threats' });
        expect(within(dialog).getByTestId('threat-t-bola')).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Close threats' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('6 threats in this threat model')).toBeInTheDocument();
    });
});

describe('FlowThreatView on desktop has no overlay', () => {
    it('shows the threats under the lanes and no dialog or close button', async () => {
        const user = userEvent.setup();
        renderView();

        await user.click(screen.getByTestId('arrow-api-gateway-to-payments-api'));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close threats' })).not.toBeInTheDocument();
    });
});
