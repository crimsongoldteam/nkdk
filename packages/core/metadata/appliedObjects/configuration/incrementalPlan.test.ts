import { beforeEach, describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { registerCoreMetadata } from "~/metadata/register"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"

describe("buildIncrementalXmlSyncPlan", () => {
  beforeEach(() => {
    registerCoreMetadata()
  })

  it("groups duplicate areas without marking Configuration.xml for changed owner properties", () => {
    const plan = buildIncrementalXmlSyncPlan({
      diff: {
        added: [],
        changed: ["Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml"],
        deleted: [],
      },
      rules: [MetadataCatalogRules],
    })

    expect(plan.rebuildConfigurationXml).toBe(false)
    expect(plan.areas.map((area) => area.key).sort()).toEqual(["owner:Справочник/Товары"])
  })

  it("marks Configuration.xml when root object composition changes", () => {
    const plan = buildIncrementalXmlSyncPlan({
      diff: {
        added: ["Справочник/Товары/Свойства.yaml"],
        changed: [],
        deleted: [],
      },
      rules: [MetadataCatalogRules],
    })

    expect(plan.rebuildConfigurationXml).toBe(true)
  })

  it("groups file items by route params without marking Configuration.xml", () => {
    const plan = buildIncrementalXmlSyncPlan({
      diff: {
        added: ["Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"],
        changed: [],
        deleted: [],
      },
      rules: [MetadataCatalogRules],
    })

    expect(plan.rebuildConfigurationXml).toBe(false)
    expect(plan.areas.map((area) => area.key)).toEqual(["fileItem:Справочник/Товары/forms/ФормаЭлемента"])
  })


  it("throws when a deleted path cannot be resolved by rules", () => {
    expect(() =>
      buildIncrementalXmlSyncPlan({
        diff: { added: [], changed: [], deleted: ["x/y/z.txt"] },
        rules: [MetadataCatalogRules],
      })
    ).toThrow('Нет правила инкрементальной XML-синхронизации для "x/y/z.txt"')
  })
})
