# 🧪 AI Test Generation Feature

## Overview

The AI Code Review Action now includes an intelligent test generation feature
that automatically creates unit tests for your changed files using OpenAI's GPT
models.

## How It Works

1. **File Analysis**: Analyzes all changed files in your PR
2. **Smart Filtering**: Excludes test files, config files, and other
   non-testable files
3. **AI Generation**: Uses OpenAI to generate comprehensive unit tests
4. **Test Framework Detection**: Automatically detects the appropriate testing
   framework based on file extensions
5. **File Creation**: Creates test files in the correct location with proper
   naming conventions

## Supported Languages & Frameworks

| Language   | File Extension | Test Framework | Test File Pattern   |
| ---------- | -------------- | -------------- | ------------------- |
| JavaScript | `.js`          | Jest           | `filename.test.js`  |
| TypeScript | `.ts`          | Jest           | `filename.test.ts`  |
| React JSX  | `.jsx`         | Jest           | `filename.test.jsx` |
| React TSX  | `.tsx`         | Jest           | `filename.test.tsx` |
| Python     | `.py`          | pytest         | `test_filename.py`  |
| Java       | `.java`        | JUnit          | `filenameTest.java` |

## Configuration

### Enable Test Generation

Add the `generate-tests` input to your workflow:

```yaml
- name: AI Code Review
  uses: your-username/ai-code-review@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    generate-tests: 'true' # Enable test generation
```

### Custom Test Instructions

Create a `test-instructions.md` file in your repository root to provide custom
instructions for test generation:

```markdown
# Test Generation Instructions

## Custom Requirements

- Focus on testing authentication flows
- Ensure all database interactions are mocked
- Include edge cases for user input validation

## Specific Guidelines

- Use descriptive test names
- Group related tests using describe blocks
- Mock external API calls
```

The action will use these custom instructions instead of the default ones when
generating tests.

### Full Configuration Example

```yaml
name: AI Code Review with Test Generation

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: write # Required to create test files
  pull-requests: write
  issues: write

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: AI Code Review & Test Generation
        uses: your-username/ai-code-review@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          generate-tests: 'true'
          post-comment: 'true'
          excluded-files: '*.test.js,*.spec.js,package-lock.json'

      - name: Commit generated tests
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          if git diff --staged --quiet; then
            echo "No test files to commit"
          else
            git commit -m "🧪 Add AI-generated unit tests"
            git push
          fi
```

## What Gets Generated

For each changed file, the AI will generate:

### Jest Tests (JavaScript/TypeScript)

```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup code
  })

  test('should handle normal input correctly', () => {
    // Test implementation
    expect(result).toBe(expected)
  })

  test('should handle edge cases', () => {
    // Edge case testing
    expect(() => invalidInput()).toThrow()
  })

  test('should mock external dependencies', () => {
    // Mocking tests
    expect(mockFunction).toHaveBeenCalledWith(expectedArgs)
  })
})
```

### pytest Tests (Python)

```python
import pytest
from module import function_to_test

class TestFunctionName:
    def setup_method(self):
        # Setup code
        pass

    def test_normal_case(self):
        # Test implementation
        result = function_to_test(input_data)
        assert result == expected_output

    def test_edge_cases(self):
        # Edge case testing
        with pytest.raises(ValueError):
            function_to_test(invalid_input)

    @pytest.mark.parametrize("input,expected", [
        (1, 2),
        (2, 4),
        (3, 6)
    ])
    def test_multiple_inputs(self, input, expected):
        assert function_to_test(input) == expected
```

## File Filtering

The action automatically excludes these file types from test generation:

- Existing test files (`*.test.*`, `*.spec.*`, `__tests__/*`)
- Configuration files (`*.config.*`, `*.json`, `*.yml`, `*.yaml`)
- Documentation files (`*.md`)
- Minified files (`*.min.*`)
- Generated files

## Features

### 🎯 **Intelligent Test Coverage**

- Analyzes function exports and imports
- Generates tests for all public methods
- Includes edge case testing
- Tests error conditions and boundary cases

### 🔧 **Framework-Aware Generation**

- Uses correct assertion libraries for each framework
- Follows framework-specific conventions
- Includes proper setup/teardown patterns
- Implements mocking where appropriate

### 📁 **Smart File Placement**

- Places test files in conventional locations
- Creates directories if they don't exist
- Uses proper naming conventions
- Maintains project structure

### 🚀 **CI/CD Integration**

- Works seamlessly with GitHub Actions
- Can auto-commit generated tests
- Integrates with existing test runners
- Provides detailed logging

## Best Practices

1. **Review Generated Tests**: Always review AI-generated tests before merging
2. **Customize Instructions**: Add project-specific testing guidelines to
   `review-instructions.md`
3. **Version Control**: Commit generated tests to track changes over time
4. **Integration**: Run generated tests in your CI pipeline
5. **Iteration**: Use the generated tests as a starting point and refine as
   needed

## Example Output

When the action runs, you'll see:

```
🧪 Starting test generation for 3 file(s)...

🔬 Generating tests for: src/utils/calculator.js
✅ Generated test file: src/utils/calculator.test.js

🔬 Generating tests for: src/components/Button.jsx
✅ Generated test file: src/components/Button.test.jsx

🔬 Generating tests for: src/api/client.ts
✅ Generated test file: src/api/client.test.ts

✅ Test generation completed! Generated 3 test file(s).
```

## Troubleshooting

### Common Issues

1. **No tests generated**: Check that `generate-tests: 'true'` is set
2. **Permission errors**: Ensure `contents: write` permission is granted
3. **File not found**: Verify the file paths are correct and files exist
4. **API rate limits**: The action includes built-in rate limiting delays

### Configuration Tips

- Set `max-tokens` to a higher value (e.g., 3000) for more comprehensive tests
- Use `temperature: 0.1` for consistent, deterministic test generation
- Exclude large generated files to avoid unnecessary API costs

## Cost Considerations

Test generation uses approximately 2x the tokens of code review since it
generates more content. Monitor your OpenAI usage and consider:

- Using selective file filtering
- Adjusting `max-tokens` based on your needs
- Running test generation only on important files
- Using the feature strategically for complex components
