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
import { fullXmlSyncTestTopologyFields } from "./testTopology"

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
            kind: "xmlId",
            value: "00000000-0000-4000-8000-000000000777",
          },
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары.children.Catalog%2EТовары%2EAttribute%2EКод",
            kind: "xmlId",
            value: "00000000-0000-4000-8000-000000000778",
          },
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары%2EForm%2EФорма",
            kind: "xmlId",
            value: "00000000-0000-4000-8000-000000000777.0",
          },
        ],
        xmlNodes: [
          ...sampleIndex().xmlNodes,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo",
            order: ["Catalog.Товары", "Catalog.Товары.Form.Форма"],
          },
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары.children",
            order: ["Catalog.Товары.Attribute.Код"],
          },
        ],
        xmlValues: [
          ...sampleIndex().xmlValues,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары.configVersion",
            xmlText: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары%2EForm%2EФорма.configVersion",
            xmlText: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
      }),
    })

    const xml = fs.readFileSync(join(outputDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(xml).toContain('name="Catalog.Товары"')
    expect(xml).toContain('id="00000000-0000-4000-8000-000000000777"')
    expect(xml).toContain(
      '<Metadata name="Catalog.Товары.Attribute.Код" id="00000000-0000-4000-8000-000000000778"/>'
    )
    expect(xml).toContain(
      '<Metadata name="Catalog.Товары.Form.Форма" id="00000000-0000-4000-8000-000000000777.0" configVersion="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"/>'
    )
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

  it("preserves ConfigDumpInfo order independently of assignment order", async () => {
    const outputDir = tempDir()
    const base = sampleIndex()
    await writeFullXmlSyncConfigDumpInfo({
      context: mockContext,
      outputDir,
      assignments: [catalogAssignment("Первый"), catalogAssignment("Второй")],
      index: reader({
        ...base,
        identities: [
          ...base.identities,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EВторой",
            kind: "xmlId",
            value: "00000000-0000-4000-8000-000000000002",
          },
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EПервый",
            kind: "xmlId",
            value: "00000000-0000-4000-8000-000000000001",
          },
        ],
        xmlNodes: [
          ...base.xmlNodes,
          {
            logicalAddress: "Конфигурация.ConfigDumpInfo",
            order: ["Catalog.Второй", "Catalog.Первый"],
          },
        ],
      }),
    })

    const xml = fs.readFileSync(join(outputDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(xml.indexOf('name="Catalog.Второй"')).toBeLessThan(xml.indexOf('name="Catalog.Первый"'))
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
    ...fullXmlSyncTestTopologyFields(`Справочник/${name}/Свойства.yaml`),
  }
}
