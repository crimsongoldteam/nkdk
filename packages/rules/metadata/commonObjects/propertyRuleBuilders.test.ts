import { describe, expect, it } from "vitest"
import { booleanRule } from "./boolean/types"
import { i8nTextRule } from "./i8nText/types"
import { moduleRule } from "./module/types"
import { numberRule } from "./number/types"
import { stringRule } from "./string/types"
import { uuidRule } from "./uuid/types"
import { xmlRootRule } from "./xmlRoot/types"
import { systemEnumerationRule } from "../systemEnumerations/types"

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

      booleanRule({ defaultValueXML: true })
      numberRule({ defaultValueXML: 1 })
      moduleRule({ xmlPath: "Ext/Module.bsl", nkdkPath: "Модуль.bsl" })

      // @ts-expect-error boolean rules do not accept system-enumeration fields.
      booleanRule({ typeSE: "ObjectBelonging" })

      // @ts-expect-error number rules do not accept module paths.
      numberRule({ xmlPath: "Ext/Module.bsl" })

      // @ts-expect-error module rules do not accept numeric defaults.
      moduleRule({ defaultValueXML: 1 })
    }

    expect(true).toBe(true)
  })
})
