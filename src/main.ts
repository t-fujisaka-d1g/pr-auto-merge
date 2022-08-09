import * as core from '@actions/core'
import * as github from '@actions/github'
import {calcCommentBody, calcMergeMethod} from './models'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github-token')
    const keyword: string = core.getInput('keyword')
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    // 実行結果(Job Summariesに記載に利用)
    const results: {num: number; text: string; remark: string}[] = []

    const octokit = github.getOctokit(token)
    const {data: pulls} = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open'
    })
    for (const pull of pulls) {
      const skips: string[] = []
      if (pull.auto_merge !== null) {
        skips.push('GitHub謹製auto-merge有効')
      }

      if (pull.assignees && pull.assignees.length > 0) {
        skips.push('Assignees指定あり')
      }

      if (pull.requested_reviewers && pull.requested_reviewers.length > 0) {
        skips.push('Reviewers指定あり')
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
        skips.push(`${keyword}コメントなし`)
      }

      if (skips.length > 0) {
        results.push({
          num: pull.number,
          text: 'スキップ:zzz:',
          remark: skips.join(',')
        })
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const mergeMethod = calcMergeMethod(comment!)

      // PRにコメントを追加
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: Number(pull.number),
        body: calcCommentBody(mergeMethod)
      })

      // PRをマージ
      await octokit.rest.pulls.merge({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pull.number,
        merge_method: mergeMethod
      })

      results.push({
        num: pull.number,
        text: `${calcCommentBody(mergeMethod)}`,
        remark: ''
      })
    }

    await core.summary
      .addTable([
        [
          {data: 'PR', header: true},
          {data: '結果', header: true},
          {data: '備考', header: true}
        ],
        ...results
          .sort((a, b) => (a.num > b.num ? 1 : -1))
          .map(v => [`#${v.num}`, v.text, v.remark])
      ])
      .write()

    core.debug(`pulls: ${JSON.stringify(pulls, null, '  ')}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
