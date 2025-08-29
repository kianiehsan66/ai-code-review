import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { wait } from './wait.js'

/**
 * Print the diff between current branch and main branch
 * @returns {Promise<void>}
 */
async function printBranchDiff() {
  try {
    let output = '';
    const options = {};
    options.listeners = {
      stdout: (data) => {
        output += data.toString();
      },
      stderr: (data) => {
        output += data.toString();
      }
    };
    
    core.info('Fetching latest main branch...');
    await exec.exec('git', ['fetch', 'origin', 'main'], options);
    
    core.info('Getting diff between current branch and main...');
    output = ''; // Reset output for diff command
    await exec.exec('git', ['diff', 'origin/main...HEAD'], options);
    
    if (output.trim().length === 0) {
      core.info('No changes between this branch and main.');
    } else {
      core.info('Changes against main branch:');
      core.info(output);
    }
  } catch (error) {
    core.setFailed(`Failed to print branch diff: ${error.message}`);
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
    await printBranchDiff();
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
