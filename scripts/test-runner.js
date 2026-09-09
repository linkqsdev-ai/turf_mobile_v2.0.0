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

// Execute test suites
let failures = 0;

const { runAllMobileTests } = require('../src/__tests__/app-flows.test.ts');
if (typeof runAllMobileTests === 'function') {
  runAllMobileTests();
}

const { runCricketEngineTests } = require('../src/__tests__/cricket-engine.test.ts');
if (typeof runCricketEngineTests === 'function') {
  const result = runCricketEngineTests();
  failures += (result && result.failed) || 0;
}

const { runBookingRescheduleTests } = require('../src/__tests__/booking-reschedule.test.ts');
if (typeof runBookingRescheduleTests === 'function') {
  const result = runBookingRescheduleTests();
  failures += (result && result.failed) || 0;
}

const { runClassScheduleTests } = require('../src/__tests__/class-schedule.test.ts');
if (typeof runClassScheduleTests === 'function') {
  const result = runClassScheduleTests();
  failures += (result && result.failed) || 0;
}

const { runClassListTests } = require('../src/__tests__/class-list.test.ts');
if (typeof runClassListTests === 'function') {
  const result = runClassListTests();
  failures += (result && result.failed) || 0;
}

const { runLayoutSafetyTests } = require('../src/__tests__/layout-safety.test.ts');
if (typeof runLayoutSafetyTests === 'function') {
  const result = runLayoutSafetyTests();
  failures += (result && result.failed) || 0;
}

const { runTournamentRulesTests } = require('../src/__tests__/tournament-rules.test.ts');
if (typeof runTournamentRulesTests === 'function') {
  const result = runTournamentRulesTests();
  failures += (result && result.failed) || 0;
}

// A red suite must fail the command, or CI and pre-commit hooks will pass over it.
if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
