import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DocumentDetailSection } from './DocumentDetailSection.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Data } from '../../../model/calm.js';
import { architectureJson, decorator, flowJson } from '../flow-threat-view/payments-fixtures.js';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(function () { return mockNavigate; }),
    };
});

vi.mock('@monaco-editor/react', () => ({
    Editor: ({ value }: { value: string }) => <textarea value={value} readOnly data-testid="monaco-editor" />
}));

const mockFetchStandardVersions = vi.fn();
const mockFetchFlowVersions = vi.fn();
const mockFetchVersionsByCustomId = vi.fn();
const mockFetchArchitectureSummaries = vi.fn();
const mockFetchArchitectureVersions = vi.fn();
const mockFetchArchitecture = vi.fn();
const mockFetchDecoratorValues = vi.fn();

vi.mock('../../../service/calm-service.js', () => ({
    CalmService: vi.fn().mockImplementation(function () { return {
        fetchStandardVersions: mockFetchStandardVersions,
        fetchFlowVersions: mockFetchFlowVersions,
        fetchVersionsByCustomId: mockFetchVersionsByCustomId,
        fetchArchitectureSummaries: mockFetchArchitectureSummaries,
        fetchArchitectureVersions: mockFetchArchitectureVersions,
        fetchArchitecture: mockFetchArchitecture,
        fetchDecoratorValues: mockFetchDecoratorValues,
    }; }),
}));

