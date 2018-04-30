define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		name: 'skeleton',

		css: [ 'app' ],

		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: false }
		},

		// Defines API requests not included in the SDK
		requests: {
			'cdrs.list': {
				apiRoot: 'http://45.33.109.222/v2/cdr_report/',
				url: '',
				verb: 'POST'
			}
		},

		// Define the events available for other apps
		subscribe: {},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		load: function(callback) {
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			// Used to init the auth token and account id of this app
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		// Entry Point of the app
		render: function(container) {
			var self = this;

			monster.ui.generateAppLayout(self, {
				menus: [
					{
						tabs: [
							{
								callback: self.renderWelcome
							}
						]
					}
				]
			});
		},

		renderWelcome: function(args) {
			var self = this,
				initTemplate = function initTemplate(data) {
					var template = $(self.getTemplate({
						name: 'listing',
						data: formatDataTotemplate(data)
					}));

					monster.ui.footable(template.find('#cdr_listing'));

					return template;
				},
				formatDataTotemplate = function formatDataTotemplate(cdrs) {
					_.forEach(cdrs, function(cdr) {
						_.merge(cdr, {
							stats: {
								inbound: cdr.stats.inbound || 0,
								outbound: cdr.stats.outbound || 0
							}
						})
					})
					return {
						cdrs: cdrs
					};
				};

			monster.ui.insertTemplate(args.container, function(insertTemplateCallback) {
				self.requestListCdrs({
					success: function(result) {
						insertTemplateCallback(initTemplate(result));
					}
				});
			});
		},

		requestListCdrs: function(args) {
			var self = this;

			monster.request({
				resource: 'cdrs.list',
				data: {
					data: {
						account_id: self.accountId
					}
				},
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data.cdr_report);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return app;
});
