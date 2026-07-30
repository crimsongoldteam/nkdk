import { describe, expect, it } from "vitest"
import "../../appliedObjects/metadataChartOfCalculationTypes/register"
import "../../appliedObjects/metadataCatalog/register"
import { requiresDataPathStandardMemberFormatting } from "./finalizationPredicate"
import {
  registerStandardMembers,
  restoreDataPathResolverRegistryForTests,
  snapshotDataPathResolverRegistryForTests,
} from "./registry"

describe("requiresDataPathStandardMemberFormatting", () => {
  it.each([
    [undefined, "internal-to-yaml", false],
    ["LineNumber", "internal-to-yaml", false],
    ["~Список.LineNumber", "internal-to-yaml", false],
    ["Объект.Товары.LineNumber", "internal-to-yaml", true],
    ["Объект.Товары.LineNumber[0]", "internal-to-yaml", true],
    ["Объект.Товары.MyLineNumber", "internal-to-yaml", false],
    ["Объект.Товары.НомерСтроки", "internal-to-yaml", false],
    ["Объект.Товары.НомерСтроки", "yaml-to-internal", true],
    ["Объект.Товары.LineNumber", "yaml-to-internal", false],
  ] as const)("checks %j in %s", (value, direction, expected) => {
    expect(requiresDataPathStandardMemberFormatting(value, direction)).toBe(expected)
  })

  it("rebuilds the matcher after registering a nested standard-table column", () => {
    const snapshot = snapshotDataPathResolverRegistryForTests()
    try {
      expect(requiresDataPathStandardMemberFormatting("Объект.UniqueEnglish", "internal-to-yaml")).toBe(false)

      registerStandardMembers("TestOwner", [
        {
          memberKind: "standardTabularSection",
          names: { internal: "UniqueTable", yaml: "УникальнаяТаблица" },
          family: "standardTable",
          phase: "traversal-time",
          sourceScope: "self",
          tableKind: "ValueTable",
          columns: [
            {
              memberKind: "standardTabularSectionColumn",
              names: { internal: "UniqueEnglish", yaml: "УникальноеИмя" },
              family: "primitive",
              kind: "string",
            },
          ],
        },
      ])

      expect(requiresDataPathStandardMemberFormatting("Объект.UniqueEnglish", "internal-to-yaml")).toBe(true)
    } finally {
      restoreDataPathResolverRegistryForTests(snapshot)
    }
  })
})
