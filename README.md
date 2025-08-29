# AI Code Review Action

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/javascript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/javascript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/javascript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/javascript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

🤖 An intelligent GitHub Action that automatically reviews your code changes
using OpenAI and posts detailed feedback as pull request comments.

## Features

- **AI-Powered Code Review**: Leverages OpenAI's GPT models to provide
  intelligent code analysis
- **Comment-Triggered Test Generation**: 🆕 Generate tests by commenting "write
  tests" or "/test" on PRs
- **Automated Test Generation**: Generate comprehensive unit tests for changed
  files using AI
- **Pull Request Integration**: Automatically posts review comments directly on
  your PRs
- **Smart File Filtering**: Excludes irrelevant files (package-lock.json, build
  artifacts, etc.) from review
- **Customizable Exclusions**: Configure additional file patterns to exclude
  from review
- **Detailed Analysis**: Reviews code for quality, security, performance, and
  best practices
- **Multi-Framework Support**: Supports Jest, pytest, JUnit, and more for test
  generation
- **Configurable Models**: Choose between different OpenAI models and adjust
  parameters

## Quick Start

1. **Add the workflow to your repository**

Create `.github/workflows/ai-code-review.yml`:

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  ai-review:
    runs-on: ubuntu-latest
    name: AI Code Review

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: AI Code Review
        uses: your-username/ai-code-review@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

2. **Set up your OpenAI API key**

Add your OpenAI API key as a repository secret named `OPENAI_API_KEY`.

3. **Create a pull request**

The action will automatically review your code changes and post a detailed
comment!

## 🧪 Interactive Test Generation

You can generate tests on-demand by commenting on any pull request:

- **"write tests"** - Generates comprehensive unit tests for all changed files
- **"generate tests"** - Same as above
- **"/test"** - Quick command to trigger test generation
- **"create tests"** - Alternative trigger phrase

The AI will analyze the changed files and post a comment containing generated
test code that you can copy and save to the suggested file paths.

**Example:**

1. Comment "write tests" on a PR
2. The bot responds with generated test files in a comment
3. Copy the test code and save it to your project
4. Run the tests to verify they work

## Configuration Options

| Input            | Description                                      | Required | Default               |
| ---------------- | ------------------------------------------------ | -------- | --------------------- |
| `openai-api-key` | OpenAI API key for code review                   | No       | -                     |
| `github-token`   | GitHub token for posting PR comments             | No       | `${{ github.token }}` |
| `openai-model`   | OpenAI model to use                              | No       | `gpt-4`               |
| `max-tokens`     | Maximum tokens for AI response                   | No       | `1000`                |
| `temperature`    | Temperature for AI model (0-2)                   | No       | `0.1`                 |
| `post-comment`   | Whether to post review as PR comment             | No       | `true`                |
| `generate-tests` | Whether to generate unit tests for changed files | No       | `false`               |
| `excluded-files` | Comma-separated list of file patterns to exclude | No       | ``                    |

## Advanced Configuration

### Custom File Exclusions

```yaml
- name: AI Code Review
  uses: your-username/ai-code-review@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    excluded-files: '*.generated.js,docs/*,legacy/,*.lock'
```

### Model Configuration

```yaml
- name: AI Code Review
  uses: your-username/ai-code-review@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    openai-model: 'gpt-4-turbo'
    max-tokens: '2000'
    temperature: '0.2'
```

## Default File Exclusions

The action automatically excludes these types of files from review:

- **Package manager files**: `package-lock.json`, `yarn.lock`, `composer.lock`,
  etc.
- **Build/distribution**: `dist/`, `build/`, `coverage/`, `node_modules/`, etc.
- **Environment files**: `.env*` files
- **Generated files**: `*.min.js`, `*.bundle.js`, etc.
- **Documentation**: `CHANGELOG.md`, `LICENSE`, etc.
- **IDE/system files**: `.DS_Store`, `.vscode/`, `.idea/`, etc.

## Review Instructions

Customize the AI review criteria by creating a `review-instructions.md` file in
your repository root:

```markdown
# Custom Review Instructions

Please review this code for:

- Code quality and maintainability
- Security vulnerabilities
- Performance optimizations
- TypeScript best practices
- React/Vue.js patterns (if applicable)

Focus on providing actionable feedback with specific examples.
```

## Test Generation Instructions

Customize the AI test generation by creating a `test-instructions.md` file in
your repository root:

