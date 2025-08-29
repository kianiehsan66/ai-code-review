# Test Generation Instructions

Generate comprehensive unit tests for the provided code.

## Focus Areas

1. **Test Coverage**: Cover all public functions, methods, and edge cases
2. **Test Structure**: Use proper test organization and naming conventions
3. **Assertions**: Include meaningful assertions that validate expected behavior
4. **Edge Cases**: Test boundary conditions, error cases, and invalid inputs
5. **Mocking**: Mock external dependencies appropriately
6. **Best Practices**: Follow testing best practices for the framework

## Requirements

- Write clean, readable test code
- Include setup and teardown where needed
- Test both positive and negative scenarios
- Add descriptive test names and comments
- Ensure tests are independent and repeatable
- Use appropriate assertion methods
- Mock external dependencies properly
- Test error handling and edge cases thoroughly

## Additional Guidelines

- Prioritize testing the most critical functionality
- Use descriptive test names that explain what is being tested
- Group related tests using appropriate test organization patterns
- Include both unit tests and integration tests where applicable
- Ensure tests are fast, reliable, and maintainable

## Framework-Specific Notes

### JavaScript/TypeScript (Jest)

- Use `describe` blocks to group related tests
- Use `beforeEach`/`afterEach` for setup/teardown
- Mock modules using `jest.mock()`
- Use appropriate matchers like `toEqual`, `toBe`, `toThrow`

### Python (pytest)

- Use fixtures for setup/teardown
- Use parametrized tests for multiple test cases
- Mock using `unittest.mock` or `pytest-mock`
- Follow PEP 8 naming conventions

### Java (JUnit)

- Use `@Test`, `@BeforeEach`, `@AfterEach` annotations
- Mock using Mockito or similar frameworks
- Use assertThat for readable assertions
- Group tests in logical test classes

## Custom Instructions

Add your specific requirements or guidelines here:

<!--
Example custom instructions:
- Focus on testing authentication flows
- Ensure all database interactions are mocked
- Include performance tests for critical paths
- Test internationalization scenarios
-->
