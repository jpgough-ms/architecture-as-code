package org.finos.calm.domain.search;

import java.util.Objects;

public class SearchResult {
    private String type;
    private String namespace;
    private int id;
    private String name;
    private String description;

    public SearchResult(String type, String namespace, int id, String name, String description) {
        this.type = type;
        this.namespace = namespace;
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public String getNamespace() {
        return namespace;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        SearchResult that = (SearchResult) o;
        return id == that.id && Objects.equals(type, that.type) && Objects.equals(namespace, that.namespace) && Objects.equals(name, that.name) && Objects.equals(description, that.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, namespace, id, name, description);
    }
}
