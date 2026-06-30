import { describe, expect, it } from "vitest"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"

describe("property rule builders", () => {
  it("return the same plain object shape as inline rule declarations", () => {
    expect(
      xmlRootRule({
        container: "Language",
        rootAttributes: { xmlns: "urn:test" },
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      })
    ).toEqual({
      type: "XMLRoot",
      container: "Language",
      rootAttributes: { xmlns: "urn:test" },
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(
      uuidRule({
        xml: "_uuid",
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      })
    ).toEqual({
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(
      stringRule({
        yaml: "Комментарий",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      })
    ).toEqual({
      type: "string",
      yaml: "Комментарий",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(
      i8nTextRule({
        yaml: "Синоним",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      })
    ).toEqual({
      type: "I8nText",
      yaml: "Синоним",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(
      systemEnumerationRule({
        yaml: "ПринадлежностьОбъекта",
        xml: "ObjectBelonging",
        typeSE: "ObjectBelonging",
        xmlParents: ["Properties"],
        toYAML: false,
        fromYAML: false,
        implicitValueYAML: "Native",
      })
    ).toEqual({
      type: "SystemEnumeration",
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    })
  })

  it("keeps type-specific checks local to each property type", () => {
    if (false) {
      // @ts-expect-error string rules do not accept system-enumeration fields.
      stringRule({ typeSE: "ObjectBelonging" })

      // @ts-expect-error string rules still must reject foreign fields when valid fields are also present.
      stringRule({ xml: "Name", typeSE: "ObjectBelonging" })

      // @ts-expect-error uuid rules do not accept system-enumeration fields.
      uuidRule({ xml: "_uuid", typeSE: "ObjectBelonging" })

      // @ts-expect-error I8nText rules do not accept string-only foreign fields from other property kinds.
      i8nTextRule({ yaml: "Синоним", typeSE: "ObjectBelonging" })

      // @ts-expect-error system enumeration rules require typeSE.
      systemEnumerationRule({ xml: "ObjectBelonging" })

      // @ts-expect-error XMLRoot rules require rootAttributes.
      xmlRootRule({ container: "Language", forReferenceOnly: true })
    }

    expect(true).toBe(true)
  })
})
