import type { FillValueEffectiveType } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { normalizeEffectiveType } from "./valueClassification"
import { scanFillValuesInXml, type StandardAttributeEnricher } from "./xmlScanner"

const dateType = {
  status: "known",
  composite: false,
  alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
} as const satisfies FillValueEffectiveType

const enrichStandard: StandardAttributeEnricher = (params) => ({
  ownerKind: "Документ",
  effectiveType: dateType,
  type: normalizeEffectiveType(dateType, "rules"),
  rulesClassification: params.typedValue === undefined
    ? { kind: "notSpecified" }
    : { kind: "implicit" },
  rulesEvidence: { declaration: { family: "primitive", kind: "dateTime" } },
})

describe("сканирование FillValue в XML", () => {
  it("извлекает обычные и стандартные реквизиты с исходной формой", () => {
    const result = scanFillValuesInXml({
      configuration: "demo",
      file: "Documents/Заказ.xml",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns:v8="v8" xmlns:xr="xr" xmlns:xsi="xsi">
  <Document uuid="1"><Properties><Name>Заказ</Name><StandardAttributes>
    <xr:StandardAttribute name="Date"><xr:FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</xr:FillValue></xr:StandardAttribute>
  </StandardAttributes></Properties><ChildObjects>
    <Attribute><Properties><Name>Срок</Name><Type><v8:Type>xs:dateTime</v8:Type></Type><FillValue xsi:type="xs:dateTime">2026-08-23T10:20:30</FillValue></Properties></Attribute>
    <Attribute><Properties><Name>Контрагент</Name><Type><v8:Type>cfg:CatalogRef.Контрагенты</v8:Type></Type><FillValue xsi:type="xr:DesignTimeRef">Catalog.Контрагенты.EmptyRef</FillValue></Properties></Attribute>
    <Attribute><Properties><Name>БезЗначения</Name><Type><v8:Type>xs:string</v8:Type></Type></Properties></Attribute>
  </ChildObjects></Document>
</MetaDataObject>`,
      enrichStandard,
    })

    expect(result.unresolved).toEqual([])
    expect(result.observations).toMatchObject([
      {
        attributeName: "Date",
        attributeKind: "standard",
        ownerKind: "Документ",
        raw: { form: "typedText", xsiType: "xs:dateTime", text: "0001-01-01T00:00:00" },
        valueCategory: "initial",
      },
      {
        attributeName: "Срок",
        attributeKind: "ordinary",
        type: { family: "dateTime" },
        valueCategory: "explicit",
      },
      {
        attributeName: "Контрагент",
        attributeKind: "ordinary",
        type: { family: "reference", signature: "reference(Catalog.Контрагенты)" },
        valueCategory: "emptyRef",
      },
      {
        attributeName: "БезЗначения",
        attributeKind: "ordinary",
        raw: { form: "absent" },
        valueCategory: "absent",
      },
    ])
  })

  it("не теряет неподдержанный узел с FillValue", () => {
    const result = scanFillValuesInXml({
      configuration: "demo",
      file: "Unknowns/X.xml",
      xml: "<MetaDataObject><Unknown><Properties><Name>X</Name><FillValue xsi:type=\"xs:string\"/></Properties></Unknown></MetaDataObject>",
      enrichStandard,
    })

    expect(result.observations).toEqual([])
    expect(result.unresolved).toEqual([
      expect.objectContaining({ element: "Properties", reason: "неподдержанная XML-конструкция с FillValue" }),
    ])
  })
})
