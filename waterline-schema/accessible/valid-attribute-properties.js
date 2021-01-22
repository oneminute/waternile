//  ██╗   ██╗ █████╗ ██╗     ██╗██████╗
//  ██║   ██║██╔══██╗██║     ██║██╔══██╗
//  ██║   ██║███████║██║     ██║██║  ██║
//  ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║
//   ╚████╔╝ ██║  ██║███████╗██║██████╔╝
//    ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝
//
//  ██████╗ ██████╗  ██████╗ ██████╗ ███████╗██████╗ ████████╗██╗███████╗███████╗
//  ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║██╔════╝██╔════╝
//  ██████╔╝██████╔╝██║   ██║██████╔╝█████╗  ██████╔╝   ██║   ██║█████╗  ███████╗
//  ██╔═══╝ ██╔══██╗██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗   ██║   ██║██╔══╝  ╚════██║
//  ██║     ██║  ██║╚██████╔╝██║     ███████╗██║  ██║   ██║   ██║███████╗███████║
//  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚══════╝╚══════╝
//
module.exports = [
  // Basic semantics:
  'type',
  'defaultsTo',
  'required',
  'allowNull',
  'autoUpdatedAt',
  'autoCreatedAt',

  // Auto-migrations:
  'autoMigrations',

  // High-level validation rules:
  'validations',
  'rules',

  // Associations:
  'through',
  'collection',
  'model',
  'via',
  'dominant',

  // Adapter:
  'columnName',
  'meta',

  // At-rest encryption:
  'encrypt',

  // Advisory
  'description',
  'extendedDescription',
  'moreInfoUrl',
  'example',
  'protect',
];
