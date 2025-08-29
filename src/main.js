import * as core from '@actions/core'
import { wait } from './wait.js'
import { getChangedFiles } from './git-diff.js'
import { reviewChangesWithAI, isAIReviewEnabled } from './ai-reviewer.js'
import { getActionConfig } from './config.js'

/**
 * Print diff summary and trigger AI review
 * @returns {Promise<void>}
 */
async function processBranchChanges() {
  try {
    // Get custom exclusion patterns from input
    const excludedFilesInput = core.getInput('excluded-files')
    const customExclusions = excludedFilesInput
      ? excludedFilesInput
          .split(',')
          .map((pattern) => pattern.trim())
          .filter(Boolean)
      : []

    if (customExclusions.length > 0) {
      core.info(`📋 Custom exclusion patterns: ${customExclusions.join(', ')}`)
    }

    const files = await getChangedFiles(customExclusions)

    if (files.length === 0) {
      core.info('No changes detected between this branch and main.')
      return
    }

    core.info(`📊 Found ${files.length} changed file(s):`)
    files.forEach((file) => {
      core.info(`  - ${file.fileName}`)
    })

    // Perform AI review if enabled
    if (isAIReviewEnabled()) {
      await reviewChangesWithAI(files)
    } else {
      core.info('💡 Add OpenAI API key to enable AI code review.')
    }
  } catch (error) {
    core.setFailed(`Failed to process branch changes: ${error.message}`)
  }
}

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const config = getActionConfig()

    core.info('🚀 Starting AI Code Review Action...')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${config.waitTime} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(config.waitTime)
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    // Process branch changes and perform AI review
    await processBranchChanges()

    core.info('✅ Action completed successfully!')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
