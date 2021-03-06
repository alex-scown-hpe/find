/*
 * Copyright 2018 Micro Focus International plc.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.idol.savedsearches.snapshot;

import com.autonomy.aci.client.services.AciErrorException;
import com.hp.autonomy.frontend.configuration.ConfigService;
import com.hp.autonomy.frontend.find.core.beanconfiguration.BiConfiguration;
import com.hp.autonomy.frontend.find.core.savedsearches.EmbeddableIndex;
import com.hp.autonomy.frontend.find.core.savedsearches.FieldTextParser;
import com.hp.autonomy.frontend.find.core.savedsearches.SavedSearchService;
import com.hp.autonomy.frontend.find.core.savedsearches.SavedSearchType;
import com.hp.autonomy.frontend.find.core.savedsearches.snapshot.SavedSnapshot;
import com.hp.autonomy.frontend.find.core.savedsearches.snapshot.SavedSnapshot.Builder;
import com.hp.autonomy.frontend.find.idol.dashboards.DashboardConfig;
import com.hp.autonomy.frontend.find.idol.dashboards.widgets.DatasourceDependentWidget;
import com.hp.autonomy.frontend.find.idol.dashboards.widgets.datasources.SavedSearchDatasource;
import com.hp.autonomy.searchcomponents.core.search.StateTokenAndResultCount;
import com.hp.autonomy.searchcomponents.core.search.TypedStateToken;
import com.hp.autonomy.searchcomponents.idol.search.IdolDocumentsService;
import com.hp.autonomy.searchcomponents.idol.search.IdolQueryRestrictions;
import com.hp.autonomy.searchcomponents.idol.search.IdolQueryRestrictionsBuilder;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(SavedSnapshotController.PATH)
@ConditionalOnExpression(BiConfiguration.BI_PROPERTY_SPEL)
class SavedSnapshotController {
    static final String PATH = "/api/bi/saved-snapshot";
    private static final String GET_SHARED = "/shared";

    private static final Integer STATE_TOKEN_MAX_RESULTS = Integer.MAX_VALUE;

    private final IdolDocumentsService documentsService;
    private final SavedSearchService<SavedSnapshot, Builder> service;
    private final FieldTextParser fieldTextParser;
    private final ObjectFactory<IdolQueryRestrictionsBuilder> queryRestrictionsBuilderFactory;
    private final ConfigService<DashboardConfig> dashboardConfigService;

    @SuppressWarnings("TypeMayBeWeakened")
    @Autowired
    public SavedSnapshotController(final IdolDocumentsService documentsService,
                                   final SavedSearchService<SavedSnapshot, Builder> service,
                                   final FieldTextParser fieldTextParser,
                                   final ObjectFactory<IdolQueryRestrictionsBuilder> queryRestrictionsBuilderFactory,
                                   final ConfigService<DashboardConfig> dashboardConfigService) {
        this.documentsService = documentsService;
        this.service = service;
        this.fieldTextParser = fieldTextParser;
        this.queryRestrictionsBuilderFactory = queryRestrictionsBuilderFactory;
        this.dashboardConfigService = dashboardConfigService;
    }

    private Collection<Long> getValidIds() {
        return dashboardConfigService.getConfig().getDashboards().stream()
                .flatMap(dashboard -> dashboard.getWidgets().stream()
                        .filter(widget -> widget instanceof DatasourceDependentWidget)
                        .map(widget -> (DatasourceDependentWidget) widget)
                        .filter(widget -> widget.getDatasource() instanceof SavedSearchDatasource)
                        .map(widget -> (SavedSearchDatasource) widget.getDatasource())
                        .filter(datasource -> datasource.getConfig().getType() == SavedSearchType.SNAPSHOT)
                        .map(datasource -> datasource.getConfig().getId()))
                .collect(Collectors.toSet());
    }

    @RequestMapping(method = RequestMethod.GET)
    public Set<SavedSnapshot> getAll() {
        return service.getOwned();
    }

    @RequestMapping(value = GET_SHARED, method = RequestMethod.GET)
    public Set<SavedSnapshot> getShared() {
        return service.getShared();
    }

    @RequestMapping(method = RequestMethod.POST)
    public SavedSnapshot create(
            @RequestBody final SavedSnapshot snapshot
    ) throws AciErrorException {
        final List<StateTokenAndResultCount> stateTokensList = Arrays.asList(
                getStateTokenAndResultCount(snapshot, false),
                getStateTokenAndResultCount(snapshot, true)
        );

        final Set<TypedStateToken> stateTokens = new HashSet<>();

        for(final StateTokenAndResultCount listToken : stateTokensList) {
            final TypedStateToken token = listToken.getTypedStateToken();
            stateTokens.add(token);
        }

        // use result count from the query without promotions
        final long resultCount = stateTokensList.get(0).getResultCount();

        return service.create(
                new Builder(snapshot)
                        .setStateTokens(stateTokens)
                        .setResultCount(resultCount)
                        .build()
        );
    }

    @RequestMapping(value = "{id}", method = RequestMethod.PUT)
    public SavedSnapshot update(
            @PathVariable("id") final long id,
            @RequestBody final SavedSnapshot snapshot
    ) throws AciErrorException {
        // It is only possible to update a snapshot's title
        return service.update(
                new Builder()
                        .setId(id)
                        .setTitle(snapshot.getTitle())
                        .build()
        );
    }

    @RequestMapping(value = "shared/{id}", method = RequestMethod.PUT)
    public SavedSnapshot updateShared(
            @PathVariable("id") final long id,
            @RequestBody final SavedSnapshot snapshot
    ) throws AciErrorException {
        // It is only possible to update a snapshot's title
        return service.update(
                new Builder()
                        .setId(id)
                        .setTitle(snapshot.getTitle())
                        .build()
        );
    }

    @RequestMapping(value = "{id}", method = RequestMethod.DELETE)
    public void delete(
            @PathVariable("id") final long id
    ) {
        service.deleteById(id);
    }

    private StateTokenAndResultCount getStateTokenAndResultCount(final SavedSnapshot snapshot, final boolean promotions) throws AciErrorException {
        final List<String> indexes;

        if(snapshot.getIndexes() == null) {
            indexes = null;
        } else {
            indexes = new ArrayList<>();

            indexes.addAll(snapshot.getIndexes().stream().map(EmbeddableIndex::getName).collect(Collectors.toList()));
        }

        final IdolQueryRestrictions restrictions = queryRestrictionsBuilderFactory.getObject()
                .databases(indexes)
                .queryText(snapshot.toQueryText())
                .fieldText(fieldTextParser.toFieldText(snapshot))
                .maxDate(snapshot.getMaxDate())
                .minDate(snapshot.getMinDate())
                .minScore(snapshot.getMinScore())
                .build();

        return documentsService.getStateTokenAndResultCount(restrictions, STATE_TOKEN_MAX_RESULTS, promotions);
    }

    @RequestMapping(method = RequestMethod.GET, value = "/{id}")
    public SavedSnapshot get(@PathVariable("id") final long id) {
        if(getValidIds().contains(id)) {
            return Optional.ofNullable(service.getDashboardSearch(id))
                    .orElseThrow(() -> new IllegalArgumentException("Configured ID " + id + " does not match any known Saved Snapshot"));
        } else {
            throw new IllegalArgumentException("Saved Snapshot ID " + id + " is not in the dashboards configuration file");
        }
    }
}
