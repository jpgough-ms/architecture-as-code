package org.finos.calm.mcp.api;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import org.finos.calm.mcp.api.model.AdrResponse;
import org.finos.calm.mcp.api.model.ValueWrapper;
import org.finos.calm.mcp.api.model.adr.Adr;
import org.jboss.resteasy.reactive.RestResponse;

@RegisterRestClient(baseUri = "http://localhost:8080")
public interface AdrClient {
    @GET
    @Path("/calm/namespaces/{namespace}/adrs")
    ValueWrapper<String> getAdrIds(String namespace);

    @GET
    @Path("/calm/namespaces/{namespace}/adrs/{id}")
    AdrResponse getAdrDetail(String namespace, String id);

    @POST
    @Path("/calm/namespaces/{namespace}/adrs")
    @Consumes(MediaType.APPLICATION_JSON)
    RestResponse<Void> createAdr(@PathParam("namespace") String namespace, Adr adr);

    @POST
    @Path("/calm/namespaces/{namespace}/adrs/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    RestResponse<Void> updateAdr(@PathParam("namespace") String namespace, @PathParam("id") String id, Adr adr);
}
