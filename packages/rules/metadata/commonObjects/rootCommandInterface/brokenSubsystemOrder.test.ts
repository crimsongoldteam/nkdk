import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import { importFromYAML, yamlScalarTagAt } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { convertPropertiesFromYAMLToXML, importPropertiesFromXMLToYAML } from "../../ruleRuntime"
import { exportPropertiesToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext, mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

const UUID = "6d16249d-db92-425e-b128-1994db24f5e7"
const execution = createRuleRegistrySet(metadataRules).execution

describe("битый UUID в порядке подсистем CommandInterface", () => {
  it("переносит UUID через !xml и восстанавливает обычный XML-текст", () => {
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: false } }
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: RootCommandInterfaceRules,
      sources: [{
        context,
        xml: {
          SubsystemsOrder: {
            Subsystem: [UUID, "Subsystem.Продажи"],
          },
        },
      }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      execution,
    })

    expect(yaml).toEqual({
      ПорядокПодсистем: [`!xml/reference ${UUID}`, "Подсистема.Продажи"],
    })
    const order = (yaml as { ПорядокПодсистем: unknown[] }).ПорядокПодсистем
    expect(yamlScalarTagAt(order, 0)).toBe("xml/reference")
    expect(yamlScalarTagAt(order, 1)).toBeUndefined()

    const exported = convertPropertiesFromYAMLToXML({
      context: mockContextToXML(),
      yaml: importFromYAML([
        "ПорядокПодсистем:",
        `  - !xml/reference ${UUID}`,
        "  - Подсистема.Продажи",
      ].join("\n")),
      rule: RootCommandInterfaceRules,
      outputs: [{ key: "owner" }],
      execution,
    })

    expect(exported.outputs.get("owner")).toEqual({
      SubsystemsOrder: {
        Subsystem: [UUID, "Subsystem.Продажи"],
      },
    })
  })

  it("разрешает в validation-графе только тегированный UUID", () => {
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule: RootCommandInterfaceRules,
      execution,
    })
    const validation = compileValidationSchema({}, Type.Object(properties))

    expect(validation.Check({ ПорядокПодсистем: [`!xml/reference ${UUID}`] })).toBe(true)
    expect(validation.Check({ ПорядокПодсистем: [UUID] })).toBe(false)
  })
})
