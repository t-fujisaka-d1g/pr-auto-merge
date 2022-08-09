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

    const result: {num: number; text: string}[] = []

    for (const pull of pulls) {
      if (pull.auto_merge !== null) {
        const message = 'スキップ(GitHub謹製auto-mergeが有効)'
        core.debug(message)
        result.push({num: pull.number, text: message})
        continue
      }

      if (pull.assignees && pull.assignees.length > 0) {
        const message = 'スキップ(Assignees指定あり)'
        core.debug(message)
        result.push({num: pull.number, text: message})
        continue
      }

      if (pull.requested_reviewers && pull.requested_reviewers.length > 0) {
        const message = 'スキップ(Reviewers指定あり)'
        core.debug(message)
        result.push({num: pull.number, text: message})
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
        const message = `スキップ([${keyword}]コメントがなし)`
        core.debug(message)
        result.push({num: pull.number, text: message})
        continue
      }

      const mergeMethod = calcMergeMethod(comment)

      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: Number(pull.number),
        body: calcCommentBody(mergeMethod)
      })

      result.push({num: pull.number, text: calcCommentBody(mergeMethod)})
    }

    await core.summary
      .addHeading('Test Results')
      .addTable([
        [
          {data: 'PR番号', header: true},
          {data: 'マージ結果', header: true}
        ],
        ...result.map(v => [`#${v.num}`, v.text])
      ])
      .addLink('View staging deployment!', 'https://github.com')
      .write()

    core.debug(`pulls: ${JSON.stringify(pulls, null, '  ')}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
