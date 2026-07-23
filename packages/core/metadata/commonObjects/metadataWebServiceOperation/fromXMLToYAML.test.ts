import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"

import "./register"

describe("MetadataWebServiceOperations XML → YAML", () => {
  it("imports XDTO type names with namespace declarations as strings", () => {
    const yaml = convert().yaml
    expect(yaml).toHaveProperty("Значение.ОперацияXDTO.ТипВозвращаемогоЗначенияXDTO", {
      ПространствоИмен: "http://example.org/schema",
      Имя: "CustomerResponse",
    })
    expect(yaml).toHaveProperty("Значение.ОперацияXDTO.Параметры.ПараметрXDTO.ТипЗначенияXDTO", {
      ПространствоИмен: "http://example.org/schema",
      Имя: "Customer",
    })
  })

  it("exports XDTO type names as strings", () => {
    const yaml = convert().yaml
    expect(yaml).toHaveProperty("Значение.ОперацияXDTO.ТипВозвращаемогоЗначенияXDTO.Имя", "CustomerResponse")
    expect(yaml).toHaveProperty("Значение.ОперацияXDTO.Параметры.ПараметрXDTO.ТипЗначенияXDTO.Имя", "Customer")
  })
})

const convert = () =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataWebServiceOperations",
    xmlRootTag: "Operation",
    importMetaUrl: import.meta.url,
    fixture: "xdto-type-namespace.xml",
  })
