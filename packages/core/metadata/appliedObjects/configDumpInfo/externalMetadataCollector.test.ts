import { describe, expect, it } from "vitest"
import { createConfigDumpInfoExternalMetadataCollector } from "./externalMetadataCollector"
import type { ConfigDumpInfo } from "./types"

describe("createConfigDumpInfoExternalMetadataCollector", () => {
  it("records root and owner child UUIDs into one ConfigDumpInfo map", () => {
    const target: ConfigDumpInfo = new Map()
    const collector = createConfigDumpInfoExternalMetadataCollector(target)
    const root = {
      itemType: "MetadataCatalog" as const,
      name: "Номенклатура",
      path: "MetadataCatalog.Номенклатура",
      externalMetadata: { segment: "Catalog", placement: "rootEntry" as const },
    }

    collector.recordUuid({ itemsTree: [root], uuid: "catalog-uuid" })
    collector.recordUuid({
      itemsTree: [
        root,
        {
          itemType: "MetadataAttribute" as const,
          name: "Артикул",
          path: "MetadataAttribute.Артикул",
          externalMetadata: { segment: "Attribute", placement: "ownerChild" as const },
        },
      ],
      uuid: "attribute-uuid",
    })

    expect(target).toEqual(
      new Map([
        [
          "Catalog.Номенклатура",
          {
            id: "catalog-uuid",
            configVersion: "",
            children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid"]]),
          },
        ],
      ])
    )
  })

  it("records owned entries and derived entries", () => {
    const target: ConfigDumpInfo = new Map()
    const collector = createConfigDumpInfoExternalMetadataCollector(target)
    const root = {
      itemType: "MetadataCatalog" as const,
      name: "Номенклатура",
      path: "MetadataCatalog.Номенклатура",
      externalMetadata: { segment: "Catalog", placement: "rootEntry" as const },
    }
    const form = {
      itemType: "ClientApplicationForm" as never,
      name: "ФормаЭлемента",
      path: "ClientApplicationForm.ФормаЭлемента",
      externalMetadata: { segment: "Form", placement: "ownedEntry" as const },
    }

    collector.recordUuid({ itemsTree: [root], uuid: "catalog-uuid" })
    collector.recordUuid({ itemsTree: [root, form], uuid: "form-uuid" })
    collector.recordDerived({ itemsTree: [root, form], segment: "Form" })
    collector.recordDerived({ itemsTree: [root, form], segment: "Help" })

    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента")).toEqual({
      id: "form-uuid",
      configVersion: "",
      children: new Map(),
    })
    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента.Form")).toEqual({
      id: "",
      configVersion: "",
      derivedFrom: "Catalog.Номенклатура.Form.ФормаЭлемента",
      children: new Map(),
    })
    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента.Help")).toEqual({
      id: "",
      configVersion: "",
      derivedFrom: "Catalog.Номенклатура.Form.ФормаЭлемента",
      children: new Map(),
    })
  })
})
