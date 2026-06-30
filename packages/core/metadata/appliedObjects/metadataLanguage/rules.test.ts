import { describe, expect, it } from "vitest"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import "./register"
import { MetadataLanguageRules } from "./rules"

describe("MetadataLanguageRules", () => {
  it("registers MetadataLanguage through register.ts", () => {
    expect(getTypeRule("MetadataLanguage", "exportToJSONSchema")).toEqual(expect.any(Function))
  })

  it("keeps the same property declarations after moving registration", () => {
    expect(MetadataLanguageRules.properties.xmlRoot).toEqual({
      type: "XMLRoot",
      container: "Language",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(MetadataLanguageRules.properties.uuid).toEqual({
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    })

    expect(MetadataLanguageRules.properties.name).toMatchObject({
      type: "string",
      xmlParents: ["Properties"],
      required: true,
    })

    expect(MetadataLanguageRules.properties.synonym).toEqual({
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(MetadataLanguageRules.properties.objectBelonging).toEqual({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    })
  })
})
