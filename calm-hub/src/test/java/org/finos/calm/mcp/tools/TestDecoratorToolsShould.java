package org.finos.calm.mcp.tools;

import org.finos.calm.domain.Decorator;
import org.finos.calm.domain.exception.DecoratorNotFoundException;
import org.finos.calm.domain.exception.NamespaceNotFoundException;
import org.finos.calm.store.DecoratorStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestDecoratorToolsShould {

    @Mock
    DecoratorStore decoratorStore;

    @InjectMocks
    DecoratorTools decoratorTools;

    @Test
    void return_decorators_for_namespace() throws NamespaceNotFoundException {
        Decorator dec = new Decorator.DecoratorBuilder()
                .setUniqueId("test-decorator")
                .setType("threat-model")
                .setTarget(List.of("/calm/namespaces/workshop/architectures/1/versions/1-0-0"))
                .build();

        when(decoratorStore.getDecoratorValuesForNamespace("workshop", null, "threat-model"))
                .thenReturn(List.of(dec));

        String result = decoratorTools.listDecorators("workshop", "", "threat-model");

        assertThat(result, containsString("test-decorator"));
        assertThat(result, containsString("threat-model"));
    }

    @Test
    void return_no_decorators_message_when_empty() throws NamespaceNotFoundException {
        when(decoratorStore.getDecoratorValuesForNamespace("workshop", null, null))
                .thenReturn(List.of());

        String result = decoratorTools.listDecorators("workshop", "", "");

        assertThat(result, containsString("No decorators found"));
    }

    @Test
    void return_error_for_missing_namespace() throws NamespaceNotFoundException {
        when(decoratorStore.getDecoratorValuesForNamespace("missing", null, null))
                .thenThrow(new NamespaceNotFoundException());

        String result = decoratorTools.listDecorators("missing", "", "");

        assertThat(result, startsWith("Error:"));
    }

    @Test
    void return_decorator_by_id() throws Exception {
        Decorator dec = new Decorator.DecoratorBuilder()
                .setUniqueId("threat-model-1")
                .setType("threat-model")
                .setTarget(List.of("/calm/ns/1"))
                .setTargetType(List.of("architecture"))
                .setAppliesTo(List.of("node-1"))
                .setData("test-data")
                .build();

        when(decoratorStore.getDecoratorById("workshop", 1))
                .thenReturn(Optional.of(dec));

        String result = decoratorTools.getDecorator("workshop", 1);

        assertThat(result, containsString("threat-model-1"));
        assertThat(result, containsString("threat-model"));
    }

    @Test
    void return_error_when_decorator_not_found() throws Exception {
        when(decoratorStore.getDecoratorById("workshop", 99))
                .thenThrow(new DecoratorNotFoundException());

        String result = decoratorTools.getDecorator("workshop", 99);

        assertThat(result, startsWith("Error:"));
    }

    @Test
    void create_decorator_successfully() throws NamespaceNotFoundException {
        when(decoratorStore.createDecorator(eq("workshop"), anyString()))
                .thenReturn(5);

        String result = decoratorTools.createDecorator("workshop", "{\"type\":\"threat-model\"}");

        assertThat(result, containsString("created successfully"));
        assertThat(result, containsString("5"));
    }

    @Test
    void return_error_when_creating_in_missing_namespace() throws NamespaceNotFoundException {
        when(decoratorStore.createDecorator(eq("missing"), anyString()))
                .thenThrow(new NamespaceNotFoundException());

        String result = decoratorTools.createDecorator("missing", "{}");

        assertThat(result, startsWith("Error:"));
    }

    @Test
    void update_decorator_successfully() throws Exception {
        String result = decoratorTools.updateDecorator("workshop", 1, "{\"updated\":true}");

        assertThat(result, containsString("updated successfully"));
    }

    @Test
    void return_error_when_updating_nonexistent_decorator() throws Exception {
        org.mockito.Mockito.doThrow(new DecoratorNotFoundException())
                .when(decoratorStore).updateDecorator(eq("workshop"), eq(99), anyString());

        String result = decoratorTools.updateDecorator("workshop", 99, "{}");

        assertThat(result, startsWith("Error:"));
    }
}
