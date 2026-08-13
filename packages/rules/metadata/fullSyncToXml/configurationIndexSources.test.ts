import { describe, expect, it } from "vitest"
import { withConfigurationIndexSources } from "./configurationIndexSources"
import type { FullXmlSyncAssignment } from "./types"

describe("configurationIndexSources", () => {
  it("включает файл задания, владельца и сохранённую базовую форму", () => {
    const assignment = sampleAssignment({
      baseFormPaths: { baseProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml", savedProjectPath: "Справочник/Товары/Формы/Форма/БазоваяФорма.yaml" },
    })
    const result = withConfigurationIndexSources({
      assignment,
      targetLogicalAddresses: [
        { logicalAddress: "Справочник.Товары", sourceProjectPath: "Справочник/Товары/Свойства.yaml" },
      ],
      baseLogicalAddresses: [
        { logicalAddress: assignment.logicalAddress, sourceProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml" },
      ],
    })
    expect(result.configurationIndexSources).toEqual({
      targetProjectPaths: [
        "Справочник/Товары/Свойства.yaml",
        "Справочник/Товары/Формы/Форма/БазоваяФорма.yaml",
        assignment.sourceProjectPath,
      ].sort(compareUtf8),
      baseProjectPaths: ["Справочник/Товары/Формы/Форма/Форма.yaml"],
    })
  })
})

function sampleAssignment(overrides: Partial<FullXmlSyncAssignment> = {}): FullXmlSyncAssignment {
  return {
    id: "form", sourceProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml", sourcePath: "/project/form.yaml",
    expectedContentHash: 1n, role: "form", itemType: "ClientApplicationForm", itemName: "Форма",
    logicalAddress: "Справочник.Товары.Форма.Форма", nodeId: "form", potentialOutputs: [], ...overrides,
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
