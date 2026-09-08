import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as runtime from "@nkdk/runtime"
import { describe, expect, it, vi } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { convertFormFromXML } from "./convertFromXML"

describe("structural form file import", () => {
  it("parses metadata and body once without the legacy parser", async () => {
    const directory = await mkdtemp(join(tmpdir(), "nkdk-structural-form-"))
    const parser = vi.spyOn(runtime, "parseXmlDocumentWithSaxes")
    try {
      const inputDir = join(directory, "input")
      const outputDir = join(directory, "output")
      await mkdir(join(inputDir, "Форма", "Ext"), { recursive: true })
      await writeFile(join(inputDir, "Форма.xml"), readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml"))
      await writeFile(join(inputDir, "Форма", "Ext", "Form.xml"), readXMLFixtureAsString(import.meta.url, "minimal.xml"))
      await convertFormFromXML({ context: mockContextFromXML(), inputDir, outputDir, formName: "Форма" })
      expect(await readFile(join(outputDir, "Формы", "Форма", "Форма.yaml"), "utf8"))
        .toContain("НазначенияИспользования: ПлатформаИМобильноеПриложение")
      expect(parser).toHaveBeenCalledTimes(2)
    } finally {
      parser.mockRestore()
      await rm(directory, { recursive: true, force: true })
    }
  })
})
