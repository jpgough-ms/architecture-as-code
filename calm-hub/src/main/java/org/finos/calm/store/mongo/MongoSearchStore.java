package org.finos.calm.store.mongo;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import org.bson.Document;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.finos.calm.store.SearchStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * MongoDB-backed implementation of {@link SearchStore}.
 *
 * <h2>Search strategy</h2>
 * Searches across all namespace-scoped collections (architectures, patterns, flows, standards,
 * interfaces), the domain-scoped controls collection, and the ADRs collection using MongoDB
 * aggregation pipelines. Each pipeline unwinds the nested entity array, matches on name/description
 * (or title for ADRs) using a case-insensitive regex, and projects the results into a uniform shape.
 *
 * <h2>Security</h2>
 * User-supplied query strings are escaped to prevent regex injection (ReDoS) before being
 * used in {@code $regex} operators.
 *
 * <h2>Result limits</h2>
 * Each collection is capped at {@value #MAX_RESULTS_PER_TYPE} results to keep response sizes
 * manageable.
 */
@ApplicationScoped
@Typed(MongoSearchStore.class)
public class MongoSearchStore implements SearchStore {

    private static final Logger LOG = LoggerFactory.getLogger(MongoSearchStore.class);
    static final int MAX_RESULTS_PER_TYPE = 20;

    private final MongoDatabase database;

    public MongoSearchStore(MongoDatabase database) {
        this.database = database;
    }

    @Override
    public GroupedSearchResults search(String query) {
        String escapedQuery = escapeRegex(query);
        GroupedSearchResults results = new GroupedSearchResults();

        results.addGroup("architectures", searchNamespaceScopedCollection(
                "architectures", "architectures", "architectureId", escapedQuery));
        results.addGroup("patterns", searchNamespaceScopedCollection(
                "patterns", "patterns", "patternId", escapedQuery));
        results.addGroup("flows", searchNamespaceScopedCollection(
                "flows", "flows", "flowId", escapedQuery));
        results.addGroup("standards", searchNamespaceScopedCollection(
                "standards", "standards", "standardId", escapedQuery));
        results.addGroup("interfaces", searchNamespaceScopedCollection(
                "interfaces", "interfaces", "interfaceId", escapedQuery));
        results.addGroup("controls", searchControls(escapedQuery));
        results.addGroup("adrs", searchAdrs(escapedQuery));

        return results;
    }

    /**
     * Searches a namespace-scoped collection (one-document-per-namespace with a nested entity array).
     * Uses aggregation: $unwind → $match (regex on name OR description) → $limit → $project.
     */
    private List<SearchResult> searchNamespaceScopedCollection(
            String collectionName, String arrayField, String idField, String escapedQuery) {
        try {
            MongoCollection<Document> collection = database.getCollection(collectionName);
            String type = collectionName;

            List<Document> pipeline = Arrays.asList(
                    new Document("$unwind", "$" + arrayField),
                    new Document("$match", new Document("$or", Arrays.asList(
                            new Document(arrayField + ".name",
                                    new Document("$regex", escapedQuery).append("$options", "i")),
                            new Document(arrayField + ".description",
                                    new Document("$regex", escapedQuery).append("$options", "i"))
                    ))),
                    new Document("$limit", MAX_RESULTS_PER_TYPE),
                    new Document("$project", new Document("namespace", 1)
                            .append("id", "$" + arrayField + "." + idField)
                            .append("name", "$" + arrayField + ".name")
                            .append("description", "$" + arrayField + ".description")
                            .append("_id", 0))
            );

            AggregateIterable<Document> docs = collection.aggregate(pipeline);
            List<SearchResult> resultList = new ArrayList<>();
            for (Document doc : docs) {
                resultList.add(new SearchResult(
                        type,
                        doc.getString("namespace"),
                        doc.getInteger("id", 0),
                        doc.getString("name") != null ? doc.getString("name") : type + " " + doc.getInteger("id", 0),
                        doc.getString("description") != null ? doc.getString("description") : ""
                ));
            }
            return resultList;
        } catch (Exception e) {
            LOG.warn("Error searching collection {}: {}", collectionName, e.getMessage());
            return List.of();
        }
    }

    /**
     * Searches the domain-scoped controls collection.
     * Controls are stored as: { domain: "...", controls: [ { controlId, name, description, ... } ] }
     */
    private List<SearchResult> searchControls(String escapedQuery) {
        try {
            MongoCollection<Document> collection = database.getCollection("controls");

            List<Document> pipeline = Arrays.asList(
                    new Document("$unwind", "$controls"),
                    new Document("$match", new Document("$or", Arrays.asList(
                            new Document("controls.name",
                                    new Document("$regex", escapedQuery).append("$options", "i")),
                            new Document("controls.description",
                                    new Document("$regex", escapedQuery).append("$options", "i"))
                    ))),
                    new Document("$limit", MAX_RESULTS_PER_TYPE),
                    new Document("$project", new Document("namespace", "$domain")
                            .append("id", "$controls.controlId")
                            .append("name", "$controls.name")
                            .append("description", "$controls.description")
                            .append("_id", 0))
            );

            AggregateIterable<Document> docs = collection.aggregate(pipeline);
            List<SearchResult> resultList = new ArrayList<>();
            for (Document doc : docs) {
                resultList.add(new SearchResult(
                        "controls",
                        doc.getString("namespace"),
                        doc.getInteger("id", 0),
                        doc.getString("name") != null ? doc.getString("name") : "Control " + doc.getInteger("id", 0),
                        doc.getString("description") != null ? doc.getString("description") : ""
                ));
            }
            return resultList;
        } catch (Exception e) {
            LOG.warn("Error searching controls: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Searches ADRs. ADR titles and statuses are stored in the latest revision sub-document,
     * so this uses a more complex pipeline to extract the latest revision's title.
     * As a simpler approach, we search on the raw document fields that were denormalized
     * at the top level of each ADR sub-document.
     *
     * Since ADR title/status are stored inside revisions (versioned), we unwind adrs,
     * then convert revisions to an array, unwind those, sort to get latest, and match.
     * For simplicity, we search across all revision titles.
     */
    private List<SearchResult> searchAdrs(String escapedQuery) {
        try {
            MongoCollection<Document> collection = database.getCollection("adrs");

            List<Document> pipeline = Arrays.asList(
                    new Document("$unwind", "$adrs"),
                    new Document("$addFields", new Document("revisionEntries",
                            new Document("$objectToArray", "$adrs.revisions"))),
                    new Document("$unwind", "$revisionEntries"),
                    new Document("$match", new Document("$or", Arrays.asList(
                            new Document("revisionEntries.v.title",
                                    new Document("$regex", escapedQuery).append("$options", "i")),
                            new Document("revisionEntries.v.context",
                                    new Document("$regex", escapedQuery).append("$options", "i"))
                    ))),
                    new Document("$group", new Document("_id",
                            new Document("namespace", "$namespace").append("adrId", "$adrs.adrId"))
                            .append("namespace", new Document("$first", "$namespace"))
                            .append("id", new Document("$first", "$adrs.adrId"))
                            .append("title", new Document("$last", "$revisionEntries.v.title"))
                            .append("status", new Document("$last", "$revisionEntries.v.status"))),
                    new Document("$limit", MAX_RESULTS_PER_TYPE),
                    new Document("$project", new Document("namespace", 1)
                            .append("id", 1)
                            .append("title", 1)
                            .append("status", 1)
                            .append("_id", 0))
            );

            AggregateIterable<Document> docs = collection.aggregate(pipeline);
            List<SearchResult> resultList = new ArrayList<>();
            for (Document doc : docs) {
                resultList.add(new SearchResult(
                        "adrs",
                        doc.getString("namespace"),
                        doc.getInteger("id", 0),
                        doc.getString("title") != null ? doc.getString("title") : "ADR " + doc.getInteger("id", 0),
                        doc.getString("status") != null ? doc.getString("status") : ""
                ));
            }
            return resultList;
        } catch (Exception e) {
            LOG.warn("Error searching ADRs: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Escapes special regex characters in a user-supplied query to prevent ReDoS attacks.
     * All characters that have special meaning in a regular expression are prefixed with a backslash.
     */
    static String escapeRegex(String input) {
        return Pattern.quote(input);
    }
}
