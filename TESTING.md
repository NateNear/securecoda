# Unit Testing Guide

## Overview

SecureCoda includes comprehensive unit and integration tests using Jest and Supertest. This guide explains the test structure and how to run them.

## Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── alertStore.test.js
│   │   ├── detectionService.test.js
│   │   ├── logger.test.js
│   │   └── remediationService.test.js
│   └── integration/
│       └── api.test.js
└── [source files]
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Only Unit Tests
```bash
npm run test:unit
```

### Run Only Integration Tests
```bash
npm run test:integration
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

## Test Files Overview

### 1. Alert Store Tests (`alertStore.test.js`)

Tests the in-memory alert storage service.

**Key Test Cases:**
- ✓ Initialize with empty alerts array
- ✓ Add single alert
- ✓ Add multiple alerts sequentially
- ✓ Clear all alerts
- ✓ Maintain alert order
- ✓ Handle empty array input

**Example:**
```javascript
test('should add alerts to store', () => {
  const testAlerts = [
    {
      docId: 'doc1',
      type: 'PUBLIC_DOCUMENT',
      severity: 9,
      message: 'Document is public'
    }
  ];

  alertStore.add(testAlerts);
  expect(alertStore.list()).toHaveLength(1);
  expect(alertStore.list()[0].type).toBe('PUBLIC_DOCUMENT');
});
```

### 2. Detection Service Tests (`detectionService.test.js`)

Tests the security detection logic.

**Test Suites:**
- **Unused Documents:** Detects documents not modified recently
- **Public Documents:** Detects publicly shared documents
- **External Sharing:** Detects sharing with external domains
- **Sensitive Rows:** Detects sensitive data patterns (password, token, SSN, etc.)
- **Sensitive HTML:** Detects sensitive content in exported pages
- **Edge Cases:** Handles malformed data and edge scenarios

**Example:**
```javascript
test('should detect unused document after threshold', () => {
  const now = Date.now();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

  const docs = [
    {
      id: 'doc1',
      name: 'Old Report',
      updatedAt: twoHoursAgo,
      createdAt: '2023-01-01T00:00:00Z'
    }
  ];

  const alerts = detectionService.analyze(docs, {});
  const unusedAlert = alerts.find(a => a.type === 'UNUSED_DOCUMENT');

  expect(unusedAlert).toBeDefined();
  expect(unusedAlert.severity).toBe(5);
});
```

### 3. Logger Tests (`logger.test.js`)

Tests the logging utility.

**Test Cases:**
- ✓ Log info messages with prefix
- ✓ Log warning messages
- ✓ Log error messages
- ✓ Handle multiple arguments
- ✓ Handle error objects

**Example:**
```javascript
test('should log info messages', () => {
  logger.info('Test message');

  expect(consoleLogSpy).toHaveBeenCalled();
  expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'Test message');
});
```

### 4. Remediation Service Tests (`remediationService.test.js`)

Tests the remediation/fix functionality with mocked Coda client.

**Test Suites:**
- **fixSharing:** Tests public access removal
- **deleteDocument:** Tests document deletion
- **Error Handling:** Tests error propagation
- **Concurrency:** Tests parallel operations

**Example:**
```javascript
test('should call removePublicAccess on codaClient', async () => {
  codaClient.removePublicAccess.mockResolvedValue({ success: true });

  const result = await fixSharing('doc1');

  expect(codaClient.removePublicAccess).toHaveBeenCalledWith('doc1');
  expect(result.message).toBe('Public sharing removed');
});
```

### 5. API Integration Tests (`api.test.js`)

Tests the Express API endpoints.

**Test Suites:**
- **GET /api/alerts:** Tests alert retrieval
- **POST /api/rescan:** Tests scan triggering
- **POST /api/remediate/:docId:** Tests remediation endpoint
- **Error Handling:** Tests invalid routes
- **Response Format:** Tests JSON responses

**Example:**
```javascript
test('should return alerts when present', async () => {
  const testAlert = {
    docId: 'doc1',
    type: 'PUBLIC_DOCUMENT',
    severity: 9,
    message: 'Document is public'
  };

  alertStore.add([testAlert]);

  const response = await request(app)
    .get('/api/alerts')
    .expect(200);

  expect(response.body).toHaveLength(1);
  expect(response.body[0].type).toBe('PUBLIC_DOCUMENT');
});
```

## Test Coverage

Current coverage targets:
- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >80%
- **Lines:** >80%

View coverage report:
```bash
npm test -- --coverage
```

This generates a `coverage/` directory with detailed HTML reports.

## Writing New Tests

### Unit Test Template

```javascript
const moduleToTest = require('../../../src/path/to/module');

describe('Module Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  test('should do something specific', () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = moduleToTest.method(input);

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const app = require('../../../src/app');

describe('API Endpoint', () => {
  test('should handle GET request', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('key');
  });
});
```

## Mocking

### Mocking External Services

```javascript
jest.mock('../../../src/config/codaClient');

describe('Service Using Coda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call mocked service', async () => {
    codaClient.someMethod.mockResolvedValue({ success: true });

    const result = await myService();

    expect(codaClient.someMethod).toHaveBeenCalled();
  });
});
```

### Spying on Built-ins

```javascript
beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});

test('should log message', () => {
  logger.info('Test');
  expect(consoleLogSpy).toHaveBeenCalled();
});
```

## Best Practices

1. **Keep Tests Focused:** One assertion per test when possible
2. **Use Descriptive Names:** Test names should explain what is being tested
3. **Follow AAA Pattern:** Arrange → Act → Assert
4. **Mock External Dependencies:** Don't make real API calls
5. **Clean Up:** Use `beforeEach`/`afterEach` to reset state
6. **Test Edge Cases:** Empty inputs, null values, errors
7. **Test Error Paths:** Don't just test happy paths
8. **Avoid Test Interdependence:** Tests should run independently

## Common Test Patterns

### Testing Async Functions

```javascript
test('should handle async operation', async () => {
  codaClient.someAsync.mockResolvedValue({ data: 'result' });

  const result = await serviceFunction();

  expect(result).toBeDefined();
});
```

### Testing Error Cases

```javascript
test('should handle errors', async () => {
  codaClient.method.mockRejectedValue(new Error('API Error'));

  await expect(serviceFunction()).rejects.toThrow('API Error');
});
```

### Testing Data Transformation

```javascript
test('should transform data correctly', () => {
  const input = { old: 'format' };
  const output = transformData(input);

  expect(output).toEqual({ new: 'format' });
});
```

## Debugging Tests

### Run Single Test File
```bash
npx jest src/__tests__/unit/alertStore.test.js
```

### Run Specific Test Suite
```bash
npx jest -t "Alert Store"
```

### Run with Debug Output
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests are run automatically on CI/CD pipelines. Ensure:
1. All tests pass locally before pushing
2. Coverage thresholds are met
3. No console errors or warnings

## Test Maintenance

- **Update tests when code changes:** Keep tests in sync with implementation
- **Remove obsolete tests:** Delete tests for removed features
- **Refactor tests:** Keep test code clean and maintainable
- **Review coverage regularly:** Identify untested code paths

## Troubleshooting

### Tests Timing Out
- Increase timeout: `jest.setTimeout(10000)`
- Check for infinite loops or missing async/await

### Mock Not Working
- Ensure mock path matches require path exactly
- Call `jest.clearAllMocks()` in beforeEach

### Flaky Tests
- Avoid hardcoding timestamps
- Mock random values
- Don't rely on execution order

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/testjavascript/nodejs-testing-best-practices)
