import fs from "fs"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { readFormNKDK, readFormYAML } from "~/tests/fixtures/sync/readForm/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { convertFormFromXML } from "./convertFormFromXML"

describe("readForm", () => {
  const inputDir = join(process.cwd(), "tests/fixtures/sync/readForm/Forms")
  const outputDir = join(process.cwd(), "tests/fixtures/sync/readForm/out")
  const formName = "ФормаЭлемента"

  it("should read form from XML and export to YAML file in output dir", async () => {
    const spy = vi.spyOn(fs, "writeFileSync")
    await convertFormFromXML({
      context: mockContextToYAML,
      inputDir,
      formName,
      outputDir,
    })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(join(outputDir, "Формы", formName, "Форма.yaml"), readFormYAML, "utf-8")
    expect(spy).toHaveBeenCalledWith(join(outputDir, "Формы", formName, "Форма.nkdk"), readFormNKDK, "utf-8")
  })
})
