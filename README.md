## 使い方
### 
```yaml
      - uses: t-fujisaka-d1g/pr-auto-merge@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
### ワークフローの記載例
ワークフロー(ci)が終了した際に自動マージを実行
```
name: pr-auto-merge
on:
  workflow_run:
    workflows: 
      - ci
    types:
      - "completed"
jobs:
  pr-auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: t-fujisaka-d1g/pr-auto-merge@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## パラメータ
| パラメータ名       | 必須  | 説明                 | デフォルト          |
|:-------------|:---:|:-------------------|:---------------|
| github-token | 必須  | GitHubトークン         |                |
| keyword      |     | コメントコマンドのprefixを変更 | @pr-auto-merge |

## コメントコマンド
| コメントコマンド                                | マージ方法             |
|:----------------------------------------|:------------------|
| @pr-auto-merge<br/>@pr-auto-merge merge | Merge pull reques |
| @pr-auto-merge squash                   | Squash and merge  |
| @pr-auto-merge rebase                   | Rebase and merge  |
