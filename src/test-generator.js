import * as core from '@actions/core'
import OpenAI from 'openai'
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { dirname, basename, extname } from 'path'
import { wait } from './wait.js'
import { getOpenAIConfig, loadTestInstructions } from './config.js'

/**
 * Create OpenAI client instance
 * @param {Object} config - OpenAI configuration
 * @returns {OpenAI} OpenAI client instance
 */
function createOpenAIClient(config) {
  return new OpenAI({ apiKey: config.apiKey })
}

/**
 * Determine test file path and framework based on file extension
 * @param {string} filePath - Original file path
 * @returns {Object} Test configuration
 */
function getTestConfig(filePath) {
  const ext = extname(filePath)
  const dir = dirname(filePath)
  const name = basename(filePath, ext)

  const testPatterns = {
    '.js': { path: `${dir}/${name}.test.js`, framework: 'jest' },
    '.ts': { path: `${dir}/${name}.test.ts`, framework: 'jest' },
    '.jsx': { path: `${dir}/${name}.test.jsx`, framework: 'jest' },
    '.tsx': { path: `${dir}/${name}.test.tsx`, framework: 'jest' },
    '.py': { path: `${dir}/test_${name}.py`, framework: 'pytest' },
    '.java': { path: `${dir}/${name}Test.java`, framework: 'junit' }
  }

  return (
    testPatterns[ext] || {
      path: `${dir}/${name}.test.js`,
      framework: 'jest'
    }
  )
}

/**
 * Generate test instructions based on framework
 * @param {string} framework - Testing framework
 * @returns {string} Test generation instructions
 */
function getTestInstructions(framework) {
  return `Generate comprehensive unit tests for the provided code.

Focus on:
1. Test Coverage: Cover all public functions and edge cases
2. Test Structure: Use proper test organization and naming
3. Assertions: Include meaningful assertions
4. Edge Cases: Test boundary conditions and error cases

Requirements:
- Write clean, readable test code
- Include setup and teardown where needed
- Test both positive and negative scenarios
- Add descriptive test names
- Ensure tests are independent

Framework: ${framework}
${framework === 'jest' ? '- Use describe blocks for grouping tests\n- Use test or it for individual test cases\n- Use expect for assertions' : ''}
${framework === 'pytest' ? '- Use test_ prefix for test functions\n- Use assert statements for assertions' : ''}`
}

/**
 * Generate unit tests for a single file using AI
 * @param {string} fileName - Name of the file
 * @param {string} fileContent - Content of the file
 * @param {string} fileDiff - Git diff for the file
 * @param {OpenAI} openai - OpenAI client
 * @param {Object} config - OpenAI configuration
 * @param {string} customInstructions - Custom test generation instructions
 * @returns {Promise<Object>} Test generation result
 */
async function generateTestForFile(
  fileName,
  fileContent,
  fileDiff,
  openai,
  config,
  customInstructions
) {
  try {
    const testConfig = getTestConfig(fileName)
    const instructions =
      customInstructions || getTestInstructions(testConfig.framework)
    const language = extname(fileName).slice(1) || 'javascript'

    const prompt = `${instructions}

File to test: ${fileName}
Target test file: ${testConfig.path}

File Content:
\`\`\`${language}
${fileContent}
\`\`\`

Recent Changes (Git Diff):
\`\`\`diff
${fileDiff}
\`\`\`

Generate complete unit tests for this file. Focus on the recently changed code.
Return ONLY the test code without explanations.`

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert software engineer specializing in writing comprehensive unit tests.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens * 2,
      temperature: 0.1
    })

    return {
      fileName,
      testConfig,
      testContent: response.choices[0].message.content,
      success: true
    }
  } catch (error) {
    const errorMessage = `Failed to generate tests for ${fileName}: ${error.message}`
    core.error(errorMessage)
    return {
      fileName,
      testConfig: null,
      testContent: null,
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Read file content from disk
 * @param {string} filePath - Path to the file
 * @returns {string} File content
 */
function readFileContent(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch (error) {
    core.warning(`Could not read file ${filePath}: ${error.message}`)
    return ''
  }
}

/**
 * Write test file to disk
 * @param {string} testPath - Path for the test file
 * @param {string} content - Test content
 * @returns {boolean} Success status
 */
function writeTestFile(testPath, content) {
  try {
    // Ensure directory exists
    const testDir = dirname(testPath)
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    writeFileSync(testPath, content, 'utf8')
    core.info(`✅ Generated test file: ${testPath}`)
    return true
  } catch (error) {
    core.error(`Failed to write test file ${testPath}: ${error.message}`)
    return false
  }
}

/**
 * Generate unit tests for all changed files
 * @param {Array} files - Array of file objects with fileName and diff
 * @returns {Promise<Array>} Array of test generation results
 */
export async function generateTestsForChanges(files) {
  const config = getOpenAIConfig()
  const shouldGenerateTests = core.getInput('generate-tests') === 'true'

  if (!shouldGenerateTests) {
    core.info('🧪 Test generation is disabled')
    return []
  }

  if (!config) {
    core.warning('OpenAI API key not provided. Skipping test generation.')
    return []
  }

  if (files.length === 0) {
    core.info('No files to generate tests for.')
    return []
  }

  // Load custom test instructions
  const testInstructions = await loadTestInstructions()
  core.info('📋 Loaded test generation instructions')

  // Filter files that should have tests
  const testableFiles = files.filter((file) => {
    const fileName = file.fileName.toLowerCase()
    return (
      !fileName.includes('.test.') &&
      !fileName.includes('.spec.') &&
      !fileName.includes('__tests__') &&
      !fileName.includes('.config.') &&
      !fileName.includes('.min.') &&
      !fileName.endsWith('.md') &&
      !fileName.endsWith('.json') &&
      !fileName.endsWith('.yml') &&
      !fileName.endsWith('.yaml')
    )
  })

  if (testableFiles.length === 0) {
    core.info('No testable files found in changes.')
    return []
  }

  const openai = createOpenAIClient(config)
  const testResults = []

  core.info(
    `🧪 Starting test generation for ${testableFiles.length} file(s)...`
  )

  for (const file of testableFiles) {
    core.info(`\n🔬 Generating tests for: ${file.fileName}`)

    // Read the actual file content
    const fileContent = readFileContent(file.fileName)

    if (!fileContent) {
      core.warning(`Skipping ${file.fileName} - could not read file content`)
      continue
    }

    const testResult = await generateTestForFile(
      file.fileName,
      fileContent,
      file.diff,
      openai,
      config,
      testInstructions
    )

    testResults.push(testResult)

    if (testResult.success && testResult.testContent) {
      // Write the test file
      const writeSuccess = writeTestFile(
        testResult.testConfig.path,
        testResult.testContent
      )
      testResult.written = writeSuccess
    }

    // Small delay to avoid rate limiting
    if (testableFiles.indexOf(file) < testableFiles.length - 1) {
      core.debug('Waiting to avoid rate limiting...')
      await wait(1000)
    }
  }

  const successCount = testResults.filter((r) => r.success && r.written).length
  core.info(
    `\n✅ Test generation completed! Generated ${successCount} test file(s).`
  )

  return testResults
}

/**
 * Check if test generation is enabled and configured
 * @returns {boolean} True if test generation can be performed
 */
export function isTestGenerationEnabled() {
  const config = getOpenAIConfig()
  const shouldGenerateTests = core.getInput('generate-tests') === 'true'
  return config !== null && shouldGenerateTests
}
