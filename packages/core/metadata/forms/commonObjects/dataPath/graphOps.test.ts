import { describe, expect, it } from "vitest"
import { buildDataPathGraphOps } from "./graphOps"

describe("buildDataPathGraphOps", () => {
  it("создаёт DATA_PATH reference для глобального пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Catalog.Товары.Attribute.Владелец",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
    })

    expect(result).toEqual({
      references: [
        {
          id: "Catalog.Товары.Attribute.Владелец",
          name: "Владелец",
          edgeProps: {
            property: "dataPath",
            sourcePath: "Catalog.Товары.Attribute.Владелец",
            pathMode: "global",
          },
        },
      ],
      edgeKind: "DATA_PATH",
      edgeYaml: "ПутьКДанным",
    })
  })

  it.each([
    ["Document.Заказ.StandardAttribute.Date", "Document.Заказ.StandardAttribute.Date"],
    ["Документ.Заказ.СтандартныйРеквизит.Date", "Document.Заказ.StandardAttribute.Date"],
    ["DocumentObject.Заказ.Number", "Document.Заказ.StandardAttribute.Number"],
    ["CatalogObject.Товары.Description", "Catalog.Товары.StandardAttribute.Description"],
  ])("создаёт canonical DATA_PATH reference для %s", (sourcePath, expectedId) => {
    const result = buildDataPathGraphOps({
      sourcePath,
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
    })

    expect(result?.references?.[0].id).toBe(expectedId)
  })

  it("создаёт TABLE reference с fallback в TabularSection для глобального runtime-пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Catalog.Товары.Состав",
      propertyName: "table",
      edgeYaml: "Таблица",
      fallbackChildKind: "TabularSection",
    })

    expect(result?.references?.[0].id).toBe("Catalog.Товары.TabularSection.Состав")
  })

  it("создаёт DATA_PATH formLocalReference для form-local пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Объект.Наименование",
      propertyName: "footerDataPath",
      edgeYaml: "ПутьКДаннымПодвала",
      formNodeId: "Форма.Товар",
    })

    expect(result).toEqual({
      formLocalReferences: [
        {
          formLocalPath: "Объект.Наименование",
          formNodeId: "Форма.Товар",
          edgeProps: {
            property: "footerDataPath",
            sourcePath: "Объект.Наименование",
            pathMode: "formLocal",
          },
          dependsOnEdgeKind: "DATA_PATH_DEPENDS_ON",
        },
      ],
      edgeKind: "DATA_PATH",
      edgeYaml: "ПутьКДаннымПодвала",
    })
  })

  it("передаёт fallbackChildKind для form-local TABLE пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Объект.Состав",
      propertyName: "table",
      edgeYaml: "Таблица",
      formNodeId: "Catalog.Товары.Form.ФормаСписка",
      fallbackChildKind: "TabularSection",
    })

    expect(result?.formLocalReferences?.[0].fallbackChildKind).toBe("TabularSection")
  })

  it("не создаёт GraphOps для пустого пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
      formNodeId: "Форма.Товар",
    })

    expect(result).toBeUndefined()
  })

  it("не создаёт GraphOps для form-local пути без formNodeId", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Объект.Наименование",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
    })

    expect(result).toBeUndefined()
  })
})
