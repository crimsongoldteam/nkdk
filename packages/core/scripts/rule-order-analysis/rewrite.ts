import type { RuleSourceEdit } from "./sourceModel"

export async function applyRuleSourceEdits(params: {
  edits: readonly RuleSourceEdit[]
  readFile(path: string): Promise<string>
  writeFile(path: string, text: string): Promise<void>
  verify(): Promise<void>
}): Promise<void> {
  const edits = [...params.edits].sort((left, right) => bytewiseCompare(left.filePath, right.filePath))
  for (const edit of edits) {
    if ((await params.readFile(edit.filePath)) !== edit.originalText) {
      throw new Error(`Файл изменился после построения плана: ${edit.filePath}`)
    }
  }

  const written: RuleSourceEdit[] = []
  try {
    for (const edit of edits) {
      await params.writeFile(edit.filePath, edit.updatedText)
      written.push(edit)
    }
    await params.verify()
  } catch (caught) {
    const restoreErrors: string[] = []
    for (const edit of [...written].reverse()) {
      try {
        await params.writeFile(edit.filePath, edit.originalText)
      } catch (restoreError) {
        restoreErrors.push(`${edit.filePath}: ${errorMessage(restoreError)}`)
      }
    }
    if (restoreErrors.length > 0) {
      throw new Error(`${errorMessage(caught)}; восстановление не удалось: ${restoreErrors.join("; ")}`)
    }
    throw caught
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
