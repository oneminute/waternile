var _ = require('@sailshq/lodash');

//  ██████╗ ██╗   ██╗██╗██╗     ██████╗     ██╗     ██╗██╗   ██╗███████╗
//  ██╔══██╗██║   ██║██║██║     ██╔══██╗    ██║     ██║██║   ██║██╔════╝
//  ██████╔╝██║   ██║██║██║     ██║  ██║    ██║     ██║██║   ██║█████╗
//  ██╔══██╗██║   ██║██║██║     ██║  ██║    ██║     ██║╚██╗ ██╔╝██╔══╝
//  ██████╔╝╚██████╔╝██║███████╗██████╔╝    ███████╗██║ ╚████╔╝ ███████╗
//  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝     ╚══════╝╚═╝  ╚═══╝  ╚══════╝
//
//  ██╗    ██╗██╗         ███╗   ███╗ ██████╗ ██████╗ ███████╗██╗
//  ██║    ██║██║         ████╗ ████║██╔═══██╗██╔══██╗██╔════╝██║
//  ██║ █╗ ██║██║         ██╔████╔██║██║   ██║██║  ██║█████╗  ██║
//  ██║███╗██║██║         ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ██║
//  ╚███╔███╔╝███████╗    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████╗
//   ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝
//
// Normalize a Waterline model instance and attaches the correct datastore, returning a "live model".
module.exports = function CollectionBuilder(collection, datastores, context) {
  //  ╦  ╦╔═╗╦  ╦╔╦╗╔═╗╔╦╗╔═╗
  //  ╚╗╔╝╠═╣║  ║ ║║╠═╣ ║ ║╣
  //   ╚╝ ╩ ╩╩═╝╩═╩╝╩ ╩ ╩ ╚═╝

  // Throw Error if no Tablename/Identity is set
  if (
    !_.has(collection.prototype, 'tableName') &&
    !_.has(collection.prototype, 'identity')
  ) {
    throw new Error('A tableName or identity property must be set.');
  }

  // Find the datastores used by this collection. If none are specified check
  // if a default datastores exist.
  // if (!_.has(collection.prototype, 'datastore')) {
  if (collection.prototype.datastore === undefined) {
    // Check if a default datastore was specified
    if (!_.has(datastores, 'default')) {
      throw new Error(
        'No `datastore` was specified in the definition for model `' +
          collection.prototype.identity +
          '`, and there is no default datastore (i.e. defined as "default") to fall back to.  (Usually, if the "default" datastore is missing, it means the ORM is not set up correctly.)'
      );
    }

    // Set the datastore as the default
    collection.prototype.datastore = 'default';
  }

  // Find the classType used by this collection. If none are specified check
  if (collection.prototype.classType === undefined) {
    // Set the classType to document
    collection.prototype.classType = 'Vertex';
  }

  // Find the tenantType used by this collection. If none are specified check
  if (collection.prototype.tenantType === undefined) {
    // Set the tenantType to document
    collection.prototype.tenantType = ['default'];
  }

  if (!_.isArray(collection.prototype.tenantType)) {
    throw new Error(
      'The  `tenantType` was specified in the definition for model `' +
        collection.prototype.identity +
        '`, It must be an array.)'
    );
  }

  // Find the indexes used by this collection. If none are specified check
  if (
    collection.prototype.indexes === undefined ||
    !_.isArray(collection.prototype.indexes)
  ) {
    // Set the classType to document
    collection.prototype.indexes = [];
  }

  //Check if a valid ClassType has been set

  var classTypeName = collection.prototype.classType;

  if (!_.includes(['Vertex', 'Edge'], classTypeName)) {
    throw new Error(
      'Unrecognized classType (`' +
        classTypeName +
        '`) specified in the definition for model `' +
        collection.prototype.identity +
        '`.  (Usually, it should be one of Vertex, or Edge)'
    );
  }
  //check if edgeCollection is defined

  // Find the edgeDefinition used by this collection. If none are specified check
  if (collection.prototype.classType === 'Edge') {
    // Find the classType used by this collection. If none are specified check
    if (collection.prototype.edgeDefinition === undefined) {
      // Set the edgeDefinition to document
      collection.prototype.edgeDefinition = {};
    }

    var edgeDefinition = collection.prototype.edgeDefinition || {};

    if (
      !edgeDefinition.from ||
      !edgeDefinition.to ||
      !_.isArray(edgeDefinition.from) ||
      !_.isArray(edgeDefinition.to)
    ) {
      throw new Error(
        `\n\nUnrecognized edgeDefinition for model ${collection.prototype.tableName}. Edge definitions of array types should be well defined.\n\n`
      );
    }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Check whetjer Indexes have been defined properly
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const { indexes } = collection.prototype;

  if (indexes.length > 0) {
    _.each(indexes, (ind) => {
      if (!_.isObject(ind)) {
        throw new Error(
          `\n\n\incorrect index definition for model ${collection.prototype.tableName}. Each Item of array must contain either 'fields, geo, goeJson' Array property \n\n`
        );
      }

      _.each(ind, (value, key) => {
        if (key === 'fields' && !_.isArray(value)) {
          throw new Error(
            `\n\n\incorrect index definition for model ${collection.prototype.tableName}. Each Item of array must contain either 'fields, geo, goeJson' Array property \n\n`
          );
        }

        if (key === 'sparse' && !_.isBoolean(value)) {
          throw new Error(
            `\n\n\sparse attribute for indexes definition in ${collection.prototype.tableName} must  be of type boolean \n\n`
          );
        }
      });

      if (_.has(ind, 'fields') || _.has(ind, 'geoJson')) {
        let attributes = [];

        if (collection.prototype.classType === 'Edge') {
          attributes = ['_from', '_to'];
        }

        _.each(collection.prototype.attributes, (value, key) => {
          attributes.push(key);
        });

        _.each(ind.fields, (attribute, index) => {
          let att = attribute;

          if (`${attribute}`.includes('.')) {
            att = attribute.split('.')[0];
          }

          if (!_.includes(attributes, att)) {
            throw new Error(
              `\n\n\'${att}' is not a recognized attribute in model ${collection.prototype.tableName}. \n\n`
            );
          }
        });
      }

      //Check that values of each 'field' is a valid Model Attribute in the collection
    });
  }

  //  ╔═╗╔═╗╔╦╗  ┌─┐┌─┐┌┬┐┬┬  ┬┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┌─┐┌┬┐┌─┐┬─┐┌─┐┌─┐
  //  ╚═╗║╣  ║   ├─┤│   │ │└┐┌┘├┤    ││├─┤ │ ├─┤└─┐ │ │ │├┬┘├┤ └─┐
  //  ╚═╝╚═╝ ╩   ┴ ┴└─┘ ┴ ┴ └┘ └─┘  ─┴┘┴ ┴ ┴ ┴ ┴└─┘ ┴ └─┘┴└─└─┘└─┘

  // Set the datastore used for the adapter
  var datastoreName = collection.prototype.datastore;

  // Ensure the named datastore exists
  if (!_.has(datastores, datastoreName)) {
    if (datastoreName !== 'default') {
      throw new Error(
        'Unrecognized datastore (`' +
          datastoreName +
          '`) specified in the definition for model `' +
          collection.prototype.identity +
          '`.  Please make sure it exists. (If you\'re unsure, use "default".)'
      );
    } else {
      throw new Error(
        'Unrecognized datastore (`' +
          datastoreName +
          '`) specified in the definition for model `' +
          collection.prototype.identity +
          '`.  (Usually, if the "default" datastore is missing, it means the ORM is not set up correctly.)'
      );
    }
  }

  // Edited by gaitho
  // if datastore is default duplicate model in every datastore

  if (datastoreName === 'default') {
    _.each(_.keys(datastores), (dsName) => {
      datastores[dsName].collections.push(collection.prototype.identity);
    });
  } else {
    datastores[datastoreName].collections.push(collection.prototype.identity);
  }

  // Add the collection to the datastore listing

  //  ╦╔╗╔╔═╗╔╦╗╔═╗╔╗╔╔╦╗╦╔═╗╔╦╗╔═╗
  //  ║║║║╚═╗ ║ ╠═╣║║║ ║ ║╠═╣ ║ ║╣
  //  ╩╝╚╝╚═╝ ╩ ╩ ╩╝╚╝ ╩ ╩╩ ╩ ╩ ╚═╝

  var liveModel = new collection(context, datastores[datastoreName]);

  return liveModel;
};
