#!/usr/bin/env node

/**
 * Simple test runner for Buy Me a Coffee MVP
 * Runs all tests and provides a summary report
 */

const { execSync } = require('child_process');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

class SimpleTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Running comprehensive test suite for Buy Me a Coffee MVP\n');

    // Test categories to run
    const testSuites = [
      {
        name: 'Unit Tests - Contract Hooks',
        pattern: 'src/lib/__tests__/**/*.test.ts',
        timeout: 30000
      },
      {
        name: 'Unit Tests - Components',
        pattern: 'src/test/BuyCoffeeForm.test.tsx src/test/CoffeeList.test.tsx',
        timeout: 45000
      },
      {
        name: 'Security Tests',
        pattern: 'src/test/security.test.tsx',
        timeout: 20000
      },
      {
        name: 'Performance Tests',
        pattern: 'src/test/performance*.test.tsx',
        timeout: 30000
      }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    this.generateReport();
  }

  async runTestSuite(suite) {
    console.log(`\n📋 Running ${suite.name}...`);
    
    try {
      const startTime = Date.now();
      
      // Run vitest with specific pattern
      const command = `npx vitest run --reporter=verbose --timeout=${suite.timeout} ${suite.pattern}`;
      
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: suite.timeout + 10000 // Add buffer to command timeout
      });
      
      const duration = Date.now() - startTime;
      
      // Parse output for results
      const result = this.parseTestOutput(output, suite.name, duration);
      this.results.push(result);
      
      console.log(`✅ ${suite.name}: ${result.passed}/${result.total} tests passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      console.log(`❌ ${suite.name}: Tests failed or timed out`);
      
      // Try to parse partial results from error output
      const errorOutput = error.stdout || error.message || '';
      const result = this.parseTestOutput(errorOutput, suite.name, duration, true);
      this.results.push(result);
      
      if (error.stdout) {
        console.log('Error details:', error.stdout.slice(-500)); // Show last 500 chars
      }
    }
  }

  parseTestOutput(output, suiteName, duration, isError = false) {
    // Try to extract test counts from vitest output
    let passed = 0;
    let failed = 0;
    let total = 0;

    // Look for patterns like "✓ 5 passed" or "✗ 2 failed"
    const passedMatch = output.match(/✓\s*(\d+)\s*passed/i) || output.match(/(\d+)\s*passed/i);
    const failedMatch = output.match(/✗\s*(\d+)\s*failed/i) || output.match(/(\d+)\s*failed/i);
    const totalMatch = output.match(/Tests\s+(\d+)\s*failed\s*\|\s*(\d+)\s*passed/i);

    if (totalMatch) {
      failed = parseInt(totalMatch[1]) || 0;
      passed = parseInt(totalMatch[2]) || 0;
      total = passed + failed;
    } else {
      passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      total = passed + failed;
    }

    // If we couldn't parse anything and it's an error, assume 1 failed test
    if (total === 0 && isError) {
      failed = 1;
      total = 1;
    }

    return {
      suite: suiteName,
      passed,
      failed,
      total,
      duration,
      success: failed === 0 && total > 0
    };
  }

  generateReport() {
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = Date.now() - this.startTime;
    const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    // Create reports directory
    const reportsDir = join(process.cwd(), 'test-reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      passRate,
      suites: this.results
    };

    const jsonPath = join(reportsDir, `test-report-${Date.now()}.json`);
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate simple HTML report
    const htmlPath = join(reportsDir, `test-report-${Date.now()}.html`);
    writeFileSync(htmlPath, this.generateHtmlReport(report));

    // Print summary
    this.printSummary(report);

    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);

    return report;
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buy Me a Coffee MVP - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; }
        .metric .value { font-size: 1.5em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { background: #f8f9fa; margin-bottom: 10px; padding: 15px; border-radius: 8px; }
        .suite h4 { margin: 0 0 10px 0; }
        .suite-stats { display: flex; gap: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Buy Me a Coffee MVP - Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${report.totalPassed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${report.totalFailed}</div>
            </div>
            <div class="metric">
                <h3>Pass Rate</h3>
                <div class="value ${report.passRate >= 80 ? 'passed' : 'failed'}">${report.passRate}%</div>
            </div>
        </div>

        <h2>Test Suites</h2>
        ${report.suites.map(suite => `
            <div class="suite">
                <h4>${suite.suite}</h4>
                <div class="suite-stats">
                    <div>Tests: ${suite.total}</div>
                    <div class="passed">Passed: ${suite.passed}</div>
                    <div class="failed">Failed: ${suite.failed}</div>
                    <div>Duration: ${suite.duration}ms</div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`📈 Pass Rate: ${report.passRate}%`);
    console.log(`⏱️  Total Duration: ${Math.round(report.totalDuration / 1000)}s`);
    console.log('='.repeat(60));

    if (report.totalFailed === 0 && report.totalTests > 0) {
      console.log('🎉 All tests passed! The Buy Me a Coffee MVP testing is complete.');
    } else if (report.totalTests === 0) {
      console.log('⚠️  No tests were executed. Please check test configuration.');
    } else {
      console.log(`⚠️  ${report.totalFailed} test(s) failed. Review the issues above.`);
    }

    console.log('\n📋 Test Results by Suite:');
    report.suites.forEach(suite => {
      const suitePassRate = suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0;
      const status = suite.success ? '✅' : '❌';
      console.log(`   ${status} ${suite.suite}: ${suitePassRate}% (${suite.passed}/${suite.total})`);
    });
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new SimpleTestRunner();
  runner.runAllTests()
    .then(() => {
      console.log('\n✨ Test execution completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = { SimpleTestRunner };