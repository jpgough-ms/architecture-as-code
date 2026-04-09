package org.finos.calm.mcp.tools;

import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.finos.calm.store.SearchStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestSearchToolsShould {

    @Mock
    SearchStore searchStore;

    @InjectMocks
    SearchTools searchTools;

    @Test
    void return_grouped_results_for_valid_query() {
        Map<String, List<SearchResult>> resultMap = new LinkedHashMap<>();
        resultMap.put("architectures", List.of(
                new SearchResult("architectures", "workshop", 1, "Trade Platform", "Trading architecture")
        ));
        resultMap.put("controls", List.of(
                new SearchResult("controls", "api-threats", 2, "BOLA", "Broken Object Level Authorization")
        ));

        when(searchStore.search("trade")).thenReturn(new GroupedSearchResults(resultMap));

        String result = searchTools.searchHub("trade");

        assertThat(result, containsString("Search results for 'trade'"));
        assertThat(result, containsString("architectures:"));
        assertThat(result, containsString("Trade Platform"));
        assertThat(result, containsString("Namespace: workshop"));
        assertThat(result, containsString("controls:"));
        assertThat(result, containsString("BOLA"));
    }

    @Test
    void return_no_results_message_for_empty_search() {
        when(searchStore.search("nonexistent")).thenReturn(new GroupedSearchResults());

        String result = searchTools.searchHub("nonexistent");

        assertThat(result, containsString("No results found"));
    }

    @Test
    void return_no_results_when_all_groups_empty() {
        Map<String, List<SearchResult>> resultMap = new LinkedHashMap<>();
        resultMap.put("architectures", List.of());
        resultMap.put("controls", List.of());

        when(searchStore.search("nothing")).thenReturn(new GroupedSearchResults(resultMap));

        String result = searchTools.searchHub("nothing");

        assertThat(result, containsString("No results found"));
    }

    @Test
    void return_error_for_null_query() {
        String result = searchTools.searchHub(null);

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("blank"));
    }

    @Test
    void return_error_for_blank_query() {
        String result = searchTools.searchHub("   ");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("blank"));
    }

    @Test
    void return_error_for_query_exceeding_max_length() {
        String longQuery = "a".repeat(201);

        String result = searchTools.searchHub(longQuery);

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("200"));
    }
}
