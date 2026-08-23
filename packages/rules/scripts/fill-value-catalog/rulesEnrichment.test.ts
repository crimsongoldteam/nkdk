import { describe, expect, it } from "vitest"
import { createStandardAttributeEnricher } from "./rulesEnrichment"
import { scanFillValuesInXml } from "./xmlScanner"

const enrich = createStandardAttributeEnricher()

describe("обогащение стандартного реквизита из rules.ts", () => {
  it("определяет примитивную дату документа", () => {
    expect(enrich({
      ownerXmlKind: "Document",
      ownerName: "Заказ",
      ownerXml: { Properties: { Name: "Заказ" } },
      internalName: "Date",
      raw: { form: "typedText", xsiType: "xs:dateTime", text: "0001-01-01T00:00:00" },
      typedValue: { type: "dateTime", value: "0001-01-01T00:00:00" },
    })).toMatchObject({
      ownerKind: "Документ",
      type: { source: "rules", family: "dateTime", signature: "dateTime(DateTime)" },
      rulesClassification: { kind: "implicit" },
      rulesEvidence: { declaration: { family: "primitive", kind: "dateTime" } },
    })
  })

  it("выводит ссылку на объект-владелец", () => {
    expect(enrich({
      ownerXmlKind: "Catalog",
      ownerName: "Контрагенты",
      ownerXml: { Properties: { Name: "Контрагенты" } },
      internalName: "Ref",
      raw: { form: "nil" },
    })).toMatchObject({
      ownerKind: "Справочник",
      type: {
        source: "rules",
        family: "reference",
        signature: "reference(Catalog.Контрагенты)",
      },
      rulesClassification: { kind: "notSpecified" },
    })
  })

  it("импортирует свойства владельца для динамического типа кода", () => {
    expect(enrich({
      ownerXmlKind: "Catalog",
      ownerName: "Контрагенты",
      ownerXml: {
        Properties: {
          Name: "Контрагенты",
          CodeType: "String",
          CodeLength: "9",
          CodeAllowedLength: "Variable",
        },
      },
      internalName: "Code",
      raw: { form: "typedEmpty", xsiType: "xs:string" },
      typedValue: { type: "string", value: "" },
    })).toMatchObject({
      ownerKind: "Справочник",
      type: {
        source: "rules",
        family: "string",
        signature: "string(length=9,allowedLength=Variable)",
      },
      rulesClassification: { kind: "implicit" },
      rulesEvidence: {
        ownerProperties: {
          codeType: "String",
          codeLength: 9,
          codeAllowedLength: "Variable",
        },
      },
    })
  })

  it("явно отмечает неизвестного владельца", () => {
    expect(enrich({
      ownerXmlKind: "Unknown",
      ownerName: "X",
      ownerXml: { Properties: { Name: "X" } },
      internalName: "Date",
      raw: { form: "nil" },
    })).toMatchObject({
      ownerKind: "Unknown",
      type: { source: "unresolved", family: "unresolved" },
      rulesClassification: { kind: "unresolved" },
    })
  })

  it("передаёт динамический тип кода в наблюдение XML-сканера", () => {
    const result = scanFillValuesInXml({
      configuration: "demo",
      file: "Catalogs/Контрагенты.xml",
      enrichStandard: enrich,
      xml: `<MetaDataObject xmlns:xr="xr" xmlns:xsi="xsi"><Catalog><Properties>
        <Name>Контрагенты</Name><CodeType>String</CodeType><CodeLength>9</CodeLength>
        <CodeAllowedLength>Variable</CodeAllowedLength><StandardAttributes>
          <xr:StandardAttribute name="Code"><xr:FillValue xsi:type="xs:string"/></xr:StandardAttribute>
        </StandardAttributes>
      </Properties></Catalog></MetaDataObject>`,
    })

    expect(result.observations).toMatchObject([{
      attributeName: "Code",
      type: { source: "rules", signature: "string(length=9,allowedLength=Variable)" },
      valueCategory: "initial",
      rulesClassification: "implicit",
    }])
  })
})
