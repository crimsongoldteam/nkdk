import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"

describe("buildIncrementalXmlSyncPlan", () => {
  it("groups duplicate areas and marks Configuration.xml when owner set changes", () => {
    const plan = buildIncrementalXmlSyncPlan({
      diff: {
        added: ["Справочник/Товары/Формы/НоваяФорма/Форма.yaml"],
        changed: ["Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml"],
        deleted: [],
      },
      rules: [MetadataCatalogRules],
    })

    expect(plan.rebuildConfigurationXml).toBe(true)
    expect(plan.areas.map((area) => area.key).sort()).toEqual([
      "fileItem:Справочник/Товары/form/НоваяФорма",
      "owner:Справочник/Товары",
    ])
  })

  it("throws when a deleted path cannot be resolved by rules", () => {
    expect(() =>
      buildIncrementalXmlSyncPlan({
        diff: { added: [], changed: [], deleted: ["x/y/z.txt"] },
        rules: [MetadataCatalogRules],
      }),
    ).toThrow('Нет правила инкрементальной XML-синхронизации для "x/y/z.txt"')
  })
})
