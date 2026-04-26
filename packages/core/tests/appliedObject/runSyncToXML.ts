import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { MetadataItemRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string
  expectedFiles: string[]
}

export const testSyncAppliedObjectToXML = async (
  params: Params
): Promise<{
  outputDir: string
  comparisons: Array<{ path: string; result: string; expected: string }>
}> => {
  const { rule, name, importMetaUrl, expectedFiles } = params
  const fixturesSubdir = params.fixturesSubdir ?? "__fixtures__/sync"

  const testDir = dirname(fileURLToPath(importMetaUrl))
  const fixturesDir = join(testDir, fixturesSubdir)
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "applied-sync-"))

  await syncAppliedObjectToXML({
    rule,
    context: mockContextToXML(),
    inputDir,
    name,
    outputDir,
    referenceDir,
  })

  const comparisons = expectedFiles.map((path) => ({
    path,
    result: fs.readFileSync(join(outputDir, path), "utf-8"),
    expected: fs.readFileSync(join(referenceDir, path), "utf-8"),
  }))

  return { outputDir, comparisons }
}
