import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Execute git command and capture output
 * @param {string[]} args - Git command arguments
 * @returns {Promise<string>} Command output
 */
async function execGitCommand(args) {
  let output = ''
  const options = {
    listeners: {
      stdout: (data) => {
        output += data.toString()
      },
      stderr: (data) => {
        output += data.toString()
      }
    }
  }

  await exec.exec('git', args, options)
  return output
}

/**
 * Fetch the latest main branch from origin
 * @returns {Promise<void>}
 */
export async function fetchMainBranch() {
  core.info('Fetching latest main branch...')
  await execGitCommand(['fetch', 'origin', 'main'])
}

/**
 * Get diff between current branch and main branch
 * @returns {Promise<string>} Git diff output
 */
export async function getBranchDiff() {
  core.info('Getting diff between current branch and main...')
  return await execGitCommand(['diff', 'origin/main...HEAD'])
}

/**
 * Parse git diff output to extract individual file changes
 * @param {string} diffOutput - Raw git diff output
 * @returns {Array} Array of file change objects
 */
export function parseGitDiff(diffOutput) {
  const files = []
  const fileRegex = /diff --git a\/(.*?) b\/(.*?)\n/g
  let match

  while ((match = fileRegex.exec(diffOutput)) !== null) {
    const fileName = match[1]
    const fileStart = match.index
    const nextFileMatch = fileRegex.exec(diffOutput)
    const fileEnd = nextFileMatch ? nextFileMatch.index : diffOutput.length

    // Reset regex for next iteration
    fileRegex.lastIndex = nextFileMatch
      ? nextFileMatch.index
      : diffOutput.length

    const fileDiff = diffOutput.substring(fileStart, fileEnd)

    files.push({
      fileName,
      diff: fileDiff
    })
  }

  return files
}

/**
 * Get all changed files with their diffs
 * @returns {Promise<Array>} Array of changed file objects
 */
export async function getChangedFiles() {
  try {
    await fetchMainBranch()
    const diffOutput = await getBranchDiff()

    if (diffOutput.trim().length === 0) {
      core.info('No changes between this branch and main.')
      return []
    }

    core.info('Changes detected against main branch.')
    core.debug('Full diff output:')
    core.debug(diffOutput)

    return parseGitDiff(diffOutput)
  } catch (error) {
    throw new Error(`Failed to get changed files: ${error.message}`)
  }
}
