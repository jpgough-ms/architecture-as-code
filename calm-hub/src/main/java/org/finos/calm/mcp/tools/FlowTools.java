package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.Flow;
import org.finos.calm.domain.exception.FlowNotFoundException;
import org.finos.calm.domain.exception.FlowVersionNotFoundException;
import org.finos.calm.domain.exception.NamespaceNotFoundException;
import org.finos.calm.domain.flow.NamespaceFlowSummary;
import org.finos.calm.store.FlowStore;

import java.util.List;

public class FlowTools {

    @Inject
    FlowStore flowStore;

    @Tool(description = "List all flows in a CalmHub namespace.")
    String listFlows(
            @ToolArg(description = "The namespace to list flows from") String namespace) {
        try {
            List<NamespaceFlowSummary> flows = flowStore.getFlowsForNamespace(namespace);
            if (flows.isEmpty()) {
                return "No flows found in namespace '" + namespace + "'.";
            }
            StringBuilder sb = new StringBuilder("Flows in '" + namespace + "':\n");
            for (NamespaceFlowSummary flow : flows) {
                sb.append("- ID: ").append(flow.getId());
                if (flow.getName() != null) {
                    sb.append(", Name: ").append(flow.getName());
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        }
    }

    @Tool(description = "Get the full JSON content of a specific flow version.")
    String getFlow(
            @ToolArg(description = "The namespace containing the flow") String namespace,
            @ToolArg(description = "The flow ID (integer)") int flowId,
            @ToolArg(description = "The version string (e.g. '1.0.0')") String version) {
        try {
            Flow flow = new Flow.FlowBuilder()
                    .setNamespace(namespace)
                    .setId(flowId)
                    .setVersion(version)
                    .build();
            return flowStore.getFlowForVersion(flow);
        } catch (NamespaceNotFoundException e) {
            return "Error: Namespace '" + namespace + "' not found.";
        } catch (FlowNotFoundException e) {
            return "Error: Flow " + flowId + " not found in namespace '" + namespace + "'.";
        } catch (FlowVersionNotFoundException e) {
            return "Error: Version '" + version + "' not found for flow " + flowId + ".";
        }
    }
}
