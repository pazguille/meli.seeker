/*** Namespace ***/
;(function (exports) {
	"use strict";
	var app = (function () {

		// Aca van las variables que quieran que sean privadas

		var core = {
		// variables publicas que van a acceder medienta app.xxx
		};

		return core;

	}());

	exports.app = app;

}(window));


/*
* Models
*/
var Item = Backbone.Model.extend({

	// Default attributes for the item
	/*"defaults": {
		"id": "",
		"title": "",
		"price": "",
		"currency": "",
		"permalink": "",
		"thumbnail": "",
		"address": ""
	}*/
});

/*
* Collections
*/
var ItemCollection = Backbone.Collection.extend({
	// Reference to this collection's model.
	"model": Item,
	sync: function (method, model, options) {
		options.dataType = "jsonp";
		return Backbone.sync(method, model, options);
	},
	parse: function (response) {
		return response[2].results;
	},
	"url": "https://api.mercadolibre.com/sites/MLA/search?q=ipod"
});


/*
* Views
*/

var ItemView = Backbone.View.extend({
	tagName: "article",

	template:_.template($("#tpl-item").html()),

	render: function () {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});

var ItemListView = Backbone.View.extend({
	tagName: "li",

	render: function (item) {
		$(this.el).html(new ItemView({model:item}).render().el);
		return this;
	}
});

var ItemResultsView = Backbone.View.extend({
	tagName: "ul",
	className: "products",
	initialize: function () {
		this.model.on("reset", this.render, this);
	},

	render: function (eventName) {
		_.each(this.model.models, function (item) {
			$(this.el).append(new ItemListView({model:item}).render(item).el);
		}, this);

		return this;
	}	
});


var AppView = Backbone.View.extend({
	"initialize": function () {
		// carga los datos automaticamente con el fetch
		var itemResultsView = new ItemResultsView({model:this.model});
		this.model.fetch();
		$("#results").append(itemResultsView.render().el);
		
		// events
		this.on("seek", this.foobar);
	},

	events: {
		"submit .ch-header-form": "foo",
		"click .ch-icon-list": "bar"
	},

	"foobar": function () {
		console.log("foobar");
	},

	"foo": function (e) {
		e.preventDefault();
		e.stopPropagation();
		console.log("foo");
	},

	"bar": function (e) {
		// events
		this.trigger("seek");
		//e.preventDefault();
		//e.stopPropagation();
		//console.log("bar");
	}
});




var App = Backbone.Router.extend({
	"routes": {
		"": "index",
		"search/:query": "searchItems"
	},

	"index": function () {
		var appView = new AppView({model: new ItemCollection(), el: ".ch-header"});
	},

	"searchItems": function (query) {
		console.log(query);
	}
});

var app = new App();
Backbone.history.start();