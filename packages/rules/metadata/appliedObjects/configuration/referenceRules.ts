import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"
import { createNamedValueReference } from "../namedValueReference"
import { TopLevelMetadataItemRules } from "./topLevelRules"

const objectOwnedProjectSpecDirs = new Set(["Справочник", "Документ", "Перечисление"])
const specialObjectPathProjectSpecDirs = new Set(["ВнешнийИсточникДанных", "Подсистема"])
const predefinedValueRoots = new Set([
  "Catalog",
  "ChartOfAccounts",
  "ChartOfCalculationTypes",
  "ChartOfCharacteristicTypes",
  "ExchangePlan",
])

export const configurationReferenceRules: readonly ProjectReferenceContribution[] = [
  {
    kind: "fileValidator",
    role: "configuration",
    validator: ({ filePath, parsed }) => {
      if (parsed.data === null || typeof parsed.data !== "object" || Array.isArray(parsed.data)) return []
      if (Object.prototype.hasOwnProperty.call(parsed.data, "ОсновнойЯзык")) return []
      return [{
        filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "structure",
        path: "/ОсновнойЯзык",
        message: 'Отсутствует обязательное свойство "ОсновнойЯзык"',
      }]
    },
  },
  ...TopLevelMetadataItemRules.flatMap<ProjectReferenceContribution>((rule) => {
    const dir = rule.itemTypePrefix
    const owner = rule.metadataTargetOwner
    if (typeof dir !== "string" || objectOwnedProjectSpecDirs.has(dir)) return []
    if (owner?.kind !== "self" || specialObjectPathProjectSpecDirs.has(dir)) return []
    const contributions: ProjectReferenceContribution[] = [{
      kind: "objectPath",
      root: owner.root,
      contributor: ({ projectDir, target }) => ({
        filePath: join(projectDir, dir, target.objectName, "Свойства.yaml"),
      }),
    }]
    if (predefinedValueRoots.has(owner.root)) {
      contributions.push({ kind: "value", root: owner.root, contributor: createNamedValueReference("predefined") })
    }
    return contributions
  }),
]
