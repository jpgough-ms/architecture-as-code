export interface SearchResult {
    type: string;
    namespace: string;
    id: number;
    name: string;
    description: string;
}

export type GroupedSearchResults = Record<string, SearchResult[]>;
