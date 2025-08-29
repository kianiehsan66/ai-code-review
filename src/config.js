import { readFileSync } from 'fs'
import { join } from 'path'
import * as core from '@actions/core'

/**
 * Load review instructions from file
 * @returns {string} Review instructions content
 */
export function loadReviewInstructions() {
  try {
    const instructionsPath = join(process.cwd(), 'review-instructions.md')
    const instructions = readFileSync(instructionsPath, 'utf8')
    core.debug('Successfully loaded review instructions from file')
    return instructions
  } catch (error) {
    core.warning(`Could not load review instructions: ${error.message}`)
    return getDefaultInstructions()
  }
}

/**
 * Load test generation instructions from file
 * @returns {string} Test generation instructions content
 */
export function loadTestInstructions() {
  try {
    const instructionsPath = join(process.cwd(), 'test-instructions.md')
    const instructions = readFileSync(instructionsPath, 'utf8')
    core.debug('Successfully loaded test generation instructions from file')
    return instructions
  } catch (error) {
    core.warning(
      `Could not load test generation instructions: ${error.message}`
    )
    return getDefaultTestInstructions()
  }
}

/**
 * Get default review instructions if file is not found
 * @returns {string} Default review instructions
 */
function getDefaultInstructions() {
  return `Please review this code for:
- Code quality and maintainability
- Security considerations
- Performance implications
- Best practices adherence
- Potential bugs or issues

Provide constructive feedback and suggestions for improvement.`
}

/**
 * Get default test generation instructions if file is not found
 * @returns {string} Default test generation instructions
 */
function getDefaultTestInstructions() {
  return `Generate comprehensive unit tests for the provided code.

Focus on:
1. **Test Coverage**: Cover all public functions, methods, and edge cases
2. **Test Structure**: Use proper test organization and naming conventions
3. **Assertions**: Include meaningful assertions that validate expected behavior
4. **Edge Cases**: Test boundary conditions, error cases, and invalid inputs
5. **Mocking**: Mock external dependencies appropriately
6. **Best Practices**: Follow testing best practices for the framework

Requirements:
- Write clean, readable test code
- Include setup and teardown where needed
- Test both positive and negative scenarios
- Add descriptive test names and comments
- Ensure tests are independent and repeatable
- Use appropriate assertion methods
- Mock external dependencies properly
- Test error handling and edge cases thoroughly

Additional Guidelines:
- Prioritize testing the most critical functionality
- Use descriptive test names that explain what is being tested
- Group related tests using appropriate test organization patterns
- Include both unit tests and integration tests where applicable
- Ensure tests are fast, reliable, and maintainable`
}

/**
 * Get OpenAI API configuration
 * @returns {Object} Configuration object with API key and model settings
 */
export function getOpenAIConfig() {
  const apiKey = core.getInput('openai-api-key') || process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    model: core.getInput('openai-model') || 'gpt-4',
    maxTokens: parseInt(core.getInput('max-tokens') || '1500'),
    temperature: parseFloat(core.getInput('temperature') || '0.3')
  }
}

/**
 * Get action configuration from inputs
 * @returns {Object} Action configuration
 */
export function getActionConfig() {
  return {
    waitTime: parseInt(core.getInput('milliseconds') || '1000'),
    rateLimitDelay: parseInt(core.getInput('rate-limit-delay') || '1000'),
    enableDebug: core.getInput('enable-debug') === 'true' || false
  }
}
