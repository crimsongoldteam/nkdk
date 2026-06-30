import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataBusinessProcessRules } from "./rules"
import { MetadataBusinessProcess } from "./types"

const normalizeXML = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataBusinessProcess from XML", () => {
  it("imports full fixture with task reference", () => {
    const result = testImportAppliedObjectFromXML<MetadataBusinessProcess>({
      rule: MetadataBusinessProcessRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result).toMatchObject({
      itemType: "MetadataBusinessProcess",
      name: "БизнесПроцессВсеСвойства",
      task: "Task.ЗадачаВсеСвойства",
    })
    expect(result?.attributes?.map((attribute: { name: string }) => attribute.name)).toContain("РеквизитВсеСвойства")
    expect(result?.commands?.map((command: { name: string }) => command.name)).toEqual([
      "РеквизитАдресацииВсеСвойства",
      "РеквизитАдресацииПоУмолчанию",
    ])
  })

  it("imports minimal fixture defaults", () => {
    const result = testImportAppliedObjectFromXML<MetadataBusinessProcess>({
      rule: MetadataBusinessProcessRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })

    expect(result).toMatchObject({
      itemType: "MetadataBusinessProcess",
      name: "БизнесПроцессПоУмолчанию",
      task: "Task.ЗадачаВсеСвойства",
    })
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataBusinessProcess>({
      rule: MetadataBusinessProcessRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataBusinessProcessRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
