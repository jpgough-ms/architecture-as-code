package org.finos.calm.mcp.tools;

import org.finos.calm.domain.controls.ControlDetail;
import org.finos.calm.domain.exception.ControlNotFoundException;
import org.finos.calm.domain.exception.ControlRequirementVersionNotFoundException;
import org.finos.calm.domain.exception.DomainNotFoundException;
import org.finos.calm.store.ControlStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestControlToolsShould {

    @Mock
    ControlStore controlStore;

    @InjectMocks
    ControlTools controlTools;

    @Test
    void return_controls_for_domain() throws DomainNotFoundException {
        when(controlStore.getControlsForDomain("api-threats"))
                .thenReturn(List.of(
                        new ControlDetail(1, "BOLA", "Broken Object Level Authorization"),
                        new ControlDetail(2, "Broken Auth", "Broken Authentication")
                ));

        String result = controlTools.listControls("api-threats");

        assertThat(result, containsString("BOLA"));
        assertThat(result, containsString("Broken Auth"));
        assertThat(result, containsString("api-threats"));
    }

    @Test
    void return_empty_message_when_no_controls() throws DomainNotFoundException {
        when(controlStore.getControlsForDomain("empty-domain"))
                .thenReturn(List.of());

        String result = controlTools.listControls("empty-domain");

        assertThat(result, containsString("No controls found"));
    }

    @Test
    void return_error_for_missing_domain() throws DomainNotFoundException {
        when(controlStore.getControlsForDomain("missing"))
                .thenThrow(new DomainNotFoundException("missing"));

        String result = controlTools.listControls("missing");

        assertThat(result, startsWith("Error:"));
    }

    @Test
    void return_control_requirement_json() throws Exception {
        when(controlStore.getRequirementForVersion("api-threats", 1, "1.0.0"))
                .thenReturn("{\"name\":\"BOLA\",\"description\":\"...\"}");

        String result = controlTools.getControlRequirement("api-threats", 1, "1.0.0");

        assertThat(result, containsString("BOLA"));
    }

    @Test
    void return_error_for_missing_control_version() throws Exception {
        when(controlStore.getRequirementForVersion("api-threats", 1, "9.9.9"))
                .thenThrow(new ControlRequirementVersionNotFoundException());

        String result = controlTools.getControlRequirement("api-threats", 1, "9.9.9");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("Version"));
    }

    @Test
    void return_control_versions() throws Exception {
        when(controlStore.getRequirementVersions("api-threats", 1))
                .thenReturn(List.of("1.0.0", "2.0.0"));

        String result = controlTools.listControlVersions("api-threats", 1);

        assertThat(result, containsString("1.0.0"));
        assertThat(result, containsString("2.0.0"));
    }

    @Test
    void return_error_when_control_not_found_for_versions() throws Exception {
        when(controlStore.getRequirementVersions("api-threats", 99))
                .thenThrow(new ControlNotFoundException());

        String result = controlTools.listControlVersions("api-threats", 99);

        assertThat(result, startsWith("Error:"));
    }
}