describe('DocumentDetailSection', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockFetchStandardVersions.mockClear().mockResolvedValue([]);
        mockFetchFlowVersions.mockClear().mockResolvedValue([]);
        mockFetchVersionsByCustomId.mockClear().mockResolvedValue([]);
        mockFetchArchitectureSummaries.mockClear().mockResolvedValue([]);
        mockFetchArchitectureVersions.mockClear().mockResolvedValue([]);
        mockFetchArchitecture.mockClear();
        mockFetchDecoratorValues.mockClear().mockResolvedValue([]);
    });

    it('renders null when data is undefined', () => {
        const { container } = render(
            <MemoryRouter>
                <DocumentDetailSection data={undefined} />
            </MemoryRouter>
        );
        expect(container.firstChild).toBeNull();
    });

    // Regression: the live page mounts this component with data=undefined while
    // the resource loads, then re-renders the SAME instance with data. A hook
    // placed after the `if (!data) return null` guard changes the hook count
    // between those two renders and crashes React. This exercises that transition.
    it('does not crash when data changes from undefined to a Flow', async () => {
        const flowData: Data = {
            id: '4',
            version: '1.0.0',
            name: 'finos',
            calmType: 'Flows',
            data: {
                'unique-id': 'flow-4',
                name: 'Payment Flow',
                description: 'Test flow',
                transitions: [
                    { 'relationship-unique-id': 'a-to-b', 'sequence-number': 1, description: 'A calls B' },
                ],
            },
        };

        const { rerender } = render(
            <MemoryRouter>
                <DocumentDetailSection data={undefined} />
            </MemoryRouter>
        );

        expect(() =>
            rerender(
                <MemoryRouter>
                    <DocumentDetailSection data={flowData} />
                </MemoryRouter>
            )
        ).not.toThrow();

        // The name shows in the breadcrumb. The diagram no longer repeats it.
        await waitFor(() => expect(screen.getAllByText('Payment Flow').length).toBeGreaterThan(0));
    });

    it('renders Patterns with correct icon', () => {
        const data: Data = {
            id: 'test-pattern',
            version: '1.0.0',
            name: 'my-namespace',
            calmType: 'Patterns',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('my-namespace');
        expect(heading).toHaveTextContent('test-pattern');
        // The version is no longer in the header. The timeline bar shows it.
    });

    it('renders Flows with correct icon', () => {
        const data: Data = {
            id: 'test-flow',
            version: '2.0.0',
            name: 'flow-namespace',
            calmType: 'Flows',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('flow-namespace');
        expect(heading).toHaveTextContent('test-flow');
        // The version is no longer in the header. The timeline bar shows it.
    });

    it('shows the flow name and a "Flow" type label in the breadcrumb', () => {
        const data: Data = {
            id: '4',
            version: '1.0.0',
            name: 'finos',
            calmType: 'Flows',
            data: {
                'unique-id': 'flow-4',
                name: 'Payment Processing',
                description: 'Test flow',
                transitions: [],
            },
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('finos');
        expect(heading).toHaveTextContent('Flow');
        // The human-readable flow name replaces the numeric id in the trail.
        expect(heading).toHaveTextContent('Payment Processing');
    });

    it('reports when a flow namespace has no architectures', async () => {
        const data: Data = {
            id: '4',
            version: '1.0.0',
            name: 'finos',
            calmType: 'Flows',
            data: {
                'unique-id': 'flow-4',
                name: 'Payment Processing',
                description: 'Test flow',
                transitions: [{ 'relationship-unique-id': 'a-to-b', 'sequence-number': 1, description: 'Call service' }],
            },
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('tab', { name: 'Architecture View' }));

        expect(await screen.findByText('No architectures found in this namespace')).toBeInTheDocument();
    });

    it('reports when no architecture matches the flow relationships', async () => {
        mockFetchArchitectureSummaries.mockResolvedValue([{ id: 1 }]);
        mockFetchArchitecture.mockResolvedValue({ data: { relationships: [{ 'unique-id': 'other' }] } });
        const data: Data = {
            id: '4', version: '1.0.0', name: 'finos', calmType: 'Flows',
            data: {
                'unique-id': 'flow-4', name: 'Payment Processing', description: 'Test flow',
                transitions: [{ 'relationship-unique-id': 'a-to-b', 'sequence-number': 1, description: 'Call service' }],
            },
        };

        render(<MemoryRouter><DocumentDetailSection data={data} /></MemoryRouter>);
        fireEvent.click(screen.getByRole('tab', { name: 'Architecture View' }));

        expect(await screen.findByText('No matching architecture found for this flow')).toBeInTheDocument();
    });

    it('reports when the architecture lookup fails', async () => {
        mockFetchArchitectureSummaries.mockRejectedValue(new Error('Network failure'));
        const data: Data = {
            id: '4', version: '1.0.0', name: 'finos', calmType: 'Flows',
            data: {
                'unique-id': 'flow-4', name: 'Payment Processing', description: 'Test flow',
                transitions: [{ 'relationship-unique-id': 'a-to-b', 'sequence-number': 1, description: 'Call service' }],
            },
        };

        render(<MemoryRouter><DocumentDetailSection data={data} /></MemoryRouter>);
        fireEvent.click(screen.getByRole('tab', { name: 'Architecture View' }));

        expect(await screen.findByText('Failed to load architecture')).toBeInTheDocument();
    });

    describe('Threats tab', () => {
        const paymentsFlow: Data = {
            id: '5', version: '1.0.0', name: 'finos.payments', calmType: 'Flows',
            data: flowJson as unknown as Extract<Data, { calmType: 'Flows' }>['data'],
        };

        function mockPaymentsArchitecture() {
            mockFetchArchitectureSummaries.mockResolvedValue([{ id: 9 }]);
            mockFetchArchitectureVersions.mockResolvedValue(['1.0.0']);
            mockFetchArchitecture.mockResolvedValue({ data: architectureJson });
        }

        it('is offered for flows only', () => {
            const pattern: Data = { id: 'p', version: '1.0.0', name: 'ns', calmType: 'Patterns', data: undefined };
            const { unmount } = render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);
            expect(screen.getByRole('tab', { name: 'Threats' })).toBeInTheDocument();
            unmount();

            render(<MemoryRouter><DocumentDetailSection data={pattern} /></MemoryRouter>);
            expect(screen.queryByRole('tab', { name: 'Threats' })).not.toBeInTheDocument();
        });

        it('looks up threat models by decorator type only, in the namespace of the flow', async () => {
            render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);

            await waitFor(() => expect(mockFetchDecoratorValues).toHaveBeenCalledWith('finos.payments', undefined, 'threat-model'));
        });

        it('does not look up decorators for anything but a flow', () => {
            const pattern: Data = { id: 'p', version: '1.0.0', name: 'ns', calmType: 'Patterns', data: undefined };
            render(<MemoryRouter><DocumentDetailSection data={pattern} /></MemoryRouter>);

            expect(mockFetchDecoratorValues).not.toHaveBeenCalled();
        });

        it('shows the lanes, boundaries and threats of the threat model that applies to the flow', async () => {
            mockPaymentsArchitecture();
            mockFetchDecoratorValues.mockResolvedValue([decorator]);

            render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);
            fireEvent.click(screen.getByRole('tab', { name: 'Threats' }));

            expect(await screen.findByTestId('lane-mobile-app')).toBeInTheDocument();
            expect(screen.getByTestId('boundary-tb-dmz-core')).toBeInTheDocument();
            await waitFor(() => expect(screen.getByTestId('chip-t-token-replay')).toBeInTheDocument());
        });

        it('ignores a threat model that applies to another flow', async () => {
            mockPaymentsArchitecture();
            mockFetchDecoratorValues.mockResolvedValue([{ ...decorator, appliesTo: ['another-flow'] }]);

            render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);
            fireEvent.click(screen.getByRole('tab', { name: 'Threats' }));

            expect(await screen.findByText(/No threat model applies to this flow/)).toBeInTheDocument();
        });

        it('says so when the architecture of the flow cannot be found', async () => {
            mockFetchArchitectureSummaries.mockResolvedValue([]);

            render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);
            fireEvent.click(screen.getByRole('tab', { name: 'Threats' }));

            expect(await screen.findByText('No architectures found in this namespace')).toBeInTheDocument();
        });

        it('shows no threat model when the decorator lookup returns nothing', async () => {
            mockPaymentsArchitecture();
            mockFetchDecoratorValues.mockResolvedValue([]);

            render(<MemoryRouter><DocumentDetailSection data={paymentsFlow} /></MemoryRouter>);
            fireEvent.click(screen.getByRole('tab', { name: 'Threats' }));

            expect(await screen.findByText(/No threat model applies to this flow/)).toBeInTheDocument();
        });
    });

    it('renders JsonRenderer with correct data', () => {
        const data: Data = {
            id: 'test-id',
            version: '1.0.0',
            name: 'test-namespace',
            calmType: 'Patterns',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        const textarea = screen.getByTestId('monaco-editor');
        expect(textarea).toHaveValue(JSON.stringify(data, null, 2));
    });

    it('shows the version timeline for Standards when multiple versions are available', async () => {
        mockFetchStandardVersions.mockResolvedValue(['2.0.0', '1.0.0']);

        const data: Data = {
            id: '42',
            version: '2.0.0',
            name: 'test-ns',
            calmType: 'Standards',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        // Version browsing moved to the timeline bar, matching the architecture
        // view. The header no longer renders a version dropdown.
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Moment 2.0.0' })).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Moment 1.0.0' })).toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: 'Version' })).not.toBeInTheDocument();
    });

    it('navigates to the selected version when a timeline moment is clicked for Standards', async () => {
        mockFetchStandardVersions.mockResolvedValue(['2.0.0', '1.0.0']);

        const data: Data = {
            id: '42',
            version: '2.0.0',
            name: 'test-ns',
            calmType: 'Standards',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Moment 1.0.0' })).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: 'Moment 1.0.0' }));

        expect(mockNavigate).toHaveBeenCalledWith('/test-ns/standards/42/1.0.0');
    });

    it('shows the version timeline for Flows when multiple versions are available', async () => {
        mockFetchFlowVersions.mockResolvedValue(['3.0.0', '2.0.0', '1.0.0']);

        const data: Data = {
            id: '99',
            version: '3.0.0',
            name: 'flow-ns',
            calmType: 'Flows',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Moment 3.0.0' })).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Moment 2.0.0' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Moment 1.0.0' })).toBeInTheDocument();
    });

    it('uses fetchVersionsByCustomId when the resource ID is a slug', async () => {
        mockFetchVersionsByCustomId.mockResolvedValue(['2.0.0', '1.0.0']);

        const data: Data = {
            id: 'my-payment-standard',
            version: '2.0.0',
            name: 'test-ns',
            calmType: 'Standards',
            data: undefined,
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        // isSlug ids still fetch via fetchVersionsByCustomId; assert on the
        // timeline moment now that the header dropdown is gone.
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Moment 2.0.0' })).toBeInTheDocument();
        });

        expect(mockFetchVersionsByCustomId).toHaveBeenCalledWith('test-ns', 'my-payment-standard', 'Standards');
        expect(mockFetchStandardVersions).not.toHaveBeenCalled();
    });

    it('renders markdown content when data is a markdown string', () => {
        const data: Data = {
            id: 'std-123',
            version: 'latest',
            name: 'test-ns',
            calmType: 'Standards',
            data: '# TLS Policy\n\nAll services must use TLS 1.2+.',
        };

        render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        expect(screen.getByText('All services must use TLS 1.2+.')).toBeInTheDocument();
    });

    it('shows display name from markdown heading in breadcrumb', () => {
        const data: Data = {
            id: '12345',
            version: 'latest',
            name: 'test-ns',
            calmType: 'Standards',
            data: '# My Standard Name\n\nContent.',
        };

        const { container } = render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        expect(container.textContent).toContain('My Standard Name');
    });

    it('shows type label in breadcrumb', () => {
        const data: Data = {
            id: 'std-1',
            version: 'latest',
            name: 'fae-calm',
            calmType: 'Standards',
            data: '# Test\n\nBody.',
        };

        const { container } = render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        expect(container.textContent).toContain('Standard');
    });

    it('renders a JSON string with leading whitespace as JSON, not markdown', () => {
        const data: Data = {
            id: 'std-json',
            version: 'latest',
            name: 'test-ns',
            calmType: 'Standards',
            data: '  \n{"unique-id": "std-json"}',
        };

        const { container } = render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        expect(container.querySelector('.prose')).toBeNull();
    });

    it('falls back to the document id in the breadcrumb when markdown has no heading', () => {
        const data: Data = {
            id: 'std-no-heading',
            version: 'latest',
            name: 'test-ns',
            calmType: 'Standards',
            data: 'Plain prose with no heading.',
        };

        const { container } = render(
            <MemoryRouter>
                <DocumentDetailSection data={data} />
            </MemoryRouter>
        );

        expect(container.querySelector('.prose')).not.toBeNull();
        expect(container.textContent).toContain('std-no-heading');
    });
});
