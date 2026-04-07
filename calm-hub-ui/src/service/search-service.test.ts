import { describe, it, expect, afterEach } from 'vitest';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SearchService } from './search-service.js';
import axios from 'axios';

const ax = axios.create();
const mock = new AxiosMockAdapter(ax as never);

describe('SearchService', () => {
    const searchService = new SearchService(ax);

    afterEach(() => {
        mock.reset();
    });

    describe('search', () => {
        it('should call the correct endpoint and return grouped results', async () => {
            const mockResults = {
                architectures: [{ type: 'architectures', namespace: 'finos', id: 1, name: 'API Gateway', description: 'Gateway' }],
                patterns: [],
                flows: [],
                standards: [],
                interfaces: [],
                controls: [],
                adrs: [],
            };
            mock.onGet('/calm/search?q=API').reply(200, { results: mockResults });

            const result = await searchService.search('API');
            expect(result).toEqual(mockResults);
        });

        it('should encode special characters in query', async () => {
            const mockResults = {
                architectures: [],
                patterns: [],
                flows: [],
                standards: [],
                interfaces: [],
                controls: [],
                adrs: [],
            };
            mock.onGet('/calm/search?q=hello%20world').reply(200, { results: mockResults });

            const result = await searchService.search('hello world');
            expect(result).toEqual(mockResults);
        });

        it('should return empty object when results is missing', async () => {
            mock.onGet('/calm/search?q=test').reply(200, {});

            const result = await searchService.search('test');
            expect(result).toEqual({});
        });

        it('should throw an error when backend returns error status', async () => {
            mock.onGet('/calm/search?q=error').reply(500);

            await expect(searchService.search('error')).rejects.toThrow(
                'Error performing search:'
            );
        });

        it('should throw an error when backend returns 400', async () => {
            mock.onGet('/calm/search?q=').reply(400);

            await expect(searchService.search('')).rejects.toThrow(
                'Error performing search:'
            );
        });
    });
});
