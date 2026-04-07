package org.finos.calm.resources;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.finos.calm.domain.search.GroupedSearchResults;
import org.finos.calm.security.CalmHubScopes;
import org.finos.calm.security.PermittedScopes;
import org.finos.calm.store.SearchStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Global search resource that searches across all resource types stored in the hub.
 * Results are grouped by type (architectures, patterns, flows, standards, interfaces, controls, adrs).
 */
@Path("/calm/search")
public class SearchResource {

    private static final int MAX_QUERY_LENGTH = 200;
    private final Logger logger = LoggerFactory.getLogger(SearchResource.class);
    private final SearchStore searchStore;

    @Inject
    public SearchResource(SearchStore searchStore) {
        this.searchStore = searchStore;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            summary = "Search across all resource types",
            description = "Performs a global search across architectures, patterns, flows, standards, interfaces, controls, and ADRs. Results are grouped by type."
    )
    @PermittedScopes({CalmHubScopes.ARCHITECTURES_READ, CalmHubScopes.ARCHITECTURES_ALL})
    public Response search(@QueryParam("q") String query) {
        if (query == null || query.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Query parameter 'q' is required and must not be blank")
                    .build();
        }

        if (query.length() > MAX_QUERY_LENGTH) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Query parameter 'q' must not exceed " + MAX_QUERY_LENGTH + " characters")
                    .build();
        }

        logger.debug("Searching for: {}", query);
        GroupedSearchResults results = searchStore.search(query);
        return Response.ok(results).build();
    }
}
