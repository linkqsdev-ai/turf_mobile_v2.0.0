const path = require('path');
const Module = require('module');

// Alias resolver for '@/...'
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/assets/')) {
    const relative = request.replace('@/assets/', '');
    const absolute = path.resolve(__dirname, '../assets', relative);
    return originalResolveFilename.call(this, absolute, parent, isMain, options);
  }
  if (request.startsWith('@/')) {
    const relative = request.replace('@/', '');
    const absolute = path.resolve(__dirname, '../src', relative);
    return originalResolveFilename.call(this, absolute, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Asset mock
require.extensions['.png'] = () => 1;
require.extensions['.jpg'] = () => 1;
require.extensions['.jpeg'] = () => 1;
require.extensions['.svg'] = () => 1;

// Execute test suite
const { runAllMobileTests } = require('../src/__tests__/app-flows.test.ts');
if (typeof runAllMobileTests === 'function') {
  runAllMobileTests();
}
