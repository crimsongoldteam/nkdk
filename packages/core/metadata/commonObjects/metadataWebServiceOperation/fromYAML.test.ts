import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import "./register"
import { MetadataWebServiceOperations } from "./types"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation", yaml: "Операции" } as const

describe("import MetadataWebServiceOperations from YAML", () => {
  it("imports XDTO type name objects", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ОперацияXDTO: {
          ТипВозвращаемогоЗначенияXDTO: {
            ПространствоИмен: "http://example.org/schema",
            Имя: "CustomerResponse",
          },
          Параметры: {
            ПараметрXDTO: {
              ТипЗначенияXDTO: {
                ПространствоИмен: "http://example.org/schema",
                Имя: "Customer",
              },
            },
          },
        },
      },
    }) as MetadataWebServiceOperations

    expect(result[0].xdtoReturningValueType).toEqual({
      namespace: "http://example.org/schema",
      name: "CustomerResponse",
    })
    expect(result[0].parameters?.[0].xdtoValueType).toEqual({
      namespace: "http://example.org/schema",
      name: "Customer",
    })
  })
})
