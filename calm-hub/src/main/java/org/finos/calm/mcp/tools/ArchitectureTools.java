package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.Architecture;
import org.finos.calm.domain.architecture.NamespaceArchitectureSummary;
import org.finos.calm.domain.exception.ArchitectureNotFoundException;
import org.finos.calm.domain.exception.ArchitectureVersionNotFoundException;
import org.finos.calm.domain.exception.NamespaceNotFoundException;
import org.finos.calm.store.ArchitectureStore;

import java.util.List;

public class ArchitectureTools {

    @Inject
    ArchitectureStore architectureStore;

    @Tool(description = "List all architectures in a CalmHub namespace. Returns architecture IDs, names, and descriptions.")
    String listArchitectures(
            @ToolArg(description = "The namespace to list architectures from (e.g. 'workshop', 'finos')") String namespace) {
        try {
            List<NamespaceArchitectureSummary> architectures = architectureStore.getArchitecturesForNamespace(namespace);
            if (architectures.isEmpty()) {
                return "No architectures found in namespace '" + namespace + "'.";
            }
            StringBuilder sb = new StringBuilder("Architectures in '" + namespace + "':\n");
            for (NamespaceArchitectureSummary arch : architectures) {
                sb.append("- ID: ").append(arch.getId());
                if (arch.getName() != null) {
                    sb.append(", Name: ").append(arch.getName());
                }
                if (arch.getDescription() != null) {
                    sb.append(", Description: ").append(arch.getDescription());
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        }
    }

    @Tool(description = "List available versions of an architecture.")
    String listArchitectureVersions(
            @ToolArg(description = "The namespace containing the architecture") String namespace,
            @ToolArg(description = "The architecture ID (integer)") int architectureId) {
        try {
            Architecture arch = new Architecture.ArchitectureBuilder()
                    .setNamespace(namespace)
                    .setId(architectureId)
                    .build();
            List<String> versions = architectureStore.getArchitectureVersions(arch);
            if (versions.isEmpty()) {
                return "No versions found for architecture " + architectureId + " in namespace '" + namespace + "'.";
            }
            StringBuilder sb = new StringBuilder("Versions for architecture " + architectureId + ":\n");
            for (String version : versions) {
                sb.append("- ").append(version).append("\n");
            }
            return sb.toString();
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        } catch (ArchitectureNotFoundException e) {
            return "Error: Architecture " + architectureId + " not found in namespace '" + namespace + "'.";
        }
    }

    @Tool(description = "Get the full JSON content of a specific architecture version. Use this to analyze architecture nodes, relationships, and controls for threat modeling.")
    String getArchitecture(
            @ToolArg(description = "The namespace containing the architecture") String namespace,
            @ToolArg(description = "The architecture ID (integer)") int architectureId,
            @ToolArg(description = "The version string (e.g. '1.0.0')") String version) {
        try {
            Architecture arch = new Architecture.ArchitectureBuilder()
                    .setNamespace(namespace)
                    .setId(architectureId)
                    .setVersion(version)
                    .build();
            return architectureStore.getArchitectureForVersion(arch);
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        } catch (ArchitectureNotFoundException e) {
            return "Error: Architecture " + architectureId + " not found in namespace '" + namespace + "'.";
        } catch (ArchitectureVersionNotFoundException e) {
            return "Error: Version '" + version + "' not found for architecture " + architectureId + ".";
        }
    }
}
