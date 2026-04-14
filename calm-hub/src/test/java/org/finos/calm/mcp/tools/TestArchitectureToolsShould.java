package org.finos.calm.mcp.tools;

import org.bson.json.JsonParseException;
import org.finos.calm.domain.Architecture;
import org.finos.calm.domain.architecture.NamespaceArchitectureSummary;
import org.finos.calm.domain.exception.ArchitectureNotFoundException;
import org.finos.calm.domain.exception.ArchitectureVersionNotFoundException;
import org.finos.calm.domain.exception.NamespaceNotFoundException;
import org.finos.calm.store.ArchitectureStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestArchitectureToolsShould {

    @Mock
    ArchitectureStore architectureStore;

    @InjectMocks
    ArchitectureTools architectureTools;

    @Test
    void return_architectures_when_namespace_has_entries() throws NamespaceNotFoundException {
        when(architectureStore.getArchitecturesForNamespace("workshop"))
                .thenReturn(List.of(
                        new NamespaceArchitectureSummary("Conference Signup", "A conference signup architecture", 1)
                ));

        String result = architectureTools.listArchitectures("workshop");

        assertThat(result, containsString("workshop"));
        assertThat(result, containsString("Conference Signup"));
        assertThat(result, containsString("ID: 1"));
    }

    @Test
    void return_no_architectures_message_for_empty_namespace() throws NamespaceNotFoundException {
        when(architectureStore.getArchitecturesForNamespace("empty"))
                .thenReturn(List.of());

        String result = architectureTools.listArchitectures("empty");

        assertThat(result, containsString("No architectures found"));
    }

    @Test
    void return_error_for_nonexistent_namespace() throws NamespaceNotFoundException {
        when(architectureStore.getArchitecturesForNamespace("missing"))
                .thenThrow(new NamespaceNotFoundException());

        String result = architectureTools.listArchitectures("missing");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("not found"));
    }

    @Test
    void return_architecture_json_for_valid_version() throws Exception {
        when(architectureStore.getArchitectureForVersion(any()))
                .thenReturn("{\"nodes\":[],\"relationships\":[]}");

        String result = architectureTools.getArchitecture("workshop", 1, "1.0.0");

        assertThat(result, containsString("nodes"));
    }

    @Test
    void return_error_when_architecture_version_not_found() throws Exception {
        when(architectureStore.getArchitectureForVersion(any()))
                .thenThrow(new ArchitectureVersionNotFoundException());

        String result = architectureTools.getArchitecture("workshop", 1, "9.9.9");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("Version"));
    }

    @Test
    void return_versions_for_valid_architecture() throws Exception {
        when(architectureStore.getArchitectureVersions(any()))
                .thenReturn(List.of("1.0.0", "2.0.0"));

        String result = architectureTools.listArchitectureVersions("workshop", 1);

        assertThat(result, containsString("1.0.0"));
        assertThat(result, containsString("2.0.0"));
    }

    @Test
    void return_error_when_architecture_not_found_for_versions() throws Exception {
        when(architectureStore.getArchitectureVersions(any()))
                .thenThrow(new ArchitectureNotFoundException());

        String result = architectureTools.listArchitectureVersions("workshop", 99);

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("not found"));
    }

    @Test
    void create_architecture_successfully() throws NamespaceNotFoundException {
        Architecture returnedArch = new Architecture.ArchitectureBuilder()
                .setNamespace("workshop")
                .setId(42)
                .setVersion("1.0.0")
                .build();
        when(architectureStore.createArchitectureForNamespace(any()))
                .thenReturn(returnedArch);

        String result = architectureTools.createArchitecture("workshop", "My Arch", "A description", "{\"nodes\":[]}");

        assertThat(result, containsString("ID: 42"));
        assertThat(result, containsString("version 1.0.0"));
        assertThat(result, containsString("workshop"));
    }

    @Test
    void return_error_when_creating_architecture_in_missing_namespace() throws NamespaceNotFoundException {
        when(architectureStore.createArchitectureForNamespace(any()))
                .thenThrow(new NamespaceNotFoundException());

        String result = architectureTools.createArchitecture("missing", "My Arch", "desc", "{}");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("not found"));
    }

    @Test
    void return_error_for_invalid_architecture_json() throws NamespaceNotFoundException {
        when(architectureStore.createArchitectureForNamespace(any()))
                .thenThrow(new JsonParseException("bad json"));

        String result = architectureTools.createArchitecture("workshop", "My Arch", "desc", "not-json");

        assertThat(result, startsWith("Error:"));
        assertThat(result, containsString("Invalid"));
    }
}
