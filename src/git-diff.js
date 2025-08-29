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
 * Check if a file should be excluded from review
 * @param {string} fileName - Name of the file to check
 * @param {Array} customExclusions - Additional exclusion patterns from input
 * @returns {boolean} True if file should be excluded
 */
function shouldExcludeFile(fileName, customExclusions = []) {
  const defaultExcludePatterns = [
    // Package manager files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'Pipfile.lock',
    'poetry.lock',
    'Gemfile.lock',

    // Build/distribution files
    'dist/',
    'build/',
    'coverage/',
    'node_modules/',
    'vendor/',
    '.next/',
    '.nuxt/',

    // Environment and config files
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',

    // Generated/compiled files
    '.min.js',
    '.min.css',
    '.bundle.js',
    '.chunk.js',

    // Documentation and meta files
    'CHANGELOG.md',
    'CHANGELOG.txt',
    'LICENSE',
    'LICENSE.txt',
    'LICENSE.md',

    // IDE and system files
    '.DS_Store',
    'Thumbs.db',
    '.vscode/',
    '.idea/',

    // Log files
    '*.log',
    'logs/',

    // Temporary files
    '*.tmp',
    '*.temp',
    '*.cache'
  ]

  // Combine default patterns with custom exclusions
  const allPatterns = [...defaultExcludePatterns, ...customExclusions]

  return allPatterns.some((pattern) => {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(fileName)
    } else if (pattern.endsWith('/')) {
      // Handle directory patterns
      return fileName.startsWith(pattern) || fileName.includes('/' + pattern)
    } else {
      // Handle exact matches
      return fileName === pattern || fileName.endsWith('/' + pattern)
    }
  })
}

/**
 * Parse git diff output to extract individual file changes
 * @param {string} diffOutput - Raw git diff output
 * @param {Array} customExclusions - Additional exclusion patterns from input
 * @returns {Array} Array of file change objects
 */
export function parseGitDiff(diffOutput, customExclusions = []) {
  const files = []
  const fileRegex = /diff --git a\/(.*?) b\/(.*?)\n/g
  let match

  while ((match = fileRegex.exec(diffOutput)) !== null) {
    const fileName = match[1]

    // Skip files that should be excluded from review
    if (shouldExcludeFile(fileName, customExclusions)) {
      core.info(`📋 Skipping file (excluded from review): ${fileName}`)
      continue
    }

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
 * @param {Array} customExclusions - Additional exclusion patterns from input
 * @returns {Promise<Array>} Array of changed file objects
 */
export async function getChangedFiles(customExclusions = []) {
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

    return parseGitDiff(diffOutput, customExclusions)
  } catch (error) {
    throw new Error(`Failed to get changed files: ${error.message}`)
  }
}
