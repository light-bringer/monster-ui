define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var account = {

		subscribe: {
			'myaccount.account.renderContent': '_accountRenderContent'
		},

		_accountRenderContent: function(args){
			var self = this;

			self.accountGetData(function(data) {
				var accountTemplate = $(monster.template(self, 'account-layout', data));

				self.accountBindEvents(accountTemplate, data);

				monster.pub('myaccount.renderSubmodule', accountTemplate);

				args.callback && args.callback(accountTemplate);
			});
		},

		accountBindEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '220px' });

			//Temporary button design fix until we redesign the Accounts Manager
			template.find('#accountsmanager_carrier_save')
					.removeClass('btn btn-success')
					.addClass('monster-button-success');

			template.find('#numbers_format_exceptions').chosen({ search_contains: true, width: '220px' });

			template.find('[name="ui_flags.numbers_format"]').on('change', function() {
				template.find('.group-for-exceptions').toggleClass('active', template.find('[name="ui_flags.numbers_format"]:checked').val() === 'international_with_exceptions');
			});

			monster.ui.tooltips(template);

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		accountGetNoMatch: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_numbers: 'no_match'
					}
				},
				success: function(listCallflows) {
					if(listCallflows.data.length === 1) {
						self.callApi({
							resource: 'callflow.get',
							data: {
								callflowId: listCallflows.data[0].id,
								accountId: self.accountId
							},
							success: function(callflow) {
								callback(callflow.data);
							}
						});
					}
					else {
						callback({});
					}
				}
			});
		},

		accountGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							callback && callback(null, data.data);
						}
					});
				},
				noMatch: function(callback) {
					self.accountGetNoMatch(function(data) {
						callback && callback(null, data);
					});
				},
				countries: function(callback) {
					callback && callback(null, timezone.getCountries());
				}
			}, function(err, results) {
				self.accountFormatData(results, globalCallback);
			});
		},

		accountFormatData: function(data, globalCallback) {
			var self = this;

			if (!(data.account.hasOwnProperty('ui_flags') && data.account.ui_flags.hasOwnProperty('numbers_format'))) {
				data.account.ui_flags = data.account.ui_flags || {};
				data.account.ui_flags.numbers_format = 'international';
			}

			globalCallback && globalCallback(data);
		}
	};

	return account;
});