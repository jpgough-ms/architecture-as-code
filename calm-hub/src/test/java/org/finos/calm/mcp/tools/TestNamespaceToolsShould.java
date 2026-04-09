package org.finos.calm.mcp.tools;

import org.finos.calm.domain.exception.NamespaceAlreadyExistsException;
import org.finos.calm.domain.namespaces.NamespaceInfo;
import org.finos.calm.store.DomainStore;
import org.finos.calm.store.NamespaceStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestNamespaceToolsShould {

    @Mock
    NamespaceStore namespaceStore;

    @Mock
    DomainStore domainStore;

    @InjectMocks
    NamespaceTools namespaceTools;

    @Test
    void return_namespaces() {
        when(namespaceStore.getNamespaces())
                .thenReturn(List.of(
                        new NamespaceInfo("finos", "FINOS namespace"),
                        new NamespaceInfo("workshop", "Workshop namespace")
                ));

        String result = namespaceTools.listNamespaces();

        assertThat(result, containsString("finos"));
        assertThat(result, containsString("workshop"));
    }

    @Test
    void return_no_namespaces_message() {
        when(namespaceStore.getNamespaces()).thenReturn(List.of());

        String result = namespaceTools.listNamespaces();

        assertThat(result, containsString("No namespaces found"));
    }

    @Test
    void create_namespace_successfully() throws NamespaceAlreadyExistsException {
        String result = namespaceTools.createNamespace("test", "A test namespace");

        assertThat(result, containsString("created successfully"));
    }

    @Test
    void return_error_when_namespace_exists() throws NamespaceAlreadyExistsException {
        org.mockito.Mockito.doThrow(new NamespaceAlreadyExistsException("duplicate"))
                .when(namespaceStore).createNamespace("existing", "desc");

        String result = namespaceTools.createNamespace("existing", "desc");

        assertThat(result, containsString("already exists"));
    }

    @Test
    void return_domains() {
        when(domainStore.getDomains()).thenReturn(List.of("api-threats", "cloud-security"));

        String result = namespaceTools.listDomains();

        assertThat(result, containsString("api-threats"));
        assertThat(result, containsString("cloud-security"));
    }

    @Test
    void return_no_domains_message() {
        when(domainStore.getDomains()).thenReturn(List.of());

        String result = namespaceTools.listDomains();

        assertThat(result, containsString("No domains found"));
    }
}
