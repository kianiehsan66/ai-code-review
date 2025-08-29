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
