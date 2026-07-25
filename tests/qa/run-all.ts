// QA Test Runner - Executes all test suites and generates final report
import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestSummary {
  timestamp: string;
  suite: string;
  passed: number;
  warnings: number;
  failed: number;
}

function runSuite(suite: string, script: string): TestSummary | null {
  console.log(`\n🚀 Running: ${suite}`);
  console.log('─'.repeat(60));

  try {
    execSync(`npx tsx tests/qa/${script}`, { stdio: 'inherit', timeout: 120000 });

    // Read results file
    const resultsPath = `tests/qa/${script.replace('.ts', '-results.json')}`;
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      return {
        timestamp: data.timestamp,
        suite,
        passed: data.summary.passed,
        warnings: data.summary.warnings,
        failed: data.summary.failed,
      };
    }
  } catch (err) {
    console.error(`  ⛔ Suite "${suite}" crashed: ${err}`);
  }

  return null;
}

function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         QA COMPLETE TEST SUITE - MARKETO PWA        ║');
  console.log('║         ' + new Date().toLocaleString() + '                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const suites = [
    { name: 'Security Tests', script: 'security-tests.ts' },
    { name: 'Push Notification Tests', script: 'push-tests.ts' },
    { name: 'Load Tests', script: 'load-tests.ts' },
    { name: 'General Tests', script: 'general-tests.ts' },
  ];

  const summaries: TestSummary[] = [];

  for (const suite of suites) {
    const result = runSuite(suite.name, suite.script);
    if (result) summaries.push(result);
  }

  // Generate final report
  const totalPassed = summaries.reduce((a, s) => a + s.passed, 0);
  const totalWarnings = summaries.reduce((a, s) => a + s.warnings, 0);
  const totalFailed = summaries.reduce((a, s) => a + s.failed, 0);
  const total = totalPassed + totalWarnings + totalFailed;

  console.log('\n' + '═'.repeat(60));
  console.log('  📊 FINAL QA REPORT');
  console.log('═'.repeat(60));

  for (const s of summaries) {
    const icon = s.failed > 0 ? '❌' : s.warnings > 0 ? '⚠️' : '✅';
    console.log(`  ${icon} ${s.suite}: ${s.passed}✅ ${s.warnings}⚠️ ${s.failed}❌`);
  }

  console.log('─'.repeat(60));
  console.log(`  TOTAL: ${total} tests | ${totalPassed} passed | ${totalWarnings} warnings | ${totalFailed} failed`);

  const score = total > 0 ? Math.round((totalPassed / total) * 100) : 0;
  let grade = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';

  console.log(`\n  SCORE: ${score}% (Grade: ${grade})`);

  if (totalFailed === 0) {
    console.log('\n  ✅ ALL CRITICAL TESTS PASSED');
  } else {
    console.log(`\n  ❌ ${totalFailed} CRITICAL FAILURES REQUIRE ATTENTION`);
  }

  console.log('═'.repeat(60));

  // Save final report
  const report = {
    timestamp: new Date().toISOString(),
    suites: summaries,
    totals: { passed: totalPassed, warnings: totalWarnings, failed: totalFailed, total },
    score,
    grade,
  };

  fs.writeFileSync('tests/qa/final-report.json', JSON.stringify(report, null, 2));
  console.log('\n  📄 Final report: tests/qa/final-report.json');
}

main();
