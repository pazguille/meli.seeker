(function (exports) {
	"use strict";
	var app = (function () {
		/*
		* Models
		*/
		var Site = Backbone.Model.extend({}),
			Item = Backbone.Model.extend({}),

		/*
		* Collections
		*/
			SitesCollection = Backbone.Collection.extend({
				"model": Site,

				// (method, collection || model, options)
				sync: function (method, collection, options) {
					options.dataType = "jsonp";
					return Backbone.sync(method, collection, options);
				},

				parse: function (response) {
					return response[2];
				},

				"url": "https://api.mercadolibre.com/sites"
			}),

			ItemsCollection = Backbone.Collection.extend({
				"model": Item,

				"sync": function (method, collection, options) {
					options.dataType = "jsonp";
					return Backbone.sync(method, collection, options);
				},

				"parse": function (response) {
					this.total = response[2].paging.total;
					return response[2].results;
				},

				"updateUrl": function (site) {
					return this.url = "https://api.mercadolibre.com/sites/" + site + "/search";
				},

				"url": function () {
					return "https://api.mercadolibre.com/sites/" + localStorage["seekerSite"] + "/search";
				}
			}),

		/*
		* Views
		*/

			SitesView = Backbone.View.extend({
				"tagName": "select",

				"className": "countries",

				"template": function (data) {
					var tpl = [
						'<option data-id="' + data.id +'" value="' + data.id + '">' + data.name + '</option>'
					];

					return tpl.join("");
				},

				"initialize": function () {
					var that = this;

					this.collection = new SitesCollection();
					this.collection.sync("read", this.collection, {
						"success": function (data) {
							that.collection.reset(data[2]);

							that.render();

							if (!localStorage["seekerSite"]) {
								that.createMap();
								$.getJSON("https://wipmania.com/jsonp?callback=?", function(data) {
									localStorage["seekerSite"] = that.countryMap[data.address.country] || "MLA";
								});
							}
						}
					});

					this.on("changeSite", function (site) {
						localStorage["seekerSite"] = site;
						app.header.seeker.collection.updateUrl(site);
						$(".ch-icon-list").click();
					});
				},

				"render": function () {
					this.$el.append("<option value=\"\">Selecciona un país...</option>");

					_.each(this.collection.models, function (site) {
						this.$el.append(this.template(site.toJSON()));
					}, this);

					$("#navigation").append(this.$el);

				},

				"events": {
					"change": "changeSite"
				},

				"changeSite": function (event) {
					this.trigger("changeSite", event.srcElement.value);
					return false;
				},

				"createMap": function () {
					var countryMap = {};
					_.each(this.collection.models, function (site) {
						countryMap[site.get("name")] = site.id;
					});

					this.countryMap = countryMap;
				}

			}),


			ItemView = Backbone.View.extend({
				"tagName": "li",

				"template": function (data) {
					var tpl = [
						'<article class="item">',
							'<a href="#item/' + data.id + '" data-permalink="' + data.permalink + '">',
								'<figure><img src="' + data.thumbnail + '" alt="' + data.title + '" width="90" height="90"/></figure>',
								'<h2>' + data.title + '</h2>',
								'<p class="location">En ' + data.address.state_name + '</p>',
								'<p class="ch-price">' + data.currency_id + ' ' + data.price + '</p>',
							'</a>',
						'</article>'
					];

					return tpl.join("");
				},

				"render": function () {
					var item = this.model,
						stop = item.get("stop_time").split("T");

					// Parse currency id
					item.set("currency_id", this.currencyMap[item.get("currency_id")]);

					// Set oringal image
					item.set("picture", item.get("thumbnail").replace("v_I_f", "v_O_f"));
					
					// Translate the conditions
					item.set("condition", this.conditionMap[item.get("condition")]);

					// Calulate countdown days
					item.set("countDown", this.countDown(item.get("stop_time")));

					item.set("stop_date", stop[0]);
					item.set("stop_hour", stop[1].split(".")[0]);

					// Translate the buying mode
					item.set("buying_mode", this.buyingModeMap[item.get("buying_mode")]);

					item = item.toJSON();

					$(this.el).html(this.template(item));

					return this;
				},

				"countDown": function (date) {
					var end = new Date(date),
						today = new Date(),
						diff = end.getTime() - today.getTime(),
						days = Math.floor(diff / (1000 * 60 * 60 * 24));
					return days;
				},

				"conditionMap": {
					"new": "Nuevo",
					"used": "Usado"
				},

				"buyingModeMap": {
					"auction": "Subasta",
					"buy_it_now": "Compra Inmediata"
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
			}),

			SeekerView = Backbone.View.extend({
				"el": "#results",

				"initialize": function (app) {
					this.offset = 0;
					this.limit = 10;
					this.query = app.query;
					this.collection = new ItemsCollection();

					this.$el
						.prepend(this.$list)
						.prepend(this.$notFound);
						
				},

				"events": {
					"scroll": "more"
				},

				"$list": $("<ul class=\"slats ch-slats ch-list\">"),

				"$loading": $(".ch-loading-wrap"),

				"$notFound": $("<p class=\"ch-hide ch-form-action ch-box-highlight\">No se encontraron resultados.</p>"),

				"render": function () {
					var that = this;
					
					_.each(this.collection.models.slice(this.offset), function (item) {
						var items = new ItemView({"model": item});
						that.$list.append(items.render(item).el);
					}, this);


					if (this.collection.total === 0) {
						this.$notFound.removeClass("ch-hide");
					}
					
					return this;
				},

				"fetch":  function (o) {
					var that  = this,
						o = o || {},
						add = o.add || false;

					this.$loading.removeClass("ch-hide");

					this.collection.fetch({
						"add": add,
						"data": {
							"q": that.query,
							"limit": this.limit,
							"offset": that.offset
						},
						"success": function () {
							that.$loading.addClass("ch-hide");
							that.render();
						}
					});
				},

				"start": function (query) {
					this.query = query;

					this.offset = 0;

					this.reset();

					$("#results").removeClass("ch-hide");

					this.fetch();
				},

				"more": function () {
					var height = this.$list.height() - this.$el.height(),
						bottom = this.el.scrollTop;

					if (height === bottom) {
						this.offset += this.limit;
						this.fetch({"add": true});
					};
				},

				"reset": function () {
					this.collection.reset();
					this.$notFound.addClass("ch-hide");
					this.$list.html("");
				}


			}),

			VipView = Backbone.View.extend({
				"el": "#vip",

				"template": function (data) {
					var tpl = [
						'<article id="item">',
								'<h1>' + data.title + '</h1>',
								'<p class="ch-price">' + data.currency_id + ' ' + data.price + '</p>',
								'<figure>',
									'<img src="' + data.picture + '" alt="' + data.title + '"/>',
								'</figure>',
								'<ul class="ch-list">',
									'<li class="ch-icon-gift">' + data.condition + '</li>',
									'<li class="ch-icon-tags">' + data.buying_mode + '</li>',
									'<li class="ch-icon-calendar">Finaliza el ' + data.stop_date + ' a las ' + data.stop_hour + ' (en ' + data.countDown + ' días)</li>',
									'<li class="ch-icon-map-marker">' + data.address.city_name + ', ' + data.address.state_name + '</li>',
									'<li class="ch-icon-shopping-cart">' + data.sold_quantity + ' vendidos</li>',
								'</ul>',
								//'<a href="https://compra.mercadolibre.com.ar/bid/confirm?item_id=' + data.id + '&quantity=1&parent_url=' + data.permalink + '-_JM" class="ch-btn buy">Comprar</a>',
								'<a href="' + data.permalink + '" class="ch-btn buy">Ver en MercadoLibre</a>',
						'</article>'
					];

					return tpl.join("");
				},

				"events": {
					"click .buy": "buy"
				},

				"render": function (item) {
					$(this.el).html(this.template(item));
					return this;
				},

				"buy": function (event) {
					chrome.tabs.create({url: event.target.href});	
				}

			}),


			Header = Backbone.View.extend({
				"el": ".ch-header",

				"$query": $("#query"),

				"initialize": function (app) {
					this.app = app;
					this.renderSites();
					this.seekerInit();
				},

				"events": {
					"submit .ch-header-form": "seek"
				},

				"renderSites": function () {
					ch.mobile.menu($(".ch-header menu li"));
					this.sites = new SitesView();
				},

				"seekerInit": function () {
					this.seeker = new SeekerView(this.app);
				},

				"seek": function () {
					var app = this.app;
					app.query = (this.$query.val()).trim();
					this.seeker.start(app.query);

					return false;
				}
			}),

			App = Backbone.Router.extend({
				"routes": {
					"": "index",
					"item/:id": "vip"
				},

				"$search": $("[data-page=\"search\"]"),

				"$vip": $("[data-page=\"vip\"]"),

				"initialize": function () {		
					this.query = "";
					this.header = new Header(this);
					this.vip = new VipView();
				},

				"transition": function () {
					this.$search.toggleClass("ch-hiden");
					this.$vip.toggleClass("ch-hide");
				},

				"index": function () {
					this.$search.removeClass("ch-hiden");
					this.$vip.addClass("ch-hide");
				},

				"vip": function (id) {
					this.transition();
					var item = this.header.seeker.collection.get(id)["attributes"];
					this.vip.render(item);
				}
			}),
			
			core = {
				"Seeker": App
			};

		return core;

	}());

	exports.app = app;

}(this));