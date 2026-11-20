'use strict';

const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const modules = ['kernel', 'ecology', 'catalog', 'world', 'actions', 'persistence', 'survey', 'terrain'];
const source = modules.map(name => fs.readFileSync(path.join(__dirname, '../src/', name + '.js'), 'utf8')).join('\n');
module.exports = vm.runInNewContext(source + '\nG;', {
  Math,
  JSON,
  Map,
  Set,
  Array,
  Object,
  Number,
  String,
  Error,
  Infinity,
  console
});
