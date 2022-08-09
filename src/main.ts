import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github-token')
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    const octokit = github.getOctokit(token)
    const pulls = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open'
    })

    core.debug(`pulls: ${JSON.stringify(pulls, null, '  ')}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
