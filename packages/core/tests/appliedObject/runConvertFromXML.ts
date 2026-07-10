import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { convertAppliedObjectFromXML } from "../../metadata/orchestration/appliedObject/convertFromXML"
import { MetadataItemRule } from "../../metadata/orchestration"
import { mockContextFromXML } from "../mockContext"

type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string
  expectedYAML: string
}

export const testConvertAppliedObjectFromXML = async (
  params: Params
): Promise<{
  outputDir: string
  inputDir: string
  yaml: { result: string; expected: string }
}> => {
  const { rule, name, importMetaUrl, expectedYAML } = params
  const fixturesSubdir = params.fixturesSubdir ?? "__fixtures__/sync"

  const testDir = dirname(fileURLToPath(importMetaUrl))
  const fixturesDir = join(testDir, fixturesSubdir)
  const inputDir = join(fixturesDir, "xml")
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "applied-convert-"))

  await convertAppliedObjectFromXML({
    rule,
    context: mockContextFromXML(),
    inputDir,
    name,
    outputDir,
  })

  return {
    outputDir,
    inputDir,
    yaml: {
      result: fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8"),
      expected: expectedYAML,
    },
  }
}
