package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.Decorator;
import org.finos.calm.domain.exception.DecoratorNotFoundException;
import org.finos.calm.domain.exception.NamespaceNotFoundException;
import org.finos.calm.store.DecoratorStore;

import java.util.List;
import java.util.Optional;

public class DecoratorTools {

    @Inject
    DecoratorStore decoratorStore;

    @Tool(description = "List decorators in a namespace, optionally filtered by target architecture path and/or type (e.g. 'threat-model', 'deployment').")
    String listDecorators(
            @ToolArg(description = "The namespace to list decorators from") String namespace,
            @ToolArg(description = "Optional: filter by target path (e.g. '/calm/namespaces/workshop/architectures/1/versions/1-0-0')") String target,
            @ToolArg(description = "Optional: filter by decorator type (e.g. 'threat-model', 'deployment')") String type) {
        try {
            String targetFilter = (target != null && !target.isBlank()) ? target : null;
            String typeFilter = (type != null && !type.isBlank()) ? type : null;

            List<Decorator> decorators = decoratorStore.getDecoratorValuesForNamespace(namespace, targetFilter, typeFilter);
            if (decorators.isEmpty()) {
                return "No decorators found in namespace '" + namespace + "'" +
                        (typeFilter != null ? " with type '" + typeFilter + "'" : "") +
                        (targetFilter != null ? " targeting '" + targetFilter + "'" : "") + ".";
            }
            StringBuilder sb = new StringBuilder("Decorators in '" + namespace + "':\n");
            for (Decorator dec : decorators) {
                sb.append("- unique-id: ").append(dec.getUniqueId())
                  .append(", type: ").append(dec.getType())
                  .append(", target: ").append(dec.getTarget())
                  .append("\n");
            }
            return sb.toString();
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        }
    }

    @Tool(description = "Get a specific decorator by its numeric ID in a namespace. Returns the full decorator JSON including data payload.")
    String getDecorator(
            @ToolArg(description = "The namespace containing the decorator") String namespace,
            @ToolArg(description = "The decorator numeric ID") int decoratorId) {
        try {
            Optional<Decorator> decorator = decoratorStore.getDecoratorById(namespace, decoratorId);
            if (decorator.isEmpty()) {
                return "Decorator " + decoratorId + " not found in namespace '" + namespace + "'.";
            }
            Decorator dec = decorator.get();
            return "Decorator " + decoratorId + ":\n" +
                    "  unique-id: " + dec.getUniqueId() + "\n" +
                    "  type: " + dec.getType() + "\n" +
                    "  target: " + dec.getTarget() + "\n" +
                    "  target-type: " + dec.getTargetType() + "\n" +
                    "  applies-to: " + dec.getAppliesTo() + "\n" +
                    "  data: " + dec.getData();
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        } catch (DecoratorNotFoundException e) {
            return "Error: Decorator " + decoratorId + " not found in namespace '" + namespace + "'.";
        }
    }

    @Tool(description = "Create a new decorator in a namespace. Use this to store threat model results, deployments, or other decorator data. Returns the assigned decorator ID.")
    String createDecorator(
            @ToolArg(description = "The namespace to create the decorator in") String namespace,
            @ToolArg(description = "The decorator JSON payload (must include $schema, unique-id, type, target, target-type, applies-to, and data fields)") String decoratorJson) {
        try {
            int id = decoratorStore.createDecorator(namespace, decoratorJson);
            return "Decorator created successfully with ID: " + id;
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        }
    }

    @Tool(description = "Update an existing decorator in a namespace.")
    String updateDecorator(
            @ToolArg(description = "The namespace containing the decorator") String namespace,
            @ToolArg(description = "The decorator numeric ID to update") int decoratorId,
            @ToolArg(description = "The updated decorator JSON payload") String decoratorJson) {
        try {
            decoratorStore.updateDecorator(namespace, decoratorId, decoratorJson);
            return "Decorator " + decoratorId + " updated successfully.";
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        } catch (DecoratorNotFoundException e) {
            return "Error: Decorator " + decoratorId + " not found in namespace '" + namespace + "'.";
        }
    }
}
