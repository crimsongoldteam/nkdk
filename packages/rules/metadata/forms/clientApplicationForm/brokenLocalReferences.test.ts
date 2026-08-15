import { describe, expect, it } from "vitest"

import { importFromYAML, yamlScalarTagAt } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime/property/fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime/property/fromYAMLToXML"
import type { MetadataItemRule, PropertyRule } from "../../ruleRuntime/property/types"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import {
  isBrokenLocalFormReference,
  LOCAL_FORM_REFERENCE_PATTERNS,
} from "./brokenLocalReferences"

const UUID = "8969c93a-23e5-4bef-941d-aaef315858d2"
const execution = createRuleRegistrySet(metadataRules).execution

describe("broken local form reference grammar", () => {
  it.each([
    ["Command", "3", true],
    ["Command", `0:${UUID}`, true],
    ["CommandName", `1:${UUID}`, true],
    ["Field", `1/0:${UUID}/0:${UUID}`, true],
    ["DataPath", `1/0:${UUID}`, true],
    ["xr:DataPath", `342:${UUID}/15`, true],
    ["CommandGroup", UUID, true],
    ["GroupList", `5:${UUID}`, true],
    ["UserSettingsGroup", `1:${UUID}`, true],
    ["CommandName", "Form.Command.Записать", false],
    ["DataPath", "Объект.Код", false],
    ["CommandGroup", "FormNavigationPanelGoTo", false],
    ["Command", `0: ${UUID}`, false],
    ["CommandName", `1::${UUID}`, false],
    ["Field", `1/0:${UUID}/extra`, false],
    ["GroupList", `5:${UUID.slice(0, -1)}`, false],
  ])("%s recognises %s: %s", (element, value, expected) => {
    expect(isBrokenLocalFormReference(
      element as keyof typeof LOCAL_FORM_REFERENCE_PATTERNS,
      value as string,
    )).toBe(expected)
  })

  it("registers carriers only for the observed property types", () => {
    const names = metadataRules.brokenXMLReferenceCarriers
      .map(({ name }) => name)
      .filter((name) => name.startsWith("clientApplicationForm.localReference."))

    expect(names).toEqual([
      "clientApplicationForm.localReference.commandName",
      "clientApplicationForm.localReference.dataPath",
      "clientApplicationForm.localReference.formString",
      "clientApplicationForm.localReference.fieldsList",
      "clientApplicationForm.localReference.commandInterface",
      "clientApplicationForm.localReference.choiceParameterLinks",
      "clientApplicationForm.localReference.typeLink",
    ])
  })

  it.each([
    [
      { type: "CommandName", xml: "CommandName", yaml: "ИмяКоманды" },
      `1:${UUID}`,
      `ИмяКоманды: !xml/reference 1:${UUID}`,
    ],
    [
      { type: "DataPath", xml: "DataPath", yaml: "ПутьКДанным" },
      `1/0:${UUID}`,
      `ПутьКДанным: !xml/reference 1/0:${UUID}`,
    ],
    [
      { type: "string", xml: "GroupList", yaml: "СписокГрупп" },
      `5:${UUID}`,
      `СписокГрупп: !xml/reference 5:${UUID}`,
    ],
  ] as const)("round-trips scalar %s without reference XML", (propertyRule, xmlValue, source) => {
    const property = propertyRule as PropertyRule
    const rule = probeRule(property)
    const imported = importProbe(rule, { [property.xml!]: xmlValue })

    expect(imported).toEqual({ [property.yaml!]: `!xml/reference ${xmlValue}` })
    expect(yamlScalarTagAt(imported, property.yaml!)).toBe("xml/reference")
    expect(exportProbe(rule, source)).toEqual({ [property.xml!]: xmlValue })
  })

  it("round-trips broken Field entries without changing their order", () => {
    const property = { type: "FieldsList", xml: "Save", yaml: "Сохранение" } as PropertyRule
    const rule = probeRule(property)
    const broken = `1/0:${UUID}`
    const imported = importProbe(rule, { Save: { Field: ["Объект.Код", broken] } }) as {
      Сохранение: string[]
    }

    expect(imported.Сохранение).toEqual(["Объект.Код", `!xml/reference ${broken}`])
    expect(yamlScalarTagAt(imported.Сохранение, 0)).toBeUndefined()
    expect(yamlScalarTagAt(imported.Сохранение, 1)).toBe("xml/reference")
    expect(exportProbe(rule, `Сохранение:\n  - Объект.Код\n  - !xml/reference ${broken}\n`)).toEqual({
      Save: { Field: ["Объект.Код", broken] },
    })
  })

  it("transports Command and CommandGroup inside CommandInterface", () => {
    const carrier = carrierNamed("commandInterface")
    const xmlValue = {
      NavigationPanel: {
        Item: [{ Command: `0:${UUID}`, Type: "Auto", CommandGroup: UUID }],
      },
    }
    const yamlValue = {
      ПанельНавигации: [{ Команда: `0:${UUID}`, Тип: "Auto", ГруппаКоманд: UUID }],
    }

    expect(carrier.tryImport({
      rule: { type: "CommandInterface" } as PropertyRule,
      xmlValue,
      yamlValue,
    })).toEqual({
      yamlValue: {
        ПанельНавигации: [{
          Команда: `!xml/reference 0:${UUID}`,
          Тип: "Auto",
          ГруппаКоманд: `!xml/reference ${UUID}`,
        }],
      },
      taggedLocations: [
        { kind: "value", path: ["ПанельНавигации", 0, "Команда"] },
        { kind: "value", path: ["ПанельНавигации", 0, "ГруппаКоманд"] },
      ],
    })

    const property = {
      type: "CommandInterface",
      xml: "CommandInterface",
      yaml: "ИнтерфейсКоманды",
    } as PropertyRule
    const rule = probeRule(property)
    const imported = importProbe(rule, { CommandInterface: xmlValue }) as {
      ИнтерфейсКоманды: { ПанельНавигации: Record<string, unknown>[] }
    }
    const item = imported.ИнтерфейсКоманды.ПанельНавигации[0]!
    expect(yamlScalarTagAt(item, "Команда")).toBe("xml/reference")
    expect(yamlScalarTagAt(item, "ГруппаКоманд")).toBe("xml/reference")
    expect(exportProbe(
      rule,
      `ИнтерфейсКоманды:\n  ПанельНавигации:\n    - Команда: !xml/reference 0:${UUID}\n      Тип: Auto\n      ГруппаКоманд: !xml/reference ${UUID}\n`,
    )).toEqual({ CommandInterface: xmlValue })
  })

  it("recognises xr:DataPath in both registered composite property types", () => {
    const path = `342:${UUID}/15`
    expect(carrierNamed("choiceParameterLinks").tryImport({
      rule: { type: "ChoiceParameterLinks" } as PropertyRule,
      xmlValue: { "xr:Link": [{ "xr:DataPath": path }] },
      yamlValue: [{ ПутьКДанным: path }],
    })).toMatchObject({
      yamlValue: [{ ПутьКДанным: `!xml/reference ${path}` }],
      taggedLocations: [{ kind: "value", path: [0, "ПутьКДанным"] }],
    })
    expect(carrierNamed("typeLink").tryImport({
      rule: { type: "TypeLink" } as PropertyRule,
      xmlValue: { "xr:DataPath": path, "xr:LinkItem": 0 },
      yamlValue: path,
    })).toEqual({
      yamlValue: `!xml/reference ${path}`,
      taggedLocations: [{ kind: "value", path: [] }],
    })
  })
})

function probeRule(property: PropertyRule): MetadataItemRule {
  return {
    itemType: "BrokenLocalFormReferenceProbe",
    properties: { value: property },
  } as MetadataItemRule
}

function importProbe(rule: MetadataItemRule, xml: Record<string, unknown>): unknown {
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  return importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{ context, xml }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution,
  })
}

function exportProbe(rule: MetadataItemRule, source: string): unknown {
  return convertPropertiesFromYAMLToXML({
    context: mockContextToXML(),
    yaml: importFromYAML(source),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  }).outputs.get("owner")
}

function carrierNamed(name: string) {
  const carrier = metadataRules.brokenXMLReferenceCarriers.find(
    ({ name: carrierName }) => carrierName === `clientApplicationForm.localReference.${name}`,
  )
  expect(carrier).toBeDefined()
  if (carrier === undefined) throw new Error(`Carrier ${name} is not registered`)
  return carrier
}
