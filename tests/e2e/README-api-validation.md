# API Call Validation Test Suite

## Overview

Comprehensive E2E test suite designed to validate the transparency and correctness of API calls in Curlino, ensuring that URL, headers, and body parameters are transmitted exactly as configured by users in both Builder and Importer modes.

## Test Coverage

### Core Functionality Tests (5 scenarios)
1. **Builder Mode - GET Request**: Basic GET with query parameters and headers
2. **Builder Mode - POST Request**: POST with JSON body and custom headers
3. **Importer Mode - cURL GET**: Import and execute cURL GET command
4. **Importer Mode - cURL POST**: Import and execute cURL POST with JSON
5. **Advanced Builder - PUT Form Data**: PUT with form-encoded data

### Edge Case Tests (11 scenarios)
6. **Special Characters in URL**: URLs with spaces, Unicode, and encoded characters
7. **Special Characters in Headers**: Headers with special characters and Unicode
8. **Empty/Missing Parameters**: Handling of empty values and missing parameters
9. **Complex Query Strings**: Multiple parameters with encoding and special chars
10. **JSON with Special Characters**: Bodies with Unicode, escapes, and special chars
11. **Malformed cURL Commands**: Invalid cURL syntax and error handling
12. **Large Payload Testing**: Testing limits with large request bodies
13. **Long URL Testing**: URLs approaching practical length limits
14. **HTTP Methods Edge Cases**: Unusual method/body combinations
15. **Boundary Value Testing**: Edge cases for parameter limits
16. **Extremely Complex cURL**: Real-world complex cURL commands

## Test Results

### ✅ Passing Tests (11/16)
These tests validate correct functionality:

1. **Builder Mode - GET Request** - ✅ PASS
   - Correctly handles query parameters and headers
   - Proper URL encoding

2. **Builder Mode - POST Request** - ✅ PASS
   - JSON body transmitted correctly
   - Custom headers preserved

3. **Importer Mode - cURL GET** - ✅ PASS
   - cURL parsing works correctly for simple GET

4. **Importer Mode - cURL POST** - ✅ PASS
   - JSON data from cURL imported and sent correctly

5. **Special Characters in Headers** - ✅ PASS
   - Unicode and special characters in headers handled correctly

6. **Empty/Missing Parameters** - ✅ PASS
   - Empty values handled appropriately

7. **JSON with Special Characters** - ✅ PASS
   - Unicode and escaped characters in JSON body preserved

8. **Large Payload Testing** - ✅ PASS
   - Large JSON payloads transmitted without truncation

9. **Long URL Testing** - ✅ PASS
   - Long URLs with many parameters handled correctly

10. **Boundary Value Testing** - ✅ PASS
    - Edge cases for parameter values work correctly

11. **Extremely Complex cURL** - ✅ PASS
    - Complex real-world cURL commands parsed and executed correctly

### ❌ Failing Tests (5/16)
These tests identify bugs in the application:

#### Bug #1: Query Parameter Duplication
**Test**: Advanced Builder - PUT Form Data
**Issue**: Query parameters are systematically duplicated in the final URL
**Expected**: `https://httpbin.org/put?param1=value1`
**Actual**: `https://httpbin.org/put?param1=value1&param1=value1`
**Impact**: All requests with query parameters send duplicate data

#### Bug #2: Special Character URL Encoding
**Test**: Special Characters in URL
**Issue**: Special characters in URLs are not properly encoded or handled
**Expected**: Proper URL encoding of spaces, Unicode, and special characters
**Actual**: Malformed URLs or incorrect encoding
**Impact**: Requests with special characters in URLs may fail

#### Bug #3: Complex Query String Handling
**Test**: Complex Query Strings
**Issue**: Complex query parameter scenarios with multiple encoding types fail
**Expected**: Proper handling of mixed encoding and special characters in params
**Actual**: Incorrect parameter parsing or encoding
**Impact**: Complex query strings may be corrupted

#### Bug #4: Malformed cURL Error Handling
**Test**: Malformed cURL Commands
**Issue**: Invalid cURL commands are not properly validated or handled
**Expected**: Clear error handling and user feedback for invalid cURL
**Actual**: Silent failures or unexpected behavior
**Impact**: Poor user experience when importing invalid cURL commands

#### Bug #5: HTTP Method/Content-Type Mismatch
**Test**: HTTP Methods Edge Cases
**Issue**: Unusual combinations of HTTP methods with content types not handled correctly
**Expected**: Proper validation or handling of method/content-type combinations
**Actual**: Incorrect request formatting or validation errors
**Impact**: Some legitimate but uncommon HTTP patterns may fail

## QA Engineer Recommendations

### Critical Issues
- **Query Parameter Duplication** should be fixed immediately as it affects all parameterized requests
- **Special Character URL Encoding** impacts international users and complex APIs

### Medium Priority
- **Complex Query String Handling** affects advanced use cases
- **cURL Error Handling** impacts user experience

### Low Priority
- **HTTP Method Edge Cases** affects uncommon but valid HTTP patterns

## Test Strategy

### Network Interception
Tests use Playwright's `page.route()` to intercept actual HTTP requests, ensuring validation of the exact data transmitted rather than just UI state.

### Transparency Validation
Each test verifies:
- URL matches user input exactly
- Headers are transmitted as configured
- Body content is identical to user specification
- Query parameters are encoded correctly

### Error Tolerance
Following user requirements, tests intentionally fail when bugs are detected rather than accommodating broken functionality. This ensures clear visibility into application issues.

## Technical Implementation

### Key Testing Patterns
```javascript
// Network interception pattern
await page.route('**/*', async (route, request) => {
  if (request.url().includes('httpbin.org')) {
    interceptedRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  }
  route.continue();
});

// Selector patterns for UI interaction
const headerInput = page.locator('input[placeholder="Header name"]');
const paramInput = page.locator('input[placeholder="Parameter name"]');
```

### Test Data Sources
- **httpbin.org**: Reliable endpoint for HTTP testing
- **Unicode test strings**: Real-world international character sets
- **Edge case payloads**: Boundary values and limit testing
- **Real cURL commands**: Actual commands from production environments

## Next Steps

1. **Bug Fixes**: Address the 5 identified bugs in priority order
2. **Regression Testing**: Re-run full suite after each fix
3. **Continuous Integration**: Integrate tests into CI pipeline
4. **Test Expansion**: Add additional edge cases as needed

This comprehensive test suite ensures Curlino maintains transparency and correctness for QA engineer workflows, with clear identification of areas requiring fixes.