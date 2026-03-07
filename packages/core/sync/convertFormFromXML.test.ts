import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/syncForm/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { convertFormFromXML } from "./convertFormFromXML"

describe("readForm", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/xml/Forms")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/syncForm/out")
  const formName = "ФормаЭлемента"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read form from XML and export to YAML file in output dir", async () => {
    await convertFormFromXML({
      context: mockContextToYAML,
      inputDir,
      formName,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, "Формы", formName, "Форма.yaml"), "utf-8")).toBe(readFormYAML)
    expect(fs.readFileSync(join(outputDir, "Формы", formName, "Форма.nkdk"), "utf-8")).toBe(readFormNKDK)
  })
})
