import { describe, expect, it } from "vitest"
import {
  collectStructuralReferenceChanges,
  createPropertyStructuralReferenceRuntime,
} from "./references"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"

describe("collectStructuralReferenceChanges", () => {
  it("rewrites metadataTarget references to target and descendant paths", () => {
    const changes = collectStructuralReferenceChanges({
      projectDir: "/tmp/project",
      fromPrefix: "Catalog.Товары",
      toPrefix: "Catalog.Номенклатура",
      items: [
        {
          filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
          yamlPath: ["ОсновнаяФорма"],
          canonical: "Catalog.Товары.Form.ФормаЭлемента",
          setCanonical: () => undefined,
        },
        {
          filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
          yamlPath: ["Комментарий"],
          canonical: "Catalog.ТоварыТекст",
          setCanonical: () => undefined,
        },
      ],
    })

    expect(changes).toEqual([
      {
        filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
        yamlPath: ["ОсновнаяФорма"],
        from: "Catalog.Товары.Form.ФормаЭлемента",
        to: "Catalog.Номенклатура.Form.ФормаЭлемента",
      },
    ])
  })

  it("uses structural reference rules from the owning runtime", () => {
    const createRules = (kind: "item" | "collection") => createRuleRegistrySet(
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: {
          ProbeNested: {
            yamlToXMLNestedRule: kind === "item"
              ? { kind, itemRule: { itemType: "ProbeItem", properties: {} } }
              : {
                  kind,
                  yamlShape: "record",
                  itemRule: { itemType: "ProbeCollectionItem", properties: {} },
                },
          },
        },
      }),
    )

    expect(createPropertyStructuralReferenceRuntime(createRules("item"))
      .nestedRule({ type: "ProbeNested" })).toMatchObject({ kind: "item" })
    expect(createPropertyStructuralReferenceRuntime(createRules("collection"))
      .nestedRule({ type: "ProbeNested" })).toMatchObject({ kind: "collection" })
  })
})
