#!/usr/bin/env node

/**
 * Comprehensive test runner for Buy Me a Coffee MVP
 * 
 * This script runs all test suites and generates a comprehensive report
 * covering unit tests, integration tests, and responsive design tests.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  suites: TestResult[];
  coverage: {
    overall: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
    files: Array<{
      file: string;
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    }>;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<TestReport> {
    console.log('🧪 Starting comprehensive test suite for Buy Me a Coffee MVP\n');

    // Run different test categories
    await this.runTestSuite('Unit Tests - Contract Hooks', 'src/lib/__tests__/**/*.test.ts');
    await this.runTestSuite('Unit Tests - Components', 'src/test/**/!(integration|responsive)*.test.tsx');
    await this.runTestSuite('Integration Tests', 'src/test/integration/**/*.test.tsx');
    await this.runTestSuite('Responsive Design Tests', 'src/test/responsive-design.test.tsx');
    await this.runTestSuite('Security Tests', 'src/test/security.test.tsx');
    await this.runTestSuite('Performance Tests', 'src/test/performance*.test.tsx');

    // Generate final report
    const report = this.generateReport();
    this.saveReport(report);
    this.printSummary(report);

    return report;
  }

  private async runTestSuite(suiteName: string, pattern: string): Promise<void> {
    console.log(`\n📋 Running ${suiteName}...`);
    
    try {
      const startTime = Date.now();
      
      // Run vitest with specific pattern
      const command = `npx vitest run --reporter=json --coverage ${pattern}`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const duration = Date.now() - startTime;
      
      // Parse vitest JSON output
      const result = this.parseVitestOutput(output, suiteName, duration);
      this.results.push(result);
      
      console.log(`✅ ${suiteName}: ${result.passed}/${result.total} tests passed (${duration}ms)`);
      
    } catch (error: any) {
      console.log(`❌ ${suiteName}: Failed to run tests`);
      console.error(error.message);
      
      // Add failed result
      this.results.push({
        suite: suiteName,
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0
      });
    }
  }

  private parseVitestOutput(output: string, suiteName: string, duration: number): TestResult {
    try {
      // Parse JSON output from vitest
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        
        return {
          suite: suiteName,
          passed: result.numPassedTests || 0,
          failed: result.numFailedTests || 0,
          total: result.numTotalTests || 0,
          duration,
          coverage: result.coverage ? {
            lines: result.coverage.lines?.pct || 0,
            functions: result.coverage.functions?.pct || 0,
            branches: result.coverage.branches?.pct || 0,
            statements: result.coverage.statements?.pct || 0,
          } : undefined
        };
      }
    } catch (error) {
      console.warn(`Failed to parse test output for ${suiteName}`);
    }

    // Fallback parsing
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/(\d+) total/);

    return {
      suite: suiteName,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      duration
    };
  }

  private generateReport(): TestReport {
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = Date.now() - this.startTime;

    // Calculate overall coverage
    const coverageResults = this.results.filter(r => r.coverage);
    const overallCoverage = coverageResults.length > 0 ? {
      lines: Math.round(coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / coverageResults.length),
      functions: Math.round(coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / coverageResults.length),
      branches: Math.round(coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / coverageResults.length),
      statements: Math.round(coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / coverageResults.length),
    } : {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    };

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      suites: this.results,
      coverage: {
        overall: overallCoverage,
        files: [] // Would be populated from detailed coverage report
      }
    };
  }

  private saveReport(report: TestReport): void {
    const reportsDir = join(process.cwd(), 'test-reports');
    
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = join(reportsDir, `test-report-${Date.now()}.json`);
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save HTML report
    const htmlPath = join(reportsDir, `test-report-${Date.now()}.html`);
    writeFileSync(htmlPath, this.generateHtmlReport(report));

    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  private generateHtmlReport(report: TestReport): string {
    const passRate = Math.round((report.totalPassed / report.totalTests) * 100);
    const coverageColor = (pct: number) => pct >= 80 ? 'green' : pct >= 60 ? 'orange' : 'red';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buy Me a Coffee MVP - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .coverage { color: #17a2b8; }
        .duration { color: #6c757d; }
        .suites { margin-top: 30px; }
        .suite { background: #f8f9fa; margin-bottom: 15px; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .suite h4 { margin: 0 0 10px 0; }
        .suite-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .suite-stat { font-size: 0.9em; }
        .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); transition: width 0.3s; }
        .timestamp { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Buy Me a Coffee MVP - Test Report</h1>
            <p>Comprehensive testing results for all components and functionality</p>
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
                <div class="value ${passRate >= 90 ? 'passed' : passRate >= 70 ? 'coverage' : 'failed'}">${passRate}%</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value duration">${Math.round(report.totalDuration / 1000)}s</div>
            </div>
            <div class="metric">
                <h3>Coverage</h3>
                <div class="value coverage">${report.coverage.overall.lines}%</div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suites</h2>
            ${report.suites.map(suite => `
                <div class="suite">
                    <h4>${suite.suite}</h4>
                    <div class="suite-stats">
                        <div class="suite-stat">
                            <strong>Tests:</strong> ${suite.total}
                        </div>
                        <div class="suite-stat">
                            <strong>Passed:</strong> <span class="passed">${suite.passed}</span>
                        </div>
                        <div class="suite-stat">
                            <strong>Failed:</strong> <span class="failed">${suite.failed}</span>
                        </div>
                        <div class="suite-stat">
                            <strong>Duration:</strong> ${suite.duration}ms
                        </div>
                        ${suite.coverage ? `
                        <div class="suite-stat">
                            <strong>Coverage:</strong> ${suite.coverage.lines}%
                        </div>
                        ` : ''}
                    </div>
                    ${suite.coverage ? `
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${suite.coverage.lines}%; background-color: ${coverageColor(suite.coverage.lines)};"></div>
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="timestamp">
            Generated on ${new Date(report.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;
  }

  private printSummary(report: TestReport): void {
    const passRate = Math.round((report.totalPassed / report.totalTests) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log(`⏱️  Total Duration: ${Math.round(report.totalDuration / 1000)}s`);
    console.log(`🎯 Coverage: ${report.coverage.overall.lines}%`);
    console.log('='.repeat(60));

    if (report.totalFailed === 0) {
      console.log('🎉 All tests passed! The Buy Me a Coffee MVP is ready for deployment.');
    } else {
      console.log(`⚠️  ${report.totalFailed} test(s) failed. Please review and fix before deployment.`);
    }

    console.log('\n📋 Test Coverage by Category:');
    report.suites.forEach(suite => {
      const suitePassRate = Math.round((suite.passed / suite.total) * 100);
      const status = suite.failed === 0 ? '✅' : '❌';
      console.log(`   ${status} ${suite.suite}: ${suitePassRate}% (${suite.passed}/${suite.total})`);
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export { TestRunner, type TestReport, type TestResult };