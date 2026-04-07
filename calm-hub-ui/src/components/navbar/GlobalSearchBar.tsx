import { Search, X, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchService } from '../../service/search-service.js';
import { CalmService } from '../../service/calm-service.js';
import { AdrService } from '../../service/adr-service/adr-service.js';
import { GroupedSearchResults, SearchResult } from '../../model/search.js';

const TYPE_LABELS: Record<string, string> = {
    architectures: 'Architectures',
    patterns: 'Patterns',
    flows: 'Flows',
    standards: 'Standards',
    interfaces: 'Interfaces',
    controls: 'Controls',
    adrs: 'ADRs',
};

function typeToUrlSegment(type: string): string {
    switch (type) {
        case 'architectures': return 'architectures';
        case 'patterns': return 'patterns';
        case 'flows': return 'flows';
        case 'standards': return 'standards';
        case 'adrs': return 'adrs';
        default: return type;
    }
}

interface GlobalSearchBarProps {
    searchService?: SearchService;
    calmService?: CalmService;
    adrService?: AdrService;
}

export function GlobalSearchBar({ searchService, calmService: calmServiceProp, adrService: adrServiceProp }: GlobalSearchBarProps) {
    const service = useMemo(() => searchService ?? new SearchService(), [searchService]);
    const calmService = useMemo(() => calmServiceProp ?? new CalmService(), [calmServiceProp]);
    const adrService = useMemo(() => adrServiceProp ?? new AdrService(), [adrServiceProp]);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GroupedSearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const flatResults = useMemo(() => {
        if (!results) return [];
        const flat: { result: SearchResult; type: string }[] = [];
        for (const [type, items] of Object.entries(results)) {
            for (const item of items) {
                flat.push({ result: item, type });
            }
        }
        return flat;
    }, [results]);

    const totalResults = flatResults.length;

    const performSearch = useCallback(
        (searchQuery: string) => {
            if (searchQuery.trim().length === 0) {
                setResults(null);
                setIsOpen(false);
                return;
            }
            setIsLoading(true);
            service
                .search(searchQuery.trim())
                .then((data) => {
                    setResults(data);
                    setIsOpen(true);
                    setSelectedIndex(-1);
                })
                .catch(() => {
                    setResults(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        },
        [service]
    );

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, performSearch]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function resolveLatestVersion(type: string, namespace: string, id: string): Promise<string> {
        let versions: (string | number)[];
        switch (type) {
            case 'architectures':
                versions = await calmService.fetchArchitectureVersions(namespace, id);
                break;
            case 'patterns':
                versions = await calmService.fetchPatternVersions(namespace, id);
                break;
            case 'flows':
                versions = await calmService.fetchFlowVersions(namespace, id);
                break;
            case 'standards':
                versions = await calmService.fetchStandardVersions(namespace, id);
                break;
            case 'adrs':
                versions = await adrService.fetchAdrRevisions(namespace, id);
                break;
            default:
                throw new Error(`Unknown type: ${type}`);
        }
        if (!versions || versions.length === 0) throw new Error('No versions found');
        return String(versions[versions.length - 1]);
    }

    function handleResultClick(result: SearchResult) {
        setIsOpen(false);
        setQuery('');
        setResults(null);

        if (result.type === 'controls' || result.type === 'interfaces') {
            navigate('/');
            return;
        }

        const urlType = typeToUrlSegment(result.type);
        const id = String(result.id);
        resolveLatestVersion(result.type, result.namespace, id)
            .then(version => {
                navigate(`/${result.namespace}/${urlType}/${id}/${version}`);
            })
            .catch(() => {
                navigate(`/${result.namespace}/${urlType}/${id}/1-0-0`);
            });
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen || totalResults === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleResultClick(flatResults[selectedIndex].result);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    }

    function clearSearch() {
        setQuery('');
        setResults(null);
        setIsOpen(false);
        inputRef.current?.focus();
    }

    let flatIndex = -1;

    return (
        <div ref={containerRef} className="relative" data-testid="global-search">
            <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-1.5">
                {isLoading ? (
                    <Loader2 className="w-4 h-4 text-base-content/50 animate-spin" />
                ) : (
                    <Search className="w-4 h-4 text-base-content/50" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search all resources..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (results && query.trim().length > 0) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-sm text-base-content placeholder:text-base-content/40 w-48 lg:w-64"
                    data-testid="search-input"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="btn btn-ghost btn-xs btn-circle"
                        aria-label="Clear search"
                        data-testid="clear-search"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto bg-base-100 border border-base-300 rounded-box shadow-xl z-50"
                    data-testid="search-results-dropdown"
                >
                    {totalResults === 0 && !isLoading && (
                        <div className="p-4 text-sm text-base-content/50 text-center">
                            No results found
                        </div>
                    )}
                    {results &&
                        Object.entries(results).map(([type, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={type}>
                                    <div className="px-3 py-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wider bg-base-200/50 sticky top-0">
                                        {TYPE_LABELS[type] ?? type}
                                    </div>
                                    {items.map((item) => {
                                        flatIndex++;
                                        const currentFlatIndex = flatIndex;
                                        return (
                                            <button
                                                key={`${type}-${item.id}-${item.namespace}`}
                                                className={`w-full text-left px-3 py-2 hover:bg-base-200 cursor-pointer flex flex-col gap-0.5 ${
                                                    currentFlatIndex === selectedIndex ? 'bg-base-200' : ''
                                                }`}
                                                onClick={() => handleResultClick(item)}
                                                data-testid={`search-result-${type}-${item.id}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-base-content truncate">
                                                        {item.name}
                                                    </span>
                                                    <span className="badge badge-xs badge-ghost">
                                                        {item.namespace}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <span className="text-xs text-base-content/50 truncate">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
