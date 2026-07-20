import { join } from "path"
import { describe, expect, it } from "vitest"
import { createImportAssignments, type ImportAssignmentGroup } from "./assignmentBuilder"

const source = { kind: "itemRule", itemType: "test" } as const

function group(
  targetProjectPath: string,
  role: ImportAssignmentGroup["route"]["role"],
  itemType: string
): ImportAssignmentGroup {
  return {
    route: {
      kind: "assignment",
      xmlPattern: `${targetProjectPath}.xml`,
      targetPattern: targetProjectPath,
      role,
      itemType,
      source,
    },
    values: {},
    targetProjectPath,
    xmlFiles: [{ role: "metadata", sourcePath: join("/xml", targetProjectPath.replace(/\.yaml$/, ".xml")) }],
    externalFiles: [],
  }
}

describe("XML import assignment builder", () => {
  it("finds the nearest owner through project directories and reuses its identity", () => {
    const assignments = createImportAssignments([
      group("Справочник/Контрагенты/Формы/Форма/Команды/Записать/Команда.yaml", "fileItem", "FormCommand"),
      group("Справочник/Контрагенты/Формы/Форма/Форма.yaml", "fileItem", "ClientApplicationForm"),
      group("Справочник/Контрагенты/Свойства.yaml", "properties", "MetadataCatalog"),
    ])

    expect(assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Справочник/Контрагенты/Свойства.yaml",
      "Справочник/Контрагенты/Формы/Форма/Команды/Записать/Команда.yaml",
      "Справочник/Контрагенты/Формы/Форма/Форма.yaml",
    ])
    expect(
      assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма.yaml"))?.owner
    ).toMatchObject({
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    })
    expect(
      assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Команда.yaml"))?.owner
    ).toMatchObject({
      itemType: "ClientApplicationForm",
      name: "Форма",
      logicalAddress: "Справочник.Контрагенты.ClientApplicationForm.Форма",
    })
  })
})
