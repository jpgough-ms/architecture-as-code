package org.finos.calm.store.mongo;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import org.bson.Document;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@QuarkusTest
public class TestMongoSearchStoreShould {

    @InjectMock
    MongoDatabase mongoDatabase;

    private MongoSearchStore mongoSearchStore;

    private MongoCollection<Document> architectureCollection;
    private MongoCollection<Document> patternCollection;
    private MongoCollection<Document> flowCollection;
    private MongoCollection<Document> standardCollection;
    private MongoCollection<Document> interfaceCollection;
    private MongoCollection<Document> controlCollection;
    private MongoCollection<Document> adrCollection;

    @BeforeEach
    void setup() {
        architectureCollection = Mockito.mock(DocumentMongoCollection.class);
        patternCollection = Mockito.mock(DocumentMongoCollection.class);
        flowCollection = Mockito.mock(DocumentMongoCollection.class);
        standardCollection = Mockito.mock(DocumentMongoCollection.class);
        interfaceCollection = Mockito.mock(DocumentMongoCollection.class);
        controlCollection = Mockito.mock(DocumentMongoCollection.class);
        adrCollection = Mockito.mock(DocumentMongoCollection.class);

        when(mongoDatabase.getCollection("architectures")).thenReturn(architectureCollection);
        when(mongoDatabase.getCollection("patterns")).thenReturn(patternCollection);
        when(mongoDatabase.getCollection("flows")).thenReturn(flowCollection);
        when(mongoDatabase.getCollection("standards")).thenReturn(standardCollection);
        when(mongoDatabase.getCollection("interfaces")).thenReturn(interfaceCollection);
        when(mongoDatabase.getCollection("controls")).thenReturn(controlCollection);
        when(mongoDatabase.getCollection("adrs")).thenReturn(adrCollection);

        mongoSearchStore = new MongoSearchStore(mongoDatabase);
    }

    @Test
    void return_empty_results_when_no_matches() {
        mockEmptyAggregation(architectureCollection);
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("nonexistent");

        assertThat(results.getResults().get("architectures"), is(empty()));
        assertThat(results.getResults().get("patterns"), is(empty()));
        assertThat(results.getResults().get("flows"), is(empty()));
        assertThat(results.getResults().get("standards"), is(empty()));
        assertThat(results.getResults().get("interfaces"), is(empty()));
        assertThat(results.getResults().get("controls"), is(empty()));
        assertThat(results.getResults().get("adrs"), is(empty()));
    }

    @Test
    void return_results_grouped_by_type_when_matches_found() {
        Document archResult = new Document("namespace", "finos")
                .append("id", 1)
                .append("name", "API Gateway")
                .append("description", "Gateway architecture");
        mockAggregationWithResults(architectureCollection, List.of(archResult));

        Document patternResult = new Document("namespace", "finos")
                .append("id", 2)
                .append("name", "API Pattern")
                .append("description", "Pattern for APIs");
        mockAggregationWithResults(patternCollection, List.of(patternResult));

        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("API");

        List<SearchResult> architectures = results.getResults().get("architectures");
        assertThat(architectures, hasSize(1));
        assertThat(architectures.get(0).getName(), is("API Gateway"));
        assertThat(architectures.get(0).getNamespace(), is("finos"));
        assertThat(architectures.get(0).getId(), is(1));

        List<SearchResult> patterns = results.getResults().get("patterns");
        assertThat(patterns, hasSize(1));
        assertThat(patterns.get(0).getName(), is("API Pattern"));
    }

    @Test
    void return_all_seven_groups_even_with_empty_results() {
        mockEmptyAggregation(architectureCollection);
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("test");

        assertThat(results.getResults().keySet(), hasSize(7));
        assertThat(results.getResults().keySet(), containsInAnyOrder(
                "architectures", "patterns", "flows", "standards", "interfaces", "controls", "adrs"));
    }

