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
          id: "Справочник.Товары.Реквизит.Владелец",
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
        },
      ],
      edgeKind: "DATA_PATH",
      edgeYaml: "ПутьКДаннымПодвала",
    })
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
