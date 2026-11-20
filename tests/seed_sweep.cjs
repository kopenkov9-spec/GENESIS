'use strict';

const {
  play
} = require('./journey.cjs');
const total = Number(process.argv[2] || 96);
if (!Number.isInteger(total) || total < 1) throw Error('Expected a positive number of seeds');
const ticks = [],
  failures = [];
for (let i = 0; i < total; i++) {
  const seed = 'ARCHIPELAGO-' + i;
  try {
    ticks.push(play(seed).stats.ticks);
  } catch (error) {
    failures.push({
      seed,
      reason: error.message
    });
  }
}
console.log(JSON.stringify({
  tested: total,
  passed: ticks.length,
  failed: failures.length,
  minTicks: Math.min(...ticks),
  maxTicks: Math.max(...ticks),
  failures
}, null, 2));
if (failures.length) process.exitCode = 1;
