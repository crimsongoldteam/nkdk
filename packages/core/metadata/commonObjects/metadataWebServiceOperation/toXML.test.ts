import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { operationsWithXDTOTypeNamespace } from "./__fixtures__/data"
import "./register"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation" } as const

describe("export MetadataWebServiceOperations to XML", () => {
  it("round-trips XDTO type namespace declarations from reference XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: operationsWithXDTOTypeNamespace,
      xmlRootTag: "Operation",
      path: "xdto-type-namespace.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports changed XDTO type names without reference namespace declarations", () => {
    const [{ parameters, ...operation }] = operationsWithXDTOTypeNamespace
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          ...operation,
          xdtoReturningValueType: "xs:string",
          parameters: parameters?.map((parameter) => ({
            ...parameter,
            xdtoValueType: "xs:token",
          })),
        },
      ],
      xmlRootTag: "Operation",
      path: "xdto-type-namespace.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
    expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
    expect(result).not.toContain("xmlns:d4p1")
  })

  it("exports XDTO type names as plain strings without reference XML", () => {
    const [{ parameters, ...operation }] = operationsWithXDTOTypeNamespace
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          ...operation,
          xdtoReturningValueType: "xs:string",
          parameters: parameters?.map((parameter) => ({
            ...parameter,
            xdtoValueType: "xs:token",
          })),
        },
      ],
      xmlRootTag: "Operation",
      referenceMetadata: undefined,
    })

    expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
    expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
    expect(result).not.toContain("xmlns")
  })

  it("does not preserve non-xmlns reference attributes on matching XDTO type names", () => {
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlRootTag: "Operation",
      forReference: true,
      xmlString: `<Operation uuid="11111111-1111-4111-8111-111111111111">
        <Properties>
          <Name>ОперацияXDTO</Name>
          <XDTOReturningValueType xmlns:d4p1="http://example.org/schema" custom="drop-me">d4p1:CustomerResponse</XDTOReturningValueType>
          <Nillable>false</Nillable>
          <Transactioned>false</Transactioned>
          <ProcedureName>ОперацияXDTO</ProcedureName>
          <DataLockControlMode>Managed</DataLockControlMode>
          <Synonym/>
          <Comment/>
        </Properties>
        <ChildObjects>
          <Parameter uuid="11111111-1111-4111-8111-111111111111">
            <Properties>
              <Name>ПараметрXDTO</Name>
              <XDTOValueType xmlns:d4p1="http://example.org/schema" custom="drop-me">d4p1:Customer</XDTOValueType>
              <Nillable>false</Nillable>
              <TransferDirection>In</TransferDirection>
              <Synonym/>
              <Comment/>
            </Properties>
          </Parameter>
        </ChildObjects>
      </Operation>`,
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: operationsWithXDTOTypeNamespace,
      xmlRootTag: "Operation",
      referenceMetadata,
    })

    expect(result).toContain('xmlns:d4p1="http://example.org/schema"')
    expect(result).not.toContain("custom=")
  })
})
