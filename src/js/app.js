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
var SitesCollection = Backbone.Collection.extend({
	"model": Site
});
En una view despues tengo que hacer esto para levantar los datos locales:
	//this.collection = new SitesCollection(sites);
	//that.render();

-------------------------------------------------------------------------
*/

var sites = [
	{ "name": "Argentina", "id": "MLA" },
	{ "name": "Brasil", "id": "MLB" },
	{ "name": "Colombia", "id": "MCO" },
	{ "name": "Costa Rica", "id": "MCR" },
	{ "name": "Chile", "id": "MLC" },
	{ "name": "Dominicana", "id": "MRD" },
	{ "name": "Ecuador", "id": "MEC" },
	{ "name": "México", "id": "MLM" },
	{ "name": "Panamá", "id": "MPA" },
	{ "name": "Perú", "id": "MPE" },
	{ "name": "Portugal", "id": "MPT" },
	{ "name": "Uruguay", "id": "MLU" },
	{ "name": "Venezuela", "id": "MLV" }
];

/*
* Models
*/
var Site = Backbone.Model.extend({});
var Item = Backbone.Model.extend({});

/*
* Collections
*/
var SitesCollection = Backbone.Collection.extend({
	"model": Site,

	sync: function (method, model, options) {
		options.dataType = "jsonp";
		return Backbone.sync(method, model, options);
	},

	parse: function (response) {
		return response[2];
	},

	"url": "https://api.mercadolibre.com/sites"
});

var ItemsCollection = Backbone.Collection.extend({
	"model": Item,

	"sync": function (method, model, options) {
		options.dataType = "jsonp";
		return Backbone.sync(method, model, options);
	},

	"parse": function (response) {
		return response[2].results;
	},

	"url": "https://api.mercadolibre.com/sites/MLA/search"
});

/*
* Views
*/

var SitesView = Backbone.View.extend({
	"tagName": "ul",

	"className": "ch-list",

	"template": _.template($("#tpl-site").html()),

	"initialize": function (app) {
		var that = this;

		this.collection = new SitesCollection();
		this.collection.fetch({
			"success": function () {
				that.render();
			}
		});

		this.on("changeSite", function (site) {
			app.site = site;
		});
	},

	"render": function () {

		_.each(this.collection.models, function (site) {
			this.$el.append(this.template(site.toJSON()));
		}, this);

		$("#navigation").append(this.$el);

	},

	"events": {
		"click .ch-list a": "changeSite"
	},

	"changeSite": function (event) {
		this.trigger("changeSite", event.srcElement.getAttribute("data-id"));
		return false;
	}

});


var ItemView = Backbone.View.extend({
	"tagName": "article",

	"className": "item",

	"template": _.template($("#tpl-item").html()),

	"render": function () {
		var item = this.model.toJSON();
		item.currency_id = this.currencyMap[item.currency_id];

		$(this.el).html(this.template(item));

		return this;
	},
	"currencyMap": {
		"BRL": "R$",
		"UYU": "$",
		"CLP": "$",
		"MXN": "$",
		"DOP": "$",
		"PAB": "B/.",
		"COP": "$",
		"VEF": "BsF",
		"EUR": "€",
		"PEN": "S/.",
		"CRC": "¢",
		"ARS": "$",
		"USD": "U$S"
	}
});

var ItemListView = Backbone.View.extend({
	"tagName": "li",

	"render": function (item) {
		var item = new ItemView({"model": item});
		$(this.el).html(item.render().el);

		return this;
	}
});

var SeekerView = Backbone.View.extend({
	"tagName": "ul",

	"className": "slats ch-list",

	"initialize": function (app) {
		this.offset = 0;
		this.query = app.query;
		this.collection = new ItemsCollection();
		$("#results").append(this.el);
	},

	"render": function () {
		var that = this;
		_.each(this.collection.models, function (item) {
			var items = new ItemListView({"model": item});
			$(that.el).append(items.render(item).el);
		}, this);

		return this;
	},

	"$loading": $("<div class=\"ch-loading-wrap\"><div class=\"ch-loading\">Cargando...</div></div>"),

	"start": function (query) {
		var that = this,
			opt = opt || {};

		this.reset();

		this.$el.append(this.$loading);

		this.collection.fetch({
			"data": {
				"q": escape(query),
				"limit": (opt.limit || 10),
				"offset": 0
			},
			"success": function () {
				that.$loading.remove();
				that.render();
			}
		});
	},

	"more": function () {

	},

	"reset": function () {
		this.collection.reset();
		this.$el.html("");
	}


});


var Header = Backbone.View.extend({
	"el": ".ch-header",

	"initialize": function (app) {
		this.app = app;
		this.renderSites(app);
		this.seekerInit(app);
	},

	"events": {
		"submit .ch-header-form": "seek"
	},

	"renderSites": function (app) {
		ch.mobile.menu($(".ch-header menu li"));

		this.sites = new SitesView(app);
	},

	"seekerInit": function (app) {
		this.seeker = new SeekerView(app);
	},

	"seek": function () {
		var app = this.app;
		app.query = ($("#query").val()).trim();
		this.seeker.start(app.query);

		return false;
	}

});


var App = Backbone.Router.extend({
	"routes": {
		"": "index"
	},

	"initialize": function () {
		this.query = "";
		this.site = "MLA";
		this.header = new Header(this);
	},

	"index": function () {
		//var search = new searchView({model: new ItemCollection(), el: ".ch-header"});
	}
});

var seekerPlugin = new App();
Backbone.history.start();