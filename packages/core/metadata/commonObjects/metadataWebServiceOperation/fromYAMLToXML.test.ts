import { describe, expect, it } from "vitest"

import {
  serializeDirectXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { importContentFromXML } from "../../../xml/import/importer"

import "./register"

const rule = {
  itemType: "MetadataWebServiceOperationsProbe",
  properties: { value: { type: "MetadataWebServiceOperations", yaml: "Значение", xml: "Operation" } },
} as MetadataItemRule

const xdtoYAML = {
  ОперацияXDTO: {
    ТипВозвращаемогоЗначенияXDTO: { ПространствоИмен: "http://example.org/schema", Имя: "CustomerResponse" },
    Параметры: {
      ПараметрXDTO: { ТипЗначенияXDTO: { ПространствоИмен: "http://example.org/schema", Имя: "Customer" } },
    },
  },
}

describe("MetadataWebServiceOperations YAML → XML", () => {
  it("imports XDTO type name objects", () => {
    const xml = exportYAML(xdtoYAML)
    expect(xml).toContain("d6p1:CustomerResponse")
    expect(xml).toContain("d6p1:Customer")
  })

  it("exports XDTO type namespace declarations from expanded names", () => {
    const result = roundTrip()
    expect(result).toContain(
      '<XDTOReturningValueType xmlns:d4p1="http://example.org/schema">d4p1:CustomerResponse</XDTOReturningValueType>'
    )
    expect(result).toContain('<XDTOValueType xmlns:d4p1="http://example.org/schema">d4p1:Customer</XDTOValueType>')
  })

  it("exports changed XDTO type names without reference namespace declarations", () => {
    const imported = fixtureResult()
    const yaml = imported.yaml as Record<string, any>
    yaml.Значение.ОперацияXDTO.ТипВозвращаемогоЗначенияXDTO = {
      ПространствоИмен: "http://www.w3.org/2001/XMLSchema",
      Имя: "string",
    }
    yaml.Значение.ОперацияXDTO.Параметры.ПараметрXDTO.ТипЗначенияXDTO = {
      ПространствоИмен: "http://www.w3.org/2001/XMLSchema",
      Имя: "token",
    }
    const result = fixtureResult(yaml).result
    expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
    expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
    expect(result).not.toContain("xmlns:d4p1")
  })

  it("exports built-in XDTO type names as plain strings without reference XML", () => {
    const result = exportYAML({
      ОперацияXDTO: {
        ТипВозвращаемогоЗначенияXDTO: { ПространствоИмен: "http://www.w3.org/2001/XMLSchema", Имя: "string" },
        Параметры: {
          ПараметрXDTO: {
            ТипЗначенияXDTO: { ПространствоИмен: "http://www.w3.org/2001/XMLSchema", Имя: "token" },
          },
        },
      },
    })
    expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
    expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
    expect(result).not.toContain("xmlns")
  })

  it("exports custom XDTO type names without reference namespace declarations", () => {
    const result = exportYAML(xdtoYAML)
    expect(result).toContain(
      '<XDTOReturningValueType xmlns:d6p1="http://example.org/schema">d6p1:CustomerResponse</XDTOReturningValueType>'
    )
    expect(result).toContain('<XDTOValueType xmlns:d6p1="http://example.org/schema">d6p1:Customer</XDTOValueType>')
  })

  it("does not preserve non-xmlns reference attributes on matching XDTO type names", () => {
    const referenceXML = referenceWithPrefix("d4p1", ' custom="drop-me"')
    const result = exportYAML(xdtoYAML, referenceXML)
    expect(result).toContain('xmlns:d4p1="http://example.org/schema"')
    expect(result).not.toContain("custom=")
  })

  it("preserves reference namespace prefix on matching XDTO type names", () => {
    const result = exportYAML(xdtoYAML, referenceWithPrefix("d8p1"))
    expect(result).toContain(
      '<XDTOReturningValueType xmlns:d8p1="http://example.org/schema">d8p1:CustomerResponse</XDTOReturningValueType>'
    )
    expect(result).toContain('<XDTOValueType xmlns:d8p1="http://example.org/schema">d8p1:Customer</XDTOValueType>')
  })
})

function fixtureResult(yaml?: unknown) {
  return testPropertyFixtureThroughYAML({
    propertyType: "MetadataWebServiceOperations",
    xmlRootTag: "Operation",
    importMetaUrl: import.meta.url,
    fixture: "xdto-type-namespace.xml",
    yaml,
  })
}

const roundTrip = (): string => fixtureResult().result

function exportYAML(value: unknown, referenceXML?: unknown): string {
  return serializeDirectXML(
    testPropertyFromYAMLToXML({ rule, yaml: { Значение: value }, referenceXML }).xml
  )
}

function referenceWithPrefix(prefix: string, extraAttribute = ""): unknown {
  return importContentFromXML(`<Operation uuid="11111111-1111-4111-8111-111111111111">
    <Properties>
      <Name>ОперацияXDTO</Name>
      <XDTOReturningValueType xmlns:${prefix}="http://example.org/schema"${extraAttribute}>${prefix}:CustomerResponse</XDTOReturningValueType>
      <Nillable>false</Nillable><Transactioned>false</Transactioned><ProcedureName>ОперацияXDTO</ProcedureName>
      <DataLockControlMode>Managed</DataLockControlMode><Synonym/><Comment/>
    </Properties>
    <ChildObjects><Parameter uuid="11111111-1111-4111-8111-111111111111"><Properties>
      <Name>ПараметрXDTO</Name>
      <XDTOValueType xmlns:${prefix}="http://example.org/schema"${extraAttribute}>${prefix}:Customer</XDTOValueType>
      <Nillable>false</Nillable><TransferDirection>In</TransferDirection><Synonym/><Comment/>
    </Properties></Parameter></ChildObjects>
  </Operation>`)
}
