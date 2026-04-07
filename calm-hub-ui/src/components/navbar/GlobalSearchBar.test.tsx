import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearchBar } from './GlobalSearchBar';
import { SearchService } from '../../service/search-service.js';
import { CalmService } from '../../service/calm-service.js';
import { AdrService } from '../../service/adr-service/adr-service.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function createMockSearchService(results = {}) {
    return {
        search: vi.fn().mockResolvedValue(results),
    } as unknown as SearchService;
}

function createMockCalmService(versions: string[] = ['1-0-0']) {
    return {
        fetchArchitectureVersions: vi.fn().mockResolvedValue(versions),
        fetchPatternVersions: vi.fn().mockResolvedValue(versions),
        fetchFlowVersions: vi.fn().mockResolvedValue(versions),
        fetchStandardVersions: vi.fn().mockResolvedValue(versions),
    } as unknown as CalmService;
}

function createMockAdrService(revisions: number[] = [1]) {
    return {
        fetchAdrRevisions: vi.fn().mockResolvedValue(revisions),
    } as unknown as AdrService;
}

function renderSearchBar(searchService?: SearchService, calmService?: CalmService, adrService?: AdrService) {
    return render(
        <MemoryRouter>
            <GlobalSearchBar searchService={searchService} calmService={calmService} adrService={adrService} />
        </MemoryRouter>
    );
}

describe('GlobalSearchBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders search input', () => {
        renderSearchBar();
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search all resources...')).toBeInTheDocument();
    });

    it('does not show dropdown initially', () => {
        renderSearchBar();
        expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
    });

    it('shows clear button when query is entered', () => {
        renderSearchBar();
        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } });
        expect(screen.getByTestId('clear-search')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', () => {
        renderSearchBar();
        const input = screen.getByTestId('search-input');
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.click(screen.getByTestId('clear-search'));
        expect(input).toHaveValue('');
    });

    it('debounces search calls', async () => {
        const mockService = createMockSearchService();
        renderSearchBar(mockService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'API' } });

        expect(mockService.search).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(mockService.search).toHaveBeenCalledWith('API');
    });

    it('displays grouped results in dropdown', async () => {
        const mockResults = {
            architectures: [
                { type: 'architectures', namespace: 'finos', id: 1, name: 'API Gateway', description: 'Gateway architecture' },
            ],
            patterns: [
                { type: 'patterns', namespace: 'finos', id: 2, name: 'API Pattern', description: 'Pattern for APIs' },
            ],
            flows: [],
            standards: [],
            interfaces: [],
            controls: [],
            adrs: [],
        };
        const mockService = createMockSearchService(mockResults);
        renderSearchBar(mockService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'API' } });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
        });

        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('API Pattern')).toBeInTheDocument();
        expect(screen.getByText('Architectures')).toBeInTheDocument();
        expect(screen.getByText('Patterns')).toBeInTheDocument();
    });

    it('shows no results message when search returns empty', async () => {
        const mockResults = {
            architectures: [],
            patterns: [],
            flows: [],
            standards: [],
            interfaces: [],
            controls: [],
            adrs: [],
        };
        const mockService = createMockSearchService(mockResults);
        renderSearchBar(mockService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'nonexistent' } });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
        });

        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('navigates to resource with resolved latest version on result click', async () => {
        const mockResults = {
            architectures: [
                { type: 'architectures', namespace: 'finos', id: 1, name: 'API Gateway', description: 'Gateway' },
            ],
            patterns: [],
            flows: [],
            standards: [],
            interfaces: [],
            controls: [],
            adrs: [],
        };
        const mockService = createMockSearchService(mockResults);
        const mockCalmService = createMockCalmService(['1-0-0', '2-0-0']);
        renderSearchBar(mockService, mockCalmService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'API' } });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('API Gateway')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('API Gateway'));

        await waitFor(() => {
            expect(mockCalmService.fetchArchitectureVersions).toHaveBeenCalledWith('finos', '1');
            expect(mockNavigate).toHaveBeenCalledWith('/finos/architectures/1/2-0-0');
        });
    });

    it('navigates to ADR with resolved latest revision on result click', async () => {
        const mockResults = {
            architectures: [],
            patterns: [],
            flows: [],
            standards: [],
            interfaces: [],
            controls: [],
            adrs: [
                { type: 'adrs', namespace: 'finos', id: 42, name: 'Use Event Sourcing', description: '' },
            ],
        };
        const mockService = createMockSearchService(mockResults);
        const mockAdrService = createMockAdrService([1, 2, 3]);
        renderSearchBar(mockService, undefined, mockAdrService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Event' } });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Use Event Sourcing')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Use Event Sourcing'));

        await waitFor(() => {
            expect(mockAdrService.fetchAdrRevisions).toHaveBeenCalledWith('finos', '42');
            expect(mockNavigate).toHaveBeenCalledWith('/finos/adrs/42/3');
        });
    });

    it('closes dropdown on escape key', async () => {
        const mockResults = {
            architectures: [
                { type: 'architectures', namespace: 'finos', id: 1, name: 'API Gateway', description: 'Gateway' },
            ],
            patterns: [],
            flows: [],
            standards: [],
            interfaces: [],
            controls: [],
            adrs: [],
        };
        const mockService = createMockSearchService(mockResults);
        renderSearchBar(mockService);

        fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'API' } });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
        });

        fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Escape' });

        expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
    });
});
