package org.finos.calm.domain.search;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class GroupedSearchResults {
    private Map<String, List<SearchResult>> results;

    public GroupedSearchResults() {
        this.results = new LinkedHashMap<>();
    }

    public GroupedSearchResults(Map<String, List<SearchResult>> results) {
        this.results = results;
    }

    public Map<String, List<SearchResult>> getResults() {
        return results;
    }

    public void addGroup(String type, List<SearchResult> items) {
        results.put(type, items);
    }
}
