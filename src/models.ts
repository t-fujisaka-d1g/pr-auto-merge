export const MergeMethods = {
  Merge: 'merge',
  Squash: 'squash',
  Rebase: 'rebase'
} as const
export type MergeMethod = typeof MergeMethods[keyof typeof MergeMethods]

export const calcMergeMethod = (comment: string): MergeMethod => {
  if (comment.includes('squash')) {
    return MergeMethods.Squash
  }
  if (comment.includes('rebase')) {
    return MergeMethods.Rebase
  }
  return MergeMethods.Merge
}

export const calcCommentBody = (mergeMethod: MergeMethod): string => {
  switch (mergeMethod) {
    case MergeMethods.Merge:
      return 'Merge pull request :rocket:'
    case MergeMethods.Squash:
      return 'Squash and merge :rocket:'
    case MergeMethods.Rebase:
      return 'Rebase and merge :rocket:'
  }
}
