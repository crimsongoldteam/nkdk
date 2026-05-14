import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { MetadataBusinessProcessRules } from "./rules"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataBusinessProcess", () => {
  const name = "БизнесПроцессВсеСвойства"

  it("writes object modules and flowchart from nkdk to XML", async () => {
    const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "sync")
    const referenceDir = join(fixtureDir, "xml")
    const nkdkDir = mkdtempSync(join(tmpdir(), "business-process-nkdk-"))
    const outputDir = mkdtempSync(join(tmpdir(), "business-process-xml-"))

    await convertAppliedObjectFromXML({
      rule: MetadataBusinessProcessRules,
      context: mockContextFromXML(),
      inputDir: referenceDir,
      name,
      outputDir: nkdkDir,
    })

    await syncAppliedObjectToXML({
      rule: MetadataBusinessProcessRules,
      context: mockContextToXML(),
      inputDir: nkdkDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(referenceDir, name),
    })

    for (const path of ["Ext/ObjectModule.bsl", "Ext/ManagerModule.bsl", "Ext/Flowchart.xml"] as const) {
      expect(normalizeLineEndings(fs.readFileSync(join(outputDir, name, path), "utf-8")), path).toBe(
        normalizeLineEndings(fs.readFileSync(join(referenceDir, name, path), "utf-8"))
      )
    }
  })
})
