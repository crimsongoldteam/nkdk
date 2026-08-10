import { describe, expect, it } from "vitest"
import { collectStructuralReferenceChanges } from "./references"

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
})
