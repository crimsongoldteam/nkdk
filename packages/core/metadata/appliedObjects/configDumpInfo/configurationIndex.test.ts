import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { getMetadataSnapshotImportCapability } from "../../resourceTopology/capabilities"
import "./configurationIndex"

describe("ConfigDumpInfo configuration snapshot", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("collects root order, opaque identifiers, versions and child order", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-config-dump-index-"))
    tempDirs.push(dir)
    const sourcePath = join(dir, "ConfigDumpInfo.xml")
    fs.writeFileSync(
      sourcePath,
      `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" format="Hierarchical" version="2.20">
  <ConfigVersions>
    <Metadata name="Catalog.Товары" id="00000000-0000-4000-8000-000000000001" configVersion="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
      <Metadata name="Catalog.Товары.Attribute.Код" id="00000000-0000-4000-8000-000000000002"/>
    </Metadata>
    <Metadata name="Catalog.Товары.Form.Форма" id="00000000-0000-4000-8000-000000000001.0" configVersion="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"/>
  </ConfigVersions>
</ConfigDumpInfo>`,
      "utf-8"
    )

    const capability = getMetadataSnapshotImportCapability("configDumpInfo")
    const fragment = await capability?.run({
      context: mockContextFromXML(),
      sourcePath,
      targetProjectPath: "Конфигурация.yaml",
    })

    expect(fragment?.xmlNodes).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "Конфигурация.ConfigDumpInfo",
          order: ["Catalog.Товары", "Catalog.Товары.Form.Форма"],
        },
        {
          logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары.children",
          order: ["Catalog.Товары.Attribute.Код"],
        },
      ])
    )
    expect(fragment?.identities).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары%2EForm%2EФорма",
          kind: "xmlId",
          value: "00000000-0000-4000-8000-000000000001.0",
        },
      ])
    )
    expect(fragment?.xmlNodes.every((node) => (node.order?.length ?? 1) > 0)).toBe(true)
  })
})
