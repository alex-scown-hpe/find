/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'backbone',
    'underscore',
    'handlebars',
    'jquery',
    'find/app/vent',
    'find/app/page/search/results/add-links-to-summary',
    'find/app/util/document-mime-types',
    'find/app/util/url-manipulator',
    'text!find/templates/app/page/search/default-custom-templates/search-result.handlebars',
    'text!find/templates/app/page/search/default-custom-templates/entity-search.handlebars',
    'text!find/templates/app/page/search/default-custom-templates/preview-mode-metadata.handlebars',
    'text!find/templates/app/page/search/default-custom-templates/promotion.handlebars',
    './template-helpers/equal-helper',
    './template-helpers/has-field-helper',
    './template-helpers/has-field-value-helper',
    './template-helpers/get-field-value-helper',
    './template-helpers/get-field-values-helper',
    './template-helpers/percentage-helper',
    './template-helpers/placeholder-template-helper',
    './template-helpers/pretty-print-number-helper',
    './template-helpers/regex-if-helper',
    './template-helpers/to-external-url-helper',
    './template-helpers/to-lower-case-helper',
    './template-helpers/to-relative-time-helper',
    './template-helpers/to-upper-case-helper',
    './template-helpers/wiki-thumbnail-helper',
    './template-helpers/with-field-helper',
    './template-helpers/i18n-helper'
], function(Backbone, _, Handlebars, $, vent, addLinksToSummary, documentMimeTypes, urlManipulator,
            defaultResultTemplate, defaultEntitySearchTemplate, defaultPreviewTemplate, defaultPromotionTemplate,
            equalHelper, hasFieldHelper, hasFieldValueHelper, getFieldValueHelper, getFieldValuesHelper,
            percentageHelper, placeholderTemplateHelper, prettyPrintNumberHelper, regexIfHelper, toExternalUrlHelper,
            toLowerCaseHelper, toRelativeTimeHelper, toUpperCaseHelper, wikiThumbnailHelper, withFieldHelper, i18nHelper) {

    function templatePredicate(triggers) {
        return function(model) {
            return _.every(triggers, function(trigger) {
                if (trigger.indexes) {
                    const index = model.get('index');

                    if (index) {
                        const indexCaps = index.toUpperCase();

                        if (!_.find(trigger.indexes, function(triggerIndex){
                                return triggerIndex.toUpperCase() === indexCaps;
                            })) {
                            return false
                        }
                        else if (!trigger.field) {
                            return true;
                        }
                    }
                }

                const documentField = _.findWhere(model.get('fields'), {id: trigger.field});

                if (documentField) {
                    return _.isEmpty(trigger.values) || _.some(trigger.values, _.partial(_.contains, documentField.values));
                } else {
                    return false;
                }
            });
        };
    }

    function getContentTypeClass(model) {
        const contentType = model.get('contentType') || '';

        const matchedType = _.find(documentMimeTypes, function(mimeType) {
            return Boolean(_.find(mimeType.typeRegex, function(regex) {
                return regex().test(contentType);
            }));
        });

        return matchedType.className;
    }

    function buildContext(model) {
        const url = model.get('url');
        const date = model.get('date');

        let thumbnailSrc;

        if (model.has('thumbnail')) {
            thumbnailSrc = 'data:image/jpeg;base64,' + model.get('thumbnail');
        } else if (model.has('thumbnailUrl')) {
            thumbnailSrc = model.get('thumbnailUrl');
        }

        return {
            reference: model.get('reference'),
            title: model.get('title'),
            date: date && date.format('LLLL'),
            database: model.get('index'),
            promotionName: model.get('promotionName'),
            similarDocumentsUrl: vent.suggestUrlForDocument(model),
            summary: addLinksToSummary(model.get('summary')),
            url: url ? urlManipulator.addSpecialUrlPrefix(model.get('contentType'), url) : null,
            icon: 'icomoon-file-' + getContentTypeClass(model),
            intentRankedHit: model.get('intentRankedHit'),
            thumbnailSrc: thumbnailSrc,
            age: date && date.fromNow(),
            fields: model.get('fields').map(_.partial(_.pick, _, ['id', 'displayName', 'advanced', 'values']))
        };
    }

    function renderTemplate(key) {
        return function(model) {
            const template = _.find(this.templates[key], function(data) {
                return data.predicate(model);
            }).template;

            return template(buildContext(model));
        };
    }

    function DocumentRenderer(configuration) {
        const handlebars = Handlebars.create();

        handlebars.registerHelper({
            equal: equalHelper,
            i18n: i18nHelper,
            hasField: hasFieldHelper,
            hasFieldValue: hasFieldValueHelper,
            getFieldValue: getFieldValueHelper,
            getFieldValues: getFieldValuesHelper,
            percentage: percentageHelper,
            placeholderTemplate: placeholderTemplateHelper,
            prettyPrintNumber: prettyPrintNumberHelper,
            regexIf: regexIfHelper,
            toExternalUrl: toExternalUrlHelper,
            toLowerCase: toLowerCaseHelper,
            toRelativeTime: toRelativeTimeHelper,
            toUpperCase: toUpperCaseHelper,
            wikiThumbnailHelper: wikiThumbnailHelper,
            withField: withFieldHelper
        });

        this.loadPromise = $.get('customization/result-templates')
            .done(function(templateFiles) {
                this.templates = _.chain([
                        {defaultTemplate: defaultResultTemplate, key: 'searchResult'},
                        {defaultTemplate: defaultPreviewTemplate, key: 'previewPanel'},
                        {defaultTemplate: defaultEntitySearchTemplate, key: 'entitySearch'},
                        {defaultTemplate: defaultPromotionTemplate, key: 'promotion'}
                    ])
                    .map(function(type) {
                        const configuredTemplates = configuration[type.key]
                            .map(function(templateConfig) {
                                return {
                                    predicate: templatePredicate(templateConfig.triggers),
                                    template: handlebars.compile(templateFiles[templateConfig.file])
                                };
                            });

                        const templateList = configuredTemplates.concat({
                            template: handlebars.compile(type.defaultTemplate),
                            predicate: _.constant(true)
                        });

                        return [type.key, templateList];
                    })
                    .object()
                    .value();
            }.bind(this));
    }

    _.extend(DocumentRenderer.prototype, {
        renderResult: renderTemplate('searchResult'),
        renderPromotion: renderTemplate('promotion'),
        renderPreviewMetadata: renderTemplate('previewPanel'),
        renderEntity: renderTemplate('entitySearch')
    });

    return DocumentRenderer;

});
