/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');
var buildOmen = require('../utils/query/build-omen');
var forgeAdapterError = require('../utils/query/forge-adapter-error');
var forgeStageTwoQuery = require('../utils/query/forge-stage-two-query');
var forgeStageThreeQuery = require('../utils/query/forge-stage-three-query');
var getQueryModifierMethods = require('../utils/query/get-query-modifier-methods');
var verifyModelMethodContext = require('../utils/query/verify-model-method-context');

/**
 * Module constants
 */

var DEFERRED_METHODS = getQueryModifierMethods('findWithCount');

/**
 * findWithCount()
 *
 * Find records that match the specified criteria.
 *
 * ```
 * // Look up all bank accounts with more than $32,000 in them.
 * BankAccount.findWithCount().where({
 *   balance: { '>': 32000 }
 * }).exec(function(err, bankAccounts) {
 *   // ...
 * });
 * ```
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * Usage without deferred object:
 * ================================================
 *
 * @param {Dictionary?} criteria
 *
 * @param {Dictionary} populates
 *
 * @param {Function?} explicitCbMaybe
 *        Callback function to run when query has either finished successfully or errored.
 *        (If unspecified, will return a Deferred object instead of actually doing anything.)
 *
 * @param {Ref?} meta
 *     For internal use.
 *
 * @returns {Ref?} Deferred object if no `explicitCbMaybe` callback was provided
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * The underlying query keys:
 * ==============================
 *
 * @qkey {Dictionary?} criteria
 * @qkey {Dictionary?} populates
 *
 * @qkey {Dictionary?} meta
 * @qkey {String} using
 * @qkey {String} method
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function findWithCount(/* criteria?, populates?, explicitCbMaybe?, meta? */) {
  // Verify `this` refers to an actual Sails/Waterline model.
  verifyModelMethodContext(this);

  // Set up a few, common local vars for convenience / familiarity.
  var WLModel = this;
  var orm = this.waterline;
  var modelIdentity = this.identity;

  // Build an omen for potential use in the asynchronous callbacks below.
  var omen = buildOmen(findWithCount);

  // Build query w/ initial, universal keys.

  var query = {
    method: 'findWithCount',
    using: modelIdentity,
  };

  //  ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗ ██████╗███████╗
  //  ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║██╔════╝██╔════╝
  //  ██║   ██║███████║██████╔╝██║███████║██║  ██║██║██║     ███████╗
  //  ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██║  ██║██║██║     ╚════██║
  //   ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝██║╚██████╗███████║
  //    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝╚══════╝
  //

  // The `explicitCbMaybe` callback, if one was provided.
  var explicitCbMaybe;

  // Handle the various supported usage possibilities
  // (locate the `explicitCbMaybe` callback, and extend the `query` dictionary)
  //
  // > Note that we define `args` to minimize the chance of this "variadics" code
  // > introducing any unoptimizable performance problems.  For details, see:
  // > https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
  // > •=> `.length` is just an integer, this doesn't leak the `arguments` object itself
  // > •=> `i` is always valid index in the arguments object
  var args = new Array(arguments.length);
  for (var i = 0; i < args.length; ++i) {
    args[i] = arguments[i];
  }

  // • findWithCount(explicitCbMaybe, ...)
  if (args.length >= 1 && _.isFunction(args[0])) {
    explicitCbMaybe = args[0];
    query.meta = args[1];
  }
  // • findWithCount(criteria, explicitCbMaybe, ...)
  else if (args.length >= 2 && _.isFunction(args[1])) {
    query.criteria = args[0];
    explicitCbMaybe = args[1];
    query.meta = args[2];
  }
  // • findWithCount()
  // • findWithCount(criteria)
  // • findWithCount(criteria, populates, ...)
  else {
    query.criteria = args[0];
    explicitCbMaybe = args[1];
    query.meta = args[2];
  }

  //  ██████╗ ███████╗███████╗███████╗██████╗
  //  ██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗
  //  ██║  ██║█████╗  █████╗  █████╗  ██████╔╝
  //  ██║  ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══██╗
  //  ██████╔╝███████╗██║     ███████╗██║  ██║
  //  ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
  //
  //   ██╗███╗   ███╗ █████╗ ██╗   ██╗██████╗ ███████╗██╗
  //  ██╔╝████╗ ████║██╔══██╗╚██╗ ██╔╝██╔══██╗██╔════╝╚██╗
  //  ██║ ██╔████╔██║███████║ ╚████╔╝ ██████╔╝█████╗   ██║
  //  ██║ ██║╚██╔╝██║██╔══██║  ╚██╔╝  ██╔══██╗██╔══╝   ██║
  //  ╚██╗██║ ╚═╝ ██║██║  ██║   ██║   ██████╔╝███████╗██╔╝
  //   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝
  //
  //  ┌┐ ┬ ┬┬┬  ┌┬┐   ┬   ┬─┐┌─┐┌┬┐┬ ┬┬─┐┌┐┌  ┌┐┌┌─┐┬ ┬  ┌┬┐┌─┐┌─┐┌─┐┬─┐┬─┐┌─┐┌┬┐
  //  ├┴┐│ │││   ││  ┌┼─  ├┬┘├┤  │ │ │├┬┘│││  │││├┤ │││   ││├┤ ├┤ ├┤ ├┬┘├┬┘├┤  ││
  //  └─┘└─┘┴┴─┘─┴┘  └┘   ┴└─└─┘ ┴ └─┘┴└─┘└┘  ┘└┘└─┘└┴┘  ─┴┘└─┘└  └─┘┴└─┴└─└─┘─┴┘
  //  ┌─    ┬┌─┐  ┬─┐┌─┐┬  ┌─┐┬  ┬┌─┐┌┐┌┌┬┐    ─┐
  //  │───  │├┤   ├┬┘├┤ │  ├┤ └┐┌┘├─┤│││ │   ───│
  //  └─    ┴└    ┴└─└─┘┴─┘└─┘ └┘ ┴ ┴┘└┘ ┴     ─┘
  // If a callback function was not specified, then build a new Deferred and bail now.
  //
  // > This method will be called AGAIN automatically when the Deferred is executed.
  // > and next time, it'll have a callback.

  return parley(
    function (done) {
      // Otherwise, IWMIH, we know that a callback was specified.
      // So...

      //  ███████╗██╗  ██╗███████╗ ██████╗██╗   ██╗████████╗███████╗
      //  ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║   ██║╚══██╔══╝██╔════╝
      //  █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║   ██║   █████╗
      //  ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║   ██║   ██╔══╝
      //  ███████╗██╔╝ ██╗███████╗╚██████╗╚██████╔╝   ██║   ███████╗
      //  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝

      //  ╔═╗╔═╗╦═╗╔═╗╔═╗  ┌─┐┌┬┐┌─┐┌─┐┌─┐  ┌┬┐┬ ┬┌─┐  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
      //  ╠╣ ║ ║╠╦╝║ ╦║╣   └─┐ │ ├─┤│ ┬├┤    │ ││││ │  │─┼┐│ │├┤ ├┬┘└┬┘
      //  ╚  ╚═╝╩╚═╚═╝╚═╝  └─┘ ┴ ┴ ┴└─┘└─┘   ┴ └┴┘└─┘  └─┘└└─┘└─┘┴└─ ┴
      //
      // Forge a stage 2 query (aka logical protostatement)
      try {
        forgeStageTwoQuery(query, orm);

        if (query.criteria) {
          query.criteria = {
            let: WLModel._let,
            ...query.criteria,
          };
        }
      } catch (e) {
        switch (e.code) {
          case 'E_INVALID_CRITERIA':
            return done(
              flaverr(
                {
                  name: 'UsageError',
                  code: e.code,
                  details: e.details,
                  message:
                    'Invalid criteria.\n' +
                    'Details:\n' +
                    '  ' +
                    e.details +
                    '\n',
                },
                omen
              )
            );

          case 'E_INVALID_POPULATES':
            return done(
              flaverr(
                {
                  name: 'UsageError',
                  code: e.code,
                  details: e.details,
                  message:
                    'Invalid populate(s).\n' +
                    'Details:\n' +
                    '  ' +
                    e.details +
                    '\n',
                },
                omen
              )
            );

          case 'E_NOOP':
            return done(undefined, []);

          default:
            return done(e);
        }
      } // >-•

      //  ╔═╗╔═╗╦═╗╔═╗╔═╗  ┌─┐┌┬┐┌─┐┌─┐┌─┐  ┌┬┐┬ ┬┬─┐┌─┐┌─┐  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
      //  ╠╣ ║ ║╠╦╝║ ╦║╣   └─┐ │ ├─┤│ ┬├┤    │ ├─┤├┬┘├┤ ├┤   │─┼┐│ │├┤ ├┬┘└┬┘
      //  ╚  ╚═╝╩╚═╚═╝╚═╝  └─┘ ┴ ┴ ┴└─┘└─┘   ┴ ┴ ┴┴└─└─┘└─┘  └─┘└└─┘└─┘┴└─ ┴
      try {
        query = forgeStageThreeQuery({
          stageTwoQuery: query,
          identity: modelIdentity,
          transformer: WLModel._transformer,
          originalModels: orm.collections,
        });
      } catch (e) {
        return done(e);
      }

      //  ┌─┐┌─┐┌┐┌┌┬┐  ┌┬┐┌─┐  ╔═╗╔╦╗╔═╗╔═╗╔╦╗╔═╗╦═╗
      //  └─┐├┤ │││ ││   │ │ │  ╠═╣ ║║╠═╣╠═╝ ║ ║╣ ╠╦╝
      //  └─┘└─┘┘└┘─┴┘   ┴ └─┘  ╩ ╩═╩╝╩ ╩╩   ╩ ╚═╝╩╚═
      // Grab the appropriate adapter method and call it.
      var adapter = WLModel._adapter;
      if (!adapter.findWithCount) {
        return done(
          new Error(
            'The adapter used by this model (`' +
              modelIdentity +
              "`) doesn't support the `" +
              query.method +
              '` method.'
          )
        );
      }

      adapter.findWithCount(
        WLModel.datastore,
        query,
        function _afterTalkingToAdapter(err, findWithCount) {
          if (err) {
            err = forgeAdapterError(
              err,
              omen,
              'findWithCount',
              modelIdentity,
              orm
            );
            return done(err);
          } //-•

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Log a warning like the ones in `process-all-records` if
          // the findWithCount sent back by the adapter turns out to be something other
          // than a number (for example, the naive behavior of a MySQL adapter
          // in circumstances where criteria does not match any records); i.e.
          // ```
          // !_.isNumber(findWithCount) || findWithCount === Infinity || findWithCount === -Infinity || _.isNaN(findWithCount)
          // ````
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          return done(undefined, findWithCount);
        }
      ); //</adapter.findWithCount()>
    },

    explicitCbMaybe,

    _.extend(DEFERRED_METHODS, {
      // Provide access to this model for use in query modifier methods.
      _WLModel: WLModel,

      // Set up initial query metadata.
      _wlQueryInfo: query,
    })
  ); //</ parley() >
};
