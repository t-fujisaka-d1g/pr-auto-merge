import * as core from '@actions/core'
import * as github from '@actions/github'
import {calcCommentBody, calcMergeMethod} from './models'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github-token')
    const keyword: string = core.getInput('keyword')
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    const octokit = github.getOctokit(token)
    const {data: pulls} = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open'
    })

    for (const pull of pulls) {
      if (pull.auto_merge !== null) {
        core.debug('GitHub謹製のauto-mergeが有効な場合はスキップ')
        continue
      }

      if (pull.assignees && pull.assignees.length > 0) {
        core.debug('Assigneesが指定されている → スキップ')
        continue
      }

      if (pull.requested_reviewers && pull.requested_reviewers.length > 0) {
        core.debug('Reviewersが指定されている → スキップ')
        continue
      }

      const {data: comments} = await octokit.rest.issues.listComments({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pull.number
      })
      core.debug(`comments: ${JSON.stringify(comments, null, '  ')}`)
      const comment = comments
        .sort((a, b) => {
          if (a.created_at < b.created_at) return 1
          if (a.created_at > b.created_at) return -1
          return 0
        })
        .map(v => v.body)
        .find(v => v?.startsWith(keyword))
      if (!comment) {
        core.debug(`[${keyword}]コメントがない → スキップ`)
        continue
      }

      const mergeMethod = calcMergeMethod(comment)

      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: Number(pull.number),
        body: calcCommentBody(mergeMethod)
      })
    }

    core.debug(`pulls: ${JSON.stringify(pulls, null, '  ')}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
