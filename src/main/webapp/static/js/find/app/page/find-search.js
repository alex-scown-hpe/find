define([
    'js-utils/js/base-page',
    'find/app/model/entity-collection',
    'find/app/model/documents-collection',
    'find/app/model/indexes-collection',
    'find/app/router',
    'find/app/vent',
    'text!find/templates/app/page/find-search.html',
    'text!find/templates/app/page/results-container.html',
    'text!find/templates/app/page/suggestions-container.html',
    'text!find/templates/app/page/loading-spinner.html',
    'text!find/templates/app/page/colorbox-controls.html',
    'text!find/templates/app/page/popover-contents.html',
    'colorbox'
], function(BasePage, EntityCollection, DocumentsCollection, IndexesCollection, router, vent, template, resultsTemplate,
            suggestionsTemplate, loadingSpinnerTemplate, colorboxControlsTemplate, popoverContents) {

    return BasePage.extend({

        template: _.template(template),
        resultsTemplate: _.template(resultsTemplate),
        suggestionsTemplate: _.template(suggestionsTemplate),
        popoverContents: _.template(popoverContents),

        events: {
            'keyup .find-input': 'keyupAnimation',
            'click .list-indexes': function() {
                this.indexesCollection.fetch();
            },
            'change [name="indexRadios"]': function(e) {
                this.indexes = $(e.currentTarget).val();
            }
        },

        initialize: function() {
            this.entityCollection = new EntityCollection();
            this.documentsCollection = new DocumentsCollection();
            this.indexesCollection = new IndexesCollection();

            this.searchRequest = _.debounce(_.bind(this.searchRequest, this), 500);

            router.on('route:search', function(text) {
                this.entityCollection.reset();
                this.documentsCollection.set([]);

                if (text) {
                    this.$('.find-input').val(text); //when clicking one of the suggested search links
                    this.keyupAnimation();
                } else {
                    this.reverseAnimation(); //when clicking the small 'find' logo
                }
            }, this);
        },

        render: function() {
            this.$el.html(this.template);

            this.$('.find-form').submit(function(e){ //preventing input form submit and page reload
                e.preventDefault();
            });

            this.$('.list-indexes').popover({
                html: true,
                content: '<h6>Public Indexes</h6>',
                placement: 'bottom'
            });

            this.listenTo(this.indexesCollection, 'request', function(){
                if(!this.$('.popover-content .radio').length) {
                    this.$('.popover-content').append(_.template(loadingSpinnerTemplate));
                }
            });

            this.listenTo(this.indexesCollection, 'add', function(model){
                this.$('.popover-content .loading-spinner').remove();

                this.$('.popover-content').append(this.popoverContents({
                    index: model.get('index')
                }));
            });

            this.listenTo(this.documentsCollection, 'request', function() {
                if(!this.$('.main-results-container').length) {
                    this.$('.main-results-content').append(_.template(loadingSpinnerTemplate));
                }
            });

            this.listenTo(this.entityCollection, 'request', function() {
                if(!this.$('.suggestions-content ul').length) {
                    this.$('.suggestions-content').append(_.template(loadingSpinnerTemplate));
                }
            });

            this.listenTo(this.entityCollection, 'reset', function() {
                this.$('.suggestions-content').empty();

                var clusters = this.entityCollection.groupBy('cluster');

                _.each(clusters, function(entities) {
                    this.$('.suggestions-content').append(this.suggestionsTemplate({
                        entities: entities
                    }));
                }, this);
            });

            this.listenTo(this.documentsCollection, 'add', function(model) {
                var reference = model.get('reference');
                var summary = model.get('summary').split('').slice(0, model.get('summary').lastIndexOf(" ",300)).join('');

                this.$('.main-results-content .loading-spinner').remove();

                var $newResult = $(_.template(resultsTemplate ,{
                    title: model.get('title'),
                    reference: reference,
                    index: model.get('index'),
                    summary: summary
                }));

                this.$('.main-results-content').append($newResult);

                $newResult.find('.result-header, .result-summary a').colorbox({
                    iframe: true,
                    width:'70%',
                    height:'70%',
                    href: reference,
                    rel: 'results',
                    current: '{current} of {total}',
                    onLoad: function() {
                        $('#cboxPrevious, #cboxNext').remove(); //removing default colorbox nav buttons
                    }
                });
            });

            this.listenTo(this.documentsCollection, 'remove', function(model) {
                var reference = model.get('reference');

                this.$('[data-reference="' + reference + '"]').remove();
            });
            $('#colorbox').append(_.template(colorboxControlsTemplate));
            $('.nextBtn').on('click', this.handleNextResult);
            $('.prevBtn').on('click', this.handlePrevResult);
        },

        keyupAnimation: function() {
            /*fancy animation*/
            if($.trim(this.$('.find-input').val()).length) { //checking if input doesn't have any spaces or empty
                this.$('.find-logo').slideUp('slow');
                this.$('.find').addClass('animated-container').removeClass('reverse-animated-container');
                this.$('.form-search').addClass('animated-form').removeClass('reverse-animated-form');

                this.$('.suggested-links-container.span2, .find-logo-small').show();
                this.searchRequest(this.$('.find-input').val());
            } else {
                this.reverseAnimation();
                vent.navigate('find/find-search', {trigger: false});
                this.$('.main-results-content').empty();
            }
            this.$('.popover').remove();
        },

        handlePrevResult: function() {
            $.colorbox.prev();
        },

        handleNextResult: function() {
            $.colorbox.next();
        },

        reverseAnimation: function() {
            /*fancy reverse animation*/
            this.$('.find-logo').slideDown('slow');
            this.$('.find').removeClass('animated-container ').addClass('reverse-animated-container');
            this.$('.form-search').removeClass('animated-form').addClass('reverse-animated-form');

            this.$('.suggested-links-container.span2, .find-logo-small').hide();
            this.$('.find-input').val('');
        },

        searchRequest: function(input) {
            this.documentsCollection.fetch({
                data: {
                    text: input,
                    max_results: 30,
                    summary: 'quick',
                    indexes: this.indexes || 'wiki_eng'
                }
            }, this);

            this.entityCollection.fetch({
                data: {
                    text: input,
                    indexes: this.indexes || 'wiki_eng'
                }
            });

            vent.navigate('find/find-search/' + encodeURIComponent(input), {trigger: false});
        }
    });
});