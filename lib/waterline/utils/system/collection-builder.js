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
      !_.isString(edgeDefinition.from) ||
      !_.isString(edgeDefinition.to)
    ) {
      throw new Error(
        `Unrecognized edgeDefinition for model ${
          collection.prototype.tableName
        }`
      );
    }
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

  // Add the collection to the datastore listing
  datastores[datastoreName].collections.push(collection.prototype.identity);

  //  ╦╔╗╔╔═╗╔╦╗╔═╗╔╗╔╔╦╗╦╔═╗╔╦╗╔═╗
  //  ║║║║╚═╗ ║ ╠═╣║║║ ║ ║╠═╣ ║ ║╣
  //  ╩╝╚╝╚═╝ ╩ ╩ ╩╝╚╝ ╩ ╩╩ ╩ ╩ ╚═╝
  var liveModel = new collection(context, datastores[datastoreName]);

  return liveModel;
};
