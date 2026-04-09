package org.finos.calm.mcp.tools;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.inject.Inject;
import org.finos.calm.domain.controls.ControlDetail;
import org.finos.calm.domain.exception.ControlNotFoundException;
import org.finos.calm.domain.exception.ControlRequirementVersionNotFoundException;
import org.finos.calm.domain.exception.DomainNotFoundException;
import org.finos.calm.store.ControlStore;

import java.util.List;

public class ControlTools {

    @Inject
    ControlStore controlStore;

    @Tool(description = "List all control requirements in a domain (e.g. 'api-threats'). Returns control IDs, names, and descriptions.")
    String listControls(
            @ToolArg(description = "The domain to list controls for (e.g. 'api-threats')") String domain) {
        try {
            List<ControlDetail> controls = controlStore.getControlsForDomain(domain);
            if (controls.isEmpty()) {
                return "No controls found in domain '" + domain + "'.";
            }
            StringBuilder sb = new StringBuilder("Controls in domain '" + domain + "':\n");
            for (ControlDetail control : controls) {
                sb.append("- ID: ").append(control.getId());
                if (control.getName() != null) {
                    sb.append(", Name: ").append(control.getName());
                }
                if (control.getDescription() != null) {
                    sb.append(", Description: ").append(control.getDescription());
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (DomainNotFoundException e) {
            return "Error: Domain '" + domain + "' not found.";
        }
    }

    @Tool(description = "Get the full JSON content of a specific control requirement version.")
    String getControlRequirement(
            @ToolArg(description = "The domain containing the control") String domain,
            @ToolArg(description = "The control ID (integer)") int controlId,
            @ToolArg(description = "The version string (e.g. '1.0.0')") String version) {
        try {
            return controlStore.getRequirementForVersion(domain, controlId, version);
        } catch (DomainNotFoundException e) {
            return "Error: Domain '" + domain + "' not found.";
        } catch (ControlNotFoundException e) {
            return "Error: Control " + controlId + " not found in domain '" + domain + "'.";
        } catch (ControlRequirementVersionNotFoundException e) {
            return "Error: Version '" + version + "' not found for control " + controlId + ".";
        }
    }

    @Tool(description = "List available versions for a specific control requirement.")
    String listControlVersions(
            @ToolArg(description = "The domain containing the control") String domain,
            @ToolArg(description = "The control ID (integer)") int controlId) {
        try {
            List<String> versions = controlStore.getRequirementVersions(domain, controlId);
            if (versions.isEmpty()) {
                return "No versions found for control " + controlId + " in domain '" + domain + "'.";
            }
            StringBuilder sb = new StringBuilder("Versions for control " + controlId + ":\n");
            for (String version : versions) {
                sb.append("- ").append(version).append("\n");
            }
            return sb.toString();
        } catch (DomainNotFoundException e) {
            return "Error: Domain '" + domain + "' not found.";
        } catch (ControlNotFoundException e) {
            return "Error: Control " + controlId + " not found in domain '" + domain + "'.";
        }
    }
}