    @Test
    void handle_null_name_and_description_gracefully() {
        Document archResult = new Document("namespace", "finos")
                .append("id", 5)
                .append("name", null)
                .append("description", null);
        mockAggregationWithResults(architectureCollection, List.of(archResult));
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("test");

        List<SearchResult> architectures = results.getResults().get("architectures");
        assertThat(architectures, hasSize(1));
        assertThat(architectures.get(0).getName(), is("architectures 5"));
        assertThat(architectures.get(0).getDescription(), is(""));
    }

    @Test
    void escape_regex_special_characters() {
        String escaped = MongoSearchStore.escapeRegex("test.*+?^${}()|[]\\");
        assertThat(escaped, startsWith("\\Q"));
        assertThat(escaped, endsWith("\\E"));
        // Pattern.quote wraps in \Q...\E so the special chars are treated as literals
        assertThat(escaped, is(java.util.regex.Pattern.quote("test.*+?^${}()|[]\\")));
    }

    @Test
    void return_control_results_with_domain_as_namespace() {
        Document controlResult = new Document("namespace", "security")
                .append("id", 1)
                .append("name", "Data Encryption")
                .append("description", "Encrypt all data at rest");
        mockAggregationWithResults(controlCollection, List.of(controlResult));
        mockEmptyAggregation(architectureCollection);
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("encryption");

        List<SearchResult> controls = results.getResults().get("controls");
        assertThat(controls, hasSize(1));
        assertThat(controls.get(0).getName(), is("Data Encryption"));
        assertThat(controls.get(0).getNamespace(), is("security"));
        assertThat(controls.get(0).getType(), is("controls"));
    }

    @Test
    void return_adr_results_with_title_and_status() {
        Document adrResult = new Document("namespace", "finos")
                .append("id", 3)
                .append("title", "Use MongoDB")
                .append("status", "accepted");
        mockAggregationWithResults(adrCollection, List.of(adrResult));
        mockEmptyAggregation(architectureCollection);
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);

        GroupedSearchResults results = mongoSearchStore.search("MongoDB");

        List<SearchResult> adrs = results.getResults().get("adrs");
        assertThat(adrs, hasSize(1));
        assertThat(adrs.get(0).getName(), is("Use MongoDB"));
        assertThat(adrs.get(0).getDescription(), is("accepted"));
    }

    @Test
    void handle_aggregation_exception_gracefully() {
        when(architectureCollection.aggregate(any(List.class)))
                .thenThrow(new RuntimeException("MongoDB connection lost"));
        mockEmptyAggregation(patternCollection);
        mockEmptyAggregation(flowCollection);
        mockEmptyAggregation(standardCollection);
        mockEmptyAggregation(interfaceCollection);
        mockEmptyAggregation(controlCollection);
        mockEmptyAggregation(adrCollection);

        GroupedSearchResults results = mongoSearchStore.search("test");

        assertThat(results.getResults().get("architectures"), is(empty()));
        assertThat(results.getResults().get("patterns"), is(empty()));
    }

    @SuppressWarnings("unchecked")
    private void mockEmptyAggregation(MongoCollection<Document> collection) {
        AggregateIterable<Document> aggregateIterable = Mockito.mock(AggregateIterable.class);
        when(collection.aggregate(any(List.class))).thenReturn(aggregateIterable);
        when(aggregateIterable.spliterator()).thenReturn(Collections.<Document>emptyList().spliterator());
        when(aggregateIterable.iterator()).thenReturn(Mockito.mock(MongoCursor.class));
    }

    @SuppressWarnings("unchecked")
    private void mockAggregationWithResults(MongoCollection<Document> collection, List<Document> results) {
        AggregateIterable<Document> aggregateIterable = Mockito.mock(AggregateIterable.class);
        when(collection.aggregate(any(List.class))).thenReturn(aggregateIterable);
        when(aggregateIterable.spliterator()).thenReturn(results.spliterator());
        MongoCursor<Document> cursor = Mockito.mock(MongoCursor.class);
        Iterator<Document> realIterator = results.iterator();
        when(cursor.hasNext()).thenAnswer(inv -> realIterator.hasNext());
        when(cursor.next()).thenAnswer(inv -> realIterator.next());
        when(aggregateIterable.iterator()).thenReturn(cursor);
    }

    private interface DocumentMongoCollection extends MongoCollection<Document> {
    }
}
