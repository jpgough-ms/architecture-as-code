package org.finos.calm.resources;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.finos.calm.store.SearchStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@QuarkusTest
@ExtendWith(MockitoExtension.class)
public class TestSearchResourceShould {

    @InjectMock
    SearchStore mockSearchStore;

    @Test
    void return_400_when_query_param_is_missing() {
        given()
                .when()
                .get("/calm/search")
                .then()
                .statusCode(400)
                .body(containsString("Query parameter 'q' is required"));
    }

    @Test
    void return_400_when_query_param_is_blank() {
        given()
                .when()
                .get("/calm/search?q=  ")
                .then()
                .statusCode(400)
                .body(containsString("Query parameter 'q' is required"));
    }

    @Test
    void return_400_when_query_param_exceeds_max_length() {
        String longQuery = "a".repeat(201);

        given()
                .when()
                .get("/calm/search?q=" + longQuery)
                .then()
                .statusCode(400)
                .body(containsString("must not exceed"));
    }

    @Test
    void return_200_with_grouped_results_for_valid_query() {
        GroupedSearchResults results = new GroupedSearchResults();
        results.addGroup("architectures", List.of(
                new SearchResult("architectures", "finos", 1, "API Gateway", "Gateway pattern")
        ));
        results.addGroup("patterns", List.of());
        results.addGroup("flows", List.of());
        results.addGroup("standards", List.of());
        results.addGroup("interfaces", List.of());
        results.addGroup("controls", List.of());
        results.addGroup("adrs", List.of());

        when(mockSearchStore.search(anyString())).thenReturn(results);

        given()
                .when()
                .get("/calm/search?q=API")
                .then()
                .statusCode(200)
                .body("results.architectures", hasSize(1))
                .body("results.architectures[0].name", equalTo("API Gateway"))
                .body("results.architectures[0].namespace", equalTo("finos"))
                .body("results.architectures[0].id", equalTo(1))
                .body("results.patterns", hasSize(0));

        verify(mockSearchStore).search("API");
    }

    @Test
    void return_200_with_empty_results_when_no_matches() {
        GroupedSearchResults results = new GroupedSearchResults();
        results.addGroup("architectures", List.of());
        results.addGroup("patterns", List.of());
        results.addGroup("flows", List.of());
        results.addGroup("standards", List.of());
        results.addGroup("interfaces", List.of());
        results.addGroup("controls", List.of());
        results.addGroup("adrs", List.of());

        when(mockSearchStore.search(anyString())).thenReturn(results);

        given()
                .when()
                .get("/calm/search?q=nonexistent")
                .then()
                .statusCode(200)
                .body("results.architectures", hasSize(0))
                .body("results.patterns", hasSize(0))
                .body("results.flows", hasSize(0))
                .body("results.standards", hasSize(0))
                .body("results.interfaces", hasSize(0))
                .body("results.controls", hasSize(0))
                .body("results.adrs", hasSize(0));
    }
}
