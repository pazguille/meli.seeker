//http://jsfiddle.net/iainjmitchell/kRRXC/
//jQuery Plugin to show tweets
(function($, undefined){
    $.widget("ijm.twitTweet", {
        options: {
            results: 5,
            twitterUrl: "http://search.twitter.com/search.json",
            userName: "*",
            template: "#tweetTemplate"
        },
        
        _create: function(){
            var TweetView = this._initView();
            var TweetCollection = this._initCollection();
            var tweets = new TweetCollection();
            var element = this.element;
            
            var AppView = Backbone.View.extend({
                initialize: function(){
                    this.model.bind("all", this.addAll, this);    
                    this.model.fetch();    
                },
                
                addAll: function(){
                    var el = this.el;
                    el.hide().empty();
                    this.model.each(function(tweet){
                        var view = new TweetView({model: tweet});
                        el.append(view.render().el);
                    });
                    el.slideDown(500);
                }    
            });
            
            var appView = new AppView({model: tweets, el: element});
        },
        
        _initView: function(){
            return Backbone.View.extend({
                template: $(this.options.template),
                initialize: function() {
                    this.model.bind('change', this.render, this);
                    this.render();
                },
                render: function(){
                    var tweet = this.template.tmpl(this.model.toJSON());
                    $(this.el).html(tweet);
                    return this;
                }
            });
        },
        
        _initCollection: function(){
            var twitterUrl = this._getUrl();
        
            var Tweet = Backbone.Model.extend({});
            
            return Backbone.Collection.extend({
                model: Tweet,
                url: twitterUrl,
                sync: function(method, model, options){
                    options.timeout = 10000;
                    options.dataType = "jsonp";
                    return Backbone.sync(method, model, options);
                },
                parse: function(response) {
                    return response.results;
                }
            });
        },
        
        _getUrl: function(){
            return this.options.twitterUrl + "?q=from:" + 
                this.options.userName + "+OR+" + 
                this.options.userName + "&rpp=" + this.options.results;
        }
    });
})(jQuery);

(function($, undefined){
    $(document).ready(function(){
        $("#twitterContent").twitTweet({
            userName: "pazguille",
            template: "#tweetTemplate"
        });
    });
})(jQuery);​