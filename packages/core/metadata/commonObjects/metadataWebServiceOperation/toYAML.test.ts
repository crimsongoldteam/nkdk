import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { operationsWithXDTOTypeNamespace } from "./__fixtures__/data"
import "./register"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation", yaml: "Операции" } as const

describe("export MetadataWebServiceOperations to YAML", () => {
  it("exports XDTO type names as strings", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: operationsWithXDTOTypeNamespace,
    }) as Record<string, any>

    const operation = result.Операции.ОперацияXDTO
    const parameter = operation.Параметры.ПараметрXDTO

    expect(operation.ТипВозвращаемогоЗначенияXDTO).toEqual({
      ПространствоИмен: "http://example.org/schema",
      Имя: "CustomerResponse",
    })
    expect(parameter.ТипЗначенияXDTO).toEqual({
      ПространствоИмен: "http://example.org/schema",
      Имя: "Customer",
    })
  })
})
