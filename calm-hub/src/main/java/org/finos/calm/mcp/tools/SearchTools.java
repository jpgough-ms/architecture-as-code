package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.finos.calm.store.SearchStore;

import java.util.List;
import java.util.Map;

public class SearchTools {

    private static final int MAX_QUERY_LENGTH = 200;

    @Inject
    SearchStore searchStore;

    @Tool(description = "Search across all resource types in CalmHub. Performs a global search across architectures, patterns, flows, standards, interfaces, controls, and ADRs. Results are grouped by type.")
    String searchHub(
            @ToolArg(description = "The search query string (1-200 characters)") String query) {

        if (query == null || query.isBlank()) {
            return "Error: Search query must not be blank.";
        }

        if (query.length() > MAX_QUERY_LENGTH) {
            return "Error: Search query must not exceed " + MAX_QUERY_LENGTH + " characters.";
        }

        GroupedSearchResults groupedResults = searchStore.search(query);
        Map<String, List<SearchResult>> results = groupedResults.getResults();

        if (results.isEmpty() || results.values().stream().allMatch(List::isEmpty)) {
            return "No results found for '" + query + "'.";
        }

        StringBuilder sb = new StringBuilder("Search results for '" + query + "':\n");
        for (Map.Entry<String, List<SearchResult>> entry : results.entrySet()) {
            List<SearchResult> items = entry.getValue();
            if (items.isEmpty()) {
                continue;
            }
            sb.append("\n").append(entry.getKey()).append(":\n");
            for (SearchResult item : items) {
                sb.append("- ID: ").append(item.getId());
                if (item.getName() != null) {
                    sb.append(", Name: ").append(item.getName());
                }
                if (item.getNamespace() != null) {
                    sb.append(", Namespace: ").append(item.getNamespace());
                }
                if (item.getDescription() != null) {
                    sb.append(", Description: ").append(item.getDescription());
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }
}
