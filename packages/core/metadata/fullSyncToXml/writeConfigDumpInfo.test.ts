import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import { writeFullXmlSyncConfigDumpInfo } from "./writeConfigDumpInfo"
import type { FullXmlSyncAssignment } from "./types"

describe("writeFullXmlSyncConfigDumpInfo", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-write-dump-info-"))
    tempDirs.push(dir)
    return dir
  }

  it("writes ConfigDumpInfo.xml from assignments and preserves index-backed values", async () => {
    const outputDir = tempDir()
    const result = await writeFullXmlSyncConfigDumpInfo({
      context: mockContext,
      outputDir,
      assignments: [catalogAssignment("Товары")],
      index: reader({
        ...sampleIndex(),
        identities: [
          ...sampleIndex().identities,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары",
            kind: "uuid",
            value: "00000000-0000-4000-8000-000000000777",
          },
        ],
        xmlValues: [
          ...sampleIndex().xmlValues,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары.configVersion",
            xmlText: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        ],
      }),
    })

    const xml = fs.readFileSync(join(outputDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(xml).toContain('name="Catalog.Товары"')
    expect(xml).toContain('id="00000000-0000-4000-8000-000000000777"')
    expect(xml).toMatch(/configVersion="[0-9a-f]{40}"/)
    expect(result).toMatchObject({ targetXmlPath: "ConfigDumpInfo.xml", fragment: { targetProjectPath: "Конфигурация.yaml" } })
  })

  it("generates deterministic new values and records them in index fragment", async () => {
    const firstDir = tempDir()
    const secondDir = tempDir()
    const index = reader(sampleIndex())
    const params = {
      context: mockContext,
      assignments: [catalogAssignment("Товары"), catalogAssignment("Контрагенты")],
      index,
    }

    const first = await writeFullXmlSyncConfigDumpInfo({ ...params, outputDir: firstDir })
    const second = await writeFullXmlSyncConfigDumpInfo({ ...params, outputDir: secondDir })

    expect(fs.readFileSync(join(firstDir, "ConfigDumpInfo.xml"), "utf-8")).toBe(
      fs.readFileSync(join(secondDir, "ConfigDumpInfo.xml"), "utf-8")
    )
    expect(first.fragment.identities.map((identity) => identity.logicalAddress)).toEqual(
      second.fragment.identities.map((identity) => identity.logicalAddress)
    )
    expect(first.fragment.identities).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "uuid" })]))
    expect(first.fragment.xmlValues).toEqual(
      expect.arrayContaining([expect.objectContaining({ logicalAddress: expect.stringContaining(".configVersion") })])
    )
  })
})

function reader(data: ConfigurationIndexData) {
  return createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(data)))
}

function catalogAssignment(name: string): FullXmlSyncAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    sourceProjectPath: `Справочник/${name}/Свойства.yaml`,
    sourcePath: `/project/Справочник/${name}/Свойства.yaml`,
    role: "properties",
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    outputs: [{ routeKind: "owner", targetXmlPath: `Catalogs/${name}.xml` }],
  }
}
