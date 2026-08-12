import { describe, expect, it } from "vitest"
import { requiresDataPathStandardMemberFormatting } from "./finalizationPredicate"
import {
  createDataPathRegistrySet,
} from "./registry"
import { withDataPathRegistrySet } from "@nkdk/runtime/rule-kit"
import { settingsComposerDataPathRules } from "../../forms/settingsComposer/dataPathRules"
import { metadataRules } from "../../composition/metadataRules"
import { createMetadataExecutionRegistrySets, withMetadataExecutionRegistrySets } from "../../composition/metadataExecutionContext"

const registries = createMetadataExecutionRegistrySets(metadataRules)

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
    ["Items.Таблица.CurrentData.Код", "internal-to-yaml", true],
    ["Элементы.Таблица.ТекущиеДанные.Код", "yaml-to-internal", true],
  ] as const)("checks %j in %s", (value, direction, expected) => {
    withMetadataExecutionRegistrySets(registries, () => {
      expect(requiresDataPathStandardMemberFormatting(value, direction)).toBe(expected)
    })
  })

  it("rebuilds the matcher after registering a nested standard-table column", () => {
    const registry = createDataPathRegistrySet([{
      kind: "standardMembers",
      ownerKind: "TestOwner",
      members: [
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
      ],
    }])

    withDataPathRegistrySet(registry, () => {
      expect(requiresDataPathStandardMemberFormatting("Объект.UniqueEnglish", "internal-to-yaml")).toBe(true)
    })
  })

  it("обнаруживает зарегистрированные внутренние имена SettingsComposer", () => {
    const registry = createDataPathRegistrySet(settingsComposerDataPathRules)

    withDataPathRegistrySet(registry, () => {
      expect(requiresDataPathStandardMemberFormatting(
        "КомпоновщикНастроек.Settings.ReportStructurePicture",
        "internal-to-yaml",
      )).toBe(true)
      expect(requiresDataPathStandardMemberFormatting(
        "КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
        "yaml-to-internal",
      )).toBe(true)
    })
  })
})
