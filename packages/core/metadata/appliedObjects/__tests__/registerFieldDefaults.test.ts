import { describe, expect, it } from "vitest"

import {
  serializeDirectXML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"

const cases = [
  ["information dimension", MetadataInformationRegisterRules, "dimensions", true, true],
  ["information resource", MetadataInformationRegisterRules, "resources", true, true],
  ["information attribute", MetadataInformationRegisterRules, "attributes", true, true],
  ["accumulation dimension", MetadataAccumulationRegisterRules, "dimensions", false, true],
  ["accumulation resource", MetadataAccumulationRegisterRules, "resources", false, false],
  ["accumulation attribute", MetadataAccumulationRegisterRules, "attributes", false, true],
  ["accounting dimension", MetadataAccountingRegisterRules, "dimensions", false, true],
  ["accounting resource", MetadataAccountingRegisterRules, "resources", false, false],
  ["accounting attribute", MetadataAccountingRegisterRules, "attributes", false, true],
  ["calculation dimension", MetadataCalculationRegisterRules, "dimensions", false, true],
  ["calculation resource", MetadataCalculationRegisterRules, "resources", false, false],
  ["calculation attribute", MetadataCalculationRegisterRules, "attributes", false, true],
] as const

describe("register field XML defaults", () => {
  it.each(cases)(
    "exports canonical defaults for %s through its owner collection",
    (_name, ownerRule, role, informationDefaults, indexing) => {
      const collectionType = ownerRule.properties[role].type
      const probeRule = {
        itemType: "RegisterFieldDefaultsProbe",
        properties: {
          value: { type: collectionType, yaml: "Значение", xml: "Value" },
        },
      } as MetadataItemRule
      const xml = serializeDirectXML(
        testPropertyFromYAMLToXML({
          rule: probeRule,
          yaml: { Значение: { Поле: { Тип: "Строка" } } },
        }).xml
      )

      expect(xml.includes("<FillFromFillingValue>false</FillFromFillingValue>")).toBe(
        informationDefaults
      )
      expect(xml.includes('<FillValue xsi:nil="true"/>')).toBe(informationDefaults)
      expect(xml.includes("<Indexing>DontIndex</Indexing>")).toBe(indexing)
      expect(xml.includes("<DataHistory>Use</DataHistory>")).toBe(informationDefaults)
    }
  )
})
