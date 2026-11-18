'use strict';

const { judge } = require('../server/judge.cjs');
const { problems: bank } = require('../data/bank.cjs');

async function checkAnswers() {
  let passed = 0;
  let cases = 0;
  let total = 0;
  for (const problem of bank) {
    const result = await judge(problem, problem.solution);
    total += result.total;
    cases += result.passed;
    console.log(problem.title + '  ' + result.passed + '/' + result.total + '  ' + result.status);
    if (result.status === 'accepted') passed++;
    else console.error(result.message || result.results.filter(r => !r.passed));
  }
  console.log('参考解通过 ' + passed + '/' + bank.length + ' 题，用例通过 ' + cases + '/' + total + ' 组。');
  process.exitCode = passed === bank.length ? 0 : 1;
}

checkAnswers().catch(err => { console.error(err); process.exitCode = 1; });
