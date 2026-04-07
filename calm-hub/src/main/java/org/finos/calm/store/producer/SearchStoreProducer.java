package org.finos.calm.store.producer;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.finos.calm.store.SearchStore;
import org.finos.calm.store.mongo.MongoSearchStore;
import org.finos.calm.store.nitrite.NitriteSearchStore;

@ApplicationScoped
public class SearchStoreProducer {

    @Inject
    @ConfigProperty(name = "calm.database.mode", defaultValue = "mongo")
    String databaseMode;

    @Inject
    MongoSearchStore mongoSearchStore;

    @Inject
    NitriteSearchStore standaloneSearchStore;

    @Produces
    @ApplicationScoped
    public SearchStore produceSearchStore() {
        if ("standalone".equals(databaseMode)) {
            return standaloneSearchStore;
        } else {
            return mongoSearchStore;
        }
    }
}
