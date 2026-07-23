import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../../metadata/orchestration/property/types"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../directConversion"

interface FixtureCase {
  fixture: string
  yaml: unknown
  yamlAssertion?: "equal" | "matchObject"
  yamlFromXML?: true
}

interface FixtureConversionParams {
  itemType: string
  rule: MetadataItemRule
  importMetaUrl: string
  cases: readonly FixtureCase[]
  testTitle: string
}

export function describeAppliedObjectXMLToYAMLFixtures(params: FixtureConversionParams): void {
  describe(`${params.itemType} XML → YAML`, () => {
    it.each(params.cases)(params.testTitle, ({ fixture, yaml, yamlAssertion }) => {
      const result = testAppliedObjectFromXMLToYAML({
        rule: params.rule,
        importMetaUrl: params.importMetaUrl,
        fixture,
      })

      if (yamlAssertion === "matchObject") expect(result.yaml).toMatchObject(yaml as object)
      else expect(result.yaml).toEqual(yaml)
    })
  })
}

export function describeAppliedObjectYAMLToXMLFixtures(params: FixtureConversionParams): void {
  describe(`${params.itemType} YAML → XML`, () => {
    it.each(params.cases)(params.testTitle, ({ fixture, yaml, yamlFromXML }) => {
      const sourceYAML =
        yamlFromXML === true
          ? testAppliedObjectFromXMLToYAML({
              rule: params.rule,
              importMetaUrl: params.importMetaUrl,
              fixture,
            }).yaml
          : yaml
      const result = testAppliedObjectFromYAMLToXML({
        rule: params.rule,
        importMetaUrl: params.importMetaUrl,
        fixture,
        yaml: sourceYAML,
      })

      expect(normalizeLineEndings(result.result)).toEqual(normalizeLineEndings(result.expected))
    })
  })
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n")
}
