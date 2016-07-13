/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'jquery',
    'underscore',
    'find/app/model/bucketed-parametric-collection',
    'find/app/page/search/filters/parametric/abstract-parametric-view',
    'find/app/page/search/filters/parametric/numeric-parametric-field-collapsible-view',
    'js-whatever/js/list-view',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/filters/parametric/numeric-parametric-view.html'
], function ($, _, BucketedParametricCollection, AbstractView, FieldView, ListView, i18n, template) {

    'use strict';

    return AbstractView.extend({
        getBucketingRequestData: null,
        template: _.template(template)({i18n: i18n}),
        updateEmpty: $.noop,

        initialize: function (options) {            
            this.queryModel = options.queryModel;
            this.monitorCollection(this.collection);

            this.fieldNamesListView = new ListView({
                collection: this.collection,
                ItemView: FieldView,
                itemOptions: {
                    template: options.fieldTemplate,
                    queryModel: options.queryModel,
                    selectedParametricValues: options.queryState.selectedParametricValues,
                    pixelsPerBucket: options.defaultTargetNumberOfPixelsPerBucket,
                    numericRestriction: options.numericRestriction,
                    formatting: options.formatting,
                    selectionEnabled: options.selectionEnabled,
                    zoomEnabled: options.zoomEnabled,
                    buttonsEnabled: options.buttonsEnabled,
                    coordinatesEnabled: options.coordinatesEnabled
                }
            });
        },

        remove: function () {
            this.fieldNamesListView.remove();
            AbstractView.prototype.remove.call(this);
        }
    });

});