import * as core from '@actions/core'
import OpenAI from 'openai'
import { wait } from './wait.js'
import { loadReviewInstructions, getOpenAIConfig } from './config.js'

/**
 * Create OpenAI client instance
 * @param {Object} config - OpenAI configuration
 * @returns {OpenAI} OpenAI client instance
 */
function createOpenAIClient(config) {
  return new OpenAI({ apiKey: config.apiKey })
}

/**
 * Create prompt for AI code review
 * @param {string} fileName - Name of the file being reviewed
 * @param {string} fileDiff - Git diff content for the file
 * @param {string} instructions - Review instructions
 * @returns {string} Formatted prompt for AI
 */
function createReviewPrompt(fileName, fileDiff, instructions) {
  return `${instructions}

File: ${fileName}

Git Diff:
\`\`\`diff
${fileDiff}
\`\`\`

Please provide a detailed code review for this file.`
}

/**
 * Send file to OpenAI for review
 * @param {string} fileName - Name of the file
 * @param {string} fileDiff - Git diff content for the file
 * @param {string} instructions - Review instructions
 * @param {OpenAI} openai - OpenAI client
 * @param {Object} config - OpenAI configuration
 * @returns {Promise<string>} Review result
 */
async function reviewFileWithAI(
  fileName,
  fileDiff,
  instructions,
  openai,
  config
) {
  try {
    const prompt = createReviewPrompt(fileName, fileDiff, instructions)

    core.debug(`Sending review request for ${fileName} to OpenAI`)

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert code reviewer. Provide thorough, constructive feedback on code changes. Focus on code quality, security, performance, and best practices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    })

    return response.choices[0].message.content
  } catch (error) {
    const errorMessage = `Failed to review ${fileName}: ${error.message}`
    core.error(errorMessage)
    return errorMessage
  }
}

/**
 * Format and display review result
 * @param {string} fileName - Name of the reviewed file
 * @param {string} review - Review content from AI
 */
function displayReview(fileName, review) {
  const separator = '='.repeat(60)

  core.info(`\n📝 AI Review for: ${fileName}`)
  core.info(separator)
  core.info(review)
  core.info(separator)
}

/**
 * Review all changed files with OpenAI
 * @param {Array} files - Array of file objects with fileName and diff
 * @returns {Promise<Array>} Array of review results
 */
export async function reviewChangesWithAI(files) {
  const config = getOpenAIConfig()

  if (!config) {
    core.warning('OpenAI API key not provided. Skipping AI code review.')
    return []
  }

  if (files.length === 0) {
    core.info('No files to review.')
    return []
  }

  const openai = createOpenAIClient(config)
  const instructions = loadReviewInstructions()
  const reviewResults = []

  core.info(`🚀 Starting AI code review for ${files.length} file(s)...`)

  for (const file of files) {
    core.info(`\n🔍 Reviewing: ${file.fileName}`)

    const review = await reviewFileWithAI(
      file.fileName,
      file.diff,
      instructions,
      openai,
      config
    )

    // Store review result
    reviewResults.push({
      fileName: file.fileName,
      content: review
    })

    displayReview(file.fileName, review)

    // Small delay to avoid rate limiting
    if (files.indexOf(file) < files.length - 1) {
      core.debug('Waiting to avoid rate limiting...')
      await wait(1000)
    }
  }

  core.info('\n✅ AI code review completed!')
  return reviewResults
}

/**
 * Check if AI review is enabled and configured
 * @returns {boolean} True if AI review can be performed
 */
export function isAIReviewEnabled() {
  const config = getOpenAIConfig()
  return config !== null
}
