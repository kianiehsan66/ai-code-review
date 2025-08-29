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
    const files = await getChangedFiles()

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
  }
}

/**
 * Send file to OpenAI for review
 * @param {string} fileName - Name of the file
 * @param {string} fileDiff - Git diff content for the file
 * @param {string} instructions - Review instructions
 * @param {OpenAI} openai - OpenAI client
 * @returns {Promise<string>} Review result
 */
async function reviewFileWithAI(fileName, fileDiff, instructions, openai) {
  try {
    const prompt = `${instructions}

File: ${fileName}

Git Diff:
\`\`\`diff
${fileDiff}
\`\`\`

Please provide a detailed code review for this file.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert code reviewer. Provide thorough, constructive feedback on code changes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    })

    return response.choices[0].message.content
  } catch (error) {
    core.error(`Failed to review ${fileName}: ${error.message}`)
    return `Failed to review ${fileName}: ${error.message}`
  }
}

/**
 * Review all changed files with OpenAI
 * @param {string} diffOutput - Git diff output
 * @returns {Promise<void>}
 */
async function reviewChangesWithAI(diffOutput) {
  const apiKey = core.getInput('openai-api-key') || process.env.OPENAI_API_KEY

  if (!apiKey) {
    core.warning('OpenAI API key not provided. Skipping AI code review.')
    return
  }

  const openai = new OpenAI({ apiKey })
  const instructions = loadReviewInstructions()
  const files = parseGitDiff(diffOutput)

  if (files.length === 0) {
    core.info('No files to review.')
    return
  }

  core.info(`Starting AI code review for ${files.length} file(s)...`)

  for (const file of files) {
    core.info(`\n📝 Reviewing: ${file.fileName}`)
    core.info('=' * 50)

    const review = await reviewFileWithAI(
      file.fileName,
      file.diff,
      instructions,
      openai
    )

    core.info(`\n🤖 AI Review for ${file.fileName}:`)
    core.info(review)
    core.info('\n' + '=' * 50)

    // Small delay to avoid rate limiting
    await wait(1000)
  }
}

/**
 * Print the diff between current branch and main branch
 * @returns {Promise<void>}
 */
async function printBranchDiff() {
  try {
    let output = ''
    const options = {}
    options.listeners = {
      stdout: (data) => {
        output += data.toString()
      },
      stderr: (data) => {
        output += data.toString()
      }
    }

    core.info('Fetching latest main branch...')
    await exec.exec('git', ['fetch', 'origin', 'main'], options)

    core.info('Getting diff between current branch and main...')
    output = '' // Reset output for diff command
    await exec.exec('git', ['diff', 'origin/main...HEAD'], options)

    if (output.trim().length === 0) {
      core.info('No changes between this branch and main.')
    } else {
      core.info('Changes against main branch:')
      core.info(output)

      // Trigger AI code review
      await reviewChangesWithAI(output)
    }
  } catch (error) {
    core.setFailed(`Failed to print branch diff: ${error.message}`)
  }
}

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const ms = core.getInput('milliseconds')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    // Print the branch diff
    await printBranchDiff()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
