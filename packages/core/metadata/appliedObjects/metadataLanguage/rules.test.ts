import { describe, expect, it } from "vitest"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { MetadataLanguageRules } from "./rules"
import "./register"

describe("MetadataLanguageRules", () => {
  it("declares every property through local builders without changing behavior", () => {
    expect(MetadataLanguageRules).toMatchObject({
      itemType: "MetadataLanguage",
      itemTypePrefix: "Язык",
      xmlDir: "Languages",
    })

    expect(MetadataLanguageRules.properties).toEqual({
      xmlRoot: {
        type: "XMLRoot",
        container: "Language",
        rootAttributes: V8_MDCLASSES_ROOT,
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      },
      uuid: {
        type: "uuid",
        xml: "_uuid",
        forReferenceOnly: true,
        xmlParents: [],
      },
      name: {
        type: "string",
        xmlParents: ["Properties"],
        required: true,
        defaultValue: expect.any(Function),
      },
      synonym: {
        type: "I8nText",
        yaml: "Синоним",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
        excludeIfEqualNameYAML: true,
      },
      comment: {
        type: "string",
        yaml: "Комментарий",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      },
      languageCode: {
        type: "string",
        yaml: "КодЯзыка",
        xml: "LanguageCode",
        required: true,
        xmlParents: ["Properties"],
      },
      objectBelonging: {
        type: "SystemEnumeration",
        yaml: "ПринадлежностьОбъекта",
        xml: "ObjectBelonging",
        typeSE: "ObjectBelonging",
        xmlParents: ["Properties"],
        toYAML: false,
        fromYAML: false,
        implicitValueYAML: "Native",
      },
      extendedConfigurationObject: {
        type: "string",
        xml: "ExtendedConfigurationObject",
        xmlParents: ["Properties"],
        runtimeOnly: true,
      },
    })

    expect(MetadataLanguageRules.properties.name.defaultValue({ name: "Русский" })).toBe("Русский")
  })

  it("registers MetadataLanguage through register.ts", () => {
    expect(getTypeRule("MetadataLanguage", "exportToJSONSchema")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "importFromXMLToYAML")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "yamlToXMLNestedRule")).toMatchObject({ kind: "item" })
    expect(getTypeRule("MetadataLanguage", "importFromYAML")).toBeUndefined()
    expect(getTypeRule("MetadataLanguage", "exportToYAML")).toBeUndefined()
    expect(getTypeRule("MetadataLanguage", "importFromXML")).toBeUndefined()
    expect(getTypeRule("MetadataLanguage", "exportToXML")).toBeUndefined()
  })
})
