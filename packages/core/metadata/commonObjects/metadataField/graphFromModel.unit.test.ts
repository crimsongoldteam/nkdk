import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects" // регистрация type rules
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BuildGraphFromModelFunction, GraphOps } from "~/metadata/orchestration/property/fn"

const buildMetadataFieldsGraph = getTypeRule(
  "MetadataFields",
  "buildGraphFromModel",
) as BuildGraphFromModelFunction

const noopParams = {
  parentNodeId: "Справочник.Товары",
  filePath: "test/Свойства.yaml",
  yamlMap: undefined,
  propRule: { type: "MetadataFields", yaml: "ВводПоСтроке" } as never,
  graph: undefined as never,
}

describe("buildMetadataFieldsGraph (чистая функция)", () => {
  it("возвращает undefined на пустом массиве полей", () => {
    const result = buildMetadataFieldsGraph({ ...noopParams, model: [] })
    expect(result).toBeUndefined()
  })

  it("возвращает undefined на undefined-модели", () => {
    const result = buildMetadataFieldsGraph({ ...noopParams, model: undefined })
    expect(result).toBeUndefined()
  })

  it("возвращает GraphOps с edgeKind/edgeYaml для непустого массива", () => {
    const result = buildMetadataFieldsGraph({
      ...noopParams,
      model: ["Catalog.X.Attribute.Y"],
    }) as GraphOps
    expect(result).toBeDefined()
    expect(result.edgeKind).toBe("FIELD")
    expect(result.edgeYaml).toBe("Поле")
    expect(result.references).toHaveLength(1)
    expect(result.references?.[0]?.id).toBe("Справочник.X.Реквизит.Y")
  })

  it("формирует по ссылке на каждый элемент массива", () => {
    const result = buildMetadataFieldsGraph({
      ...noopParams,
      model: [
        "Catalog.A.Attribute.П1",
        "Catalog.B.Attribute.П2",
        "Catalog.C.Attribute.П3",
      ],
    }) as GraphOps
    expect(result.references).toHaveLength(3)
    const ids = result.references?.map((r) => r.id).sort()
    expect(ids).toEqual([
      "Справочник.A.Реквизит.П1",
      "Справочник.B.Реквизит.П2",
      "Справочник.C.Реквизит.П3",
    ])
  })
})