```markdown
# Test Generation Instructions

## Focus Areas

- Test all public methods and functions
- Include edge cases and error scenarios
- Mock external dependencies
- Use descriptive test names

## Custom Requirements

- Focus on testing authentication flows
- Ensure all database interactions are mocked
- Include performance tests for critical paths
```

For detailed information about test generation features, see
[TEST-GENERATION.md](TEST-GENERATION.md).

## Development

```bash
npm install
```

1. :building_construction: Package the JavaScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ throws invalid number (3ms)
     ✓ wait 500 ms (504ms)
     ✓ test runs (95ms)

   ...
   ```

## Update the Action Metadata

The [`action.yml`](action.yml) file defines metadata about your action, such as
input(s) and output(s). For details about this file, see
[Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions).

When you copy this repository, update `action.yml` with the name, description,
inputs, and outputs for your action.

## Update the Action Code

The [`src/`](./src/) directory is the heart of your action! This contains the
source code that will be run when your action is invoked. You can replace the
contents of this directory with your own code.

There are a few things to keep in mind when writing your action code:

- Most GitHub Actions toolkit and CI/CD operations are processed asynchronously.
  In `main.js`, you will see that the action is run in an `async` function.

  ```javascript
  const core = require('@actions/core')
  //...

  async function run() {
    try {
      //...
    } catch (error) {
      core.setFailed(error.message)
    }
  }
  ```

  For more information about the GitHub Actions toolkit, see the
  [documentation](https://github.com/actions/toolkit/blob/main/README.md).

So, what are you waiting for? Go ahead and start customizing your action!

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

1. Replace the contents of `src/` with your action code
1. Add tests to `__tests__/` for your source code
1. Format, test, and build the action

   ```bash
   npm run all
   ```

   > This step is important! It will run [`rollup`](https://rollupjs.org/) to
   > build the final JavaScript action code with all dependencies included. If
   > you do not run this step, your action will not work correctly when it is
   > used in a workflow.

1. (Optional) Test your action locally

   The [`@github/local-action`](https://github.com/github/local-action) utility
   can be used to test your action locally. It is a simple command-line tool
   that "stubs" (or simulates) the GitHub Actions Toolkit. This way, you can run
   your JavaScript action locally without having to commit and push your changes
   to a repository.

   The `local-action` utility can be run in the following ways:
   - Visual Studio Code Debugger

     Make sure to review and, if needed, update
     [`.vscode/launch.json`](./.vscode/launch.json)

   - Terminal/Command Prompt

     ```bash
     # npx @github/local action <action-yaml-path> <entrypoint> <dotenv-file>
     npx @github/local-action . src/main.js .env
     ```

   You can provide a `.env` file to the `local-action` CLI to set environment
   variables used by the GitHub Actions Toolkit. For example, setting inputs and
   event payload data used by your action. For more information, see the example
   file, [`.env.example`](./.env.example), and the
   [GitHub Actions Documentation](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables).

1. Commit your changes

   ```bash
   git add .
   git commit -m "My first action is ready!"
   ```

1. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

1. Create a pull request and get feedback on your action
1. Merge the pull request into the `main` branch

Your action is now published! :rocket:

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
in the GitHub Actions toolkit.

## Validate the Action

You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: ./
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

For example workflow runs, check out the
[Actions tab](https://github.com/actions/javascript-action/actions)! :rocket:

## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: actions/javascript-action@v1 # Commit with the `v1` tag
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

## Dependency License Management

This template includes a GitHub Actions workflow,
[`licensed.yml`](./.github/workflows/licensed.yml), that uses
[Licensed](https://github.com/licensee/licensed) to check for dependencies with
missing or non-compliant licenses. This workflow is initially disabled. To
enable the workflow, follow the below steps.

1. Open [`licensed.yml`](./.github/workflows/licensed.yml)
1. Uncomment the following lines:

   ```yaml
   # pull_request:
   #   branches:
   #     - main
   # push:
   #   branches:
   #     - main
   ```

1. Save and commit the changes

Once complete, this workflow will run any time a pull request is created or
changes pushed directly to `main`. If the workflow detects any dependencies with
missing or non-compliant licenses, it will fail the workflow and provide details
on the issue(s) found.

### Updating Licenses

Whenever you install or update dependencies, you can use the Licensed CLI to
update the licenses database. To install Licensed, see the project's
[Readme](https://github.com/licensee/licensed?tab=readme-ov-file#installation).

To update the cached licenses, run the following command:

```bash
licensed cache
```

To check the status of cached licenses, run the following command:

```bash
licensed status
```
