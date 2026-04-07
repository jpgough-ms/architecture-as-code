package org.finos.calm.store.nitrite;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import jakarta.inject.Inject;
import org.dizitart.no2.Nitrite;
import org.dizitart.no2.collection.Document;
import org.dizitart.no2.collection.NitriteCollection;
import org.finos.calm.config.StandaloneQualifier;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.domain.search.SearchResult;
import org.finos.calm.store.SearchStore;
import org.finos.calm.store.util.TypeSafeNitriteDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * NitriteDB-backed implementation of {@link SearchStore}.
 *
 * Iterates all documents across each collection and performs case-insensitive substring
 * matching on name/description fields. Used when running in standalone mode.
 */
@ApplicationScoped
@Typed(NitriteSearchStore.class)
public class NitriteSearchStore implements SearchStore {

    private static final Logger LOG = LoggerFactory.getLogger(NitriteSearchStore.class);
    static final int MAX_RESULTS_PER_TYPE = 20;

    private final NitriteCollection architectureCollection;
    private final NitriteCollection patternCollection;
    private final NitriteCollection flowCollection;
    private final NitriteCollection standardCollection;
    private final NitriteCollection interfaceCollection;
    private final NitriteCollection controlCollection;
    private final NitriteCollection adrCollection;

    @Inject
    public NitriteSearchStore(@StandaloneQualifier Nitrite db) {
        this.architectureCollection = db.getCollection("architectures");
        this.patternCollection = db.getCollection("patterns");
        this.flowCollection = db.getCollection("flows");
        this.standardCollection = db.getCollection("standards");
        this.interfaceCollection = db.getCollection("interfaces");
        this.controlCollection = db.getCollection("controls");
        this.adrCollection = db.getCollection("adrs");
        LOG.info("NitriteSearchStore initialized");
    }

    @Override
    public GroupedSearchResults search(String query) {
        String lowerQuery = query.toLowerCase();
        GroupedSearchResults results = new GroupedSearchResults();

        results.addGroup("architectures", searchNamespaceScoped(
                architectureCollection, "architectures", "architectureId", lowerQuery));
        results.addGroup("patterns", searchNamespaceScoped(
                patternCollection, "patterns", "patternId", lowerQuery));
        results.addGroup("flows", searchNamespaceScoped(
                flowCollection, "flows", "flowId", lowerQuery));
        results.addGroup("standards", searchNamespaceScoped(
                standardCollection, "standards", "standardId", lowerQuery));
        results.addGroup("interfaces", searchNamespaceScoped(
                interfaceCollection, "interfaces", "interfaceId", lowerQuery));
        results.addGroup("controls", searchControls(lowerQuery));
        results.addGroup("adrs", searchAdrs(lowerQuery));

        return results;
    }

    private List<SearchResult> searchNamespaceScoped(
            NitriteCollection collection, String arrayField, String idField, String lowerQuery) {
        List<SearchResult> resultList = new ArrayList<>();
        try {
            for (Document nsDoc : collection.find()) {
                String namespace = nsDoc.get("namespace", String.class);
                List<Document> items = new TypeSafeNitriteDocument<>(nsDoc, Document.class).getList(arrayField);
                if (items == null) continue;

                for (Document item : items) {
                    if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
                    String name = item.get("name", String.class);
                    String description = item.get("description", String.class);
                    if (name == null) name = arrayField + " " + item.get(idField, Integer.class);
                    if (description == null) description = "";

                    if (name.toLowerCase().contains(lowerQuery) || description.toLowerCase().contains(lowerQuery)) {
                        resultList.add(new SearchResult(
                                arrayField,
                                namespace,
                                item.get(idField, Integer.class),
                                name,
                                description
                        ));
                    }
                }
                if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
            }
        } catch (Exception e) {
            LOG.warn("Error searching Nitrite collection {}: {}", arrayField, e.getMessage());
        }
        return resultList;
    }

    private List<SearchResult> searchControls(String lowerQuery) {
        List<SearchResult> resultList = new ArrayList<>();
        try {
            for (Document domainDoc : controlCollection.find()) {
                String domain = domainDoc.get("domain", String.class);
                List<Document> controls = new TypeSafeNitriteDocument<>(domainDoc, Document.class).getList("controls");
                if (controls == null) continue;

                for (Document control : controls) {
                    if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
                    String name = control.get("name", String.class);
                    String description = control.get("description", String.class);
                    Integer controlId = control.get("controlId", Integer.class);
                    if (name == null) name = "Control " + controlId;
                    if (description == null) description = "";

                    if (name.toLowerCase().contains(lowerQuery) || description.toLowerCase().contains(lowerQuery)) {
                        resultList.add(new SearchResult(
                                "controls",
                                domain,
                                controlId,
                                name,
                                description
                        ));
                    }
                }
                if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
            }
        } catch (Exception e) {
            LOG.warn("Error searching Nitrite controls: {}", e.getMessage());
        }
        return resultList;
    }

    private List<SearchResult> searchAdrs(String lowerQuery) {
        List<SearchResult> resultList = new ArrayList<>();
        try {
            for (Document nsDoc : adrCollection.find()) {
                String namespace = nsDoc.get("namespace", String.class);
                List<Document> adrs = new TypeSafeNitriteDocument<>(nsDoc, Document.class).getList("adrs");
                if (adrs == null) continue;

                for (Document adr : adrs) {
                    if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
                    Integer adrId = adr.get("adrId", Integer.class);
                    String title = "ADR " + adrId;
                    String status = "";

                    Document revisions = adr.get("revisions", Document.class);
                    if (revisions != null) {
                        String latestKey = null;
                        int latestNum = -1;
                        for (String key : revisions.getFields()) {
                            try {
                                int num = Integer.parseInt(key);
                                if (num > latestNum) {
                                    latestNum = num;
                                    latestKey = key;
                                }
                            } catch (NumberFormatException ignored) {
                                // skip non-numeric revision keys
                            }
                        }
                        if (latestKey != null) {
                            Document rev = revisions.get(latestKey, Document.class);
                            if (rev != null) {
                                String revTitle = rev.get("title", String.class);
                                String revStatus = rev.get("status", String.class);
                                if (revTitle != null) title = revTitle;
                                if (revStatus != null) status = revStatus;
                            }
                        }
                    }

                    if (title.toLowerCase().contains(lowerQuery) || status.toLowerCase().contains(lowerQuery)) {
                        resultList.add(new SearchResult(
                                "adrs",
                                namespace,
                                adrId,
                                title,
                                status
                        ));
                    }
                }
                if (resultList.size() >= MAX_RESULTS_PER_TYPE) break;
            }
        } catch (Exception e) {
            LOG.warn("Error searching Nitrite ADRs: {}", e.getMessage());
        }
        return resultList;
    }
}
