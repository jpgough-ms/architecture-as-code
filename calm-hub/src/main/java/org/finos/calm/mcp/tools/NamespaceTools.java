package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.exception.NamespaceAlreadyExistsException;
import org.finos.calm.domain.namespaces.NamespaceInfo;
import org.finos.calm.store.DomainStore;
import org.finos.calm.store.NamespaceStore;

import java.util.List;

public class NamespaceTools {

    @Inject
    NamespaceStore namespaceStore;

    @Inject
    DomainStore domainStore;

    @Tool(description = "List all namespaces available in CalmHub. Returns namespace names and descriptions.")
    String listNamespaces() {
        List<NamespaceInfo> namespaces = namespaceStore.getNamespaces();
        if (namespaces.isEmpty()) {
            return "No namespaces found.";
        }
        StringBuilder sb = new StringBuilder("Namespaces:\n");
        for (NamespaceInfo ns : namespaces) {
            sb.append("- ").append(ns.getName());
            if (ns.getDescription() != null && !ns.getDescription().isEmpty()) {
                sb.append(": ").append(ns.getDescription());
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    @Tool(description = "Create a new namespace in CalmHub.")
    String createNamespace(
            @ToolArg(description = "Name for the new namespace (lowercase, alphanumeric)") String name,
            @ToolArg(description = "Optional description of the namespace") String description) {
        try {
            namespaceStore.createNamespace(name, description);
            return "Namespace '" + name + "' created successfully.";
        } catch (NamespaceAlreadyExistsException e) {
            return "Error: Namespace '" + name + "' already exists.";
        }
    }

    @Tool(description = "List all control domains available in CalmHub (e.g. 'api-threats').")
    String listDomains() {
        List<String> domains = domainStore.getDomains();
        if (domains.isEmpty()) {
            return "No domains found.";
        }
        StringBuilder sb = new StringBuilder("Domains:\n");
        for (String domain : domains) {
            sb.append("- ").append(domain).append("\n");
        }
        return sb.toString();
    }
}
