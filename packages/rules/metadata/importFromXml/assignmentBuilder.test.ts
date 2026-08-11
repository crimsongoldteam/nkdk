import { join } from "path"
import { describe, expect, it } from "vitest"
import { createImportAssignments, type ImportAssignmentGroup } from "./assignmentBuilder"
import { configurationUid } from "@nkdk/runtime"

function group(
  targetProjectPath: string,
  role: ImportAssignmentGroup["definition"]["role"],
  itemType: string,
  logicalAddressSegment?: string,
  topologyNodeId?: string,
  itemName?: string,
): ImportAssignmentGroup {
  return {
    definition: {
      role,
      itemType,
      ...(logicalAddressSegment === undefined ? {} : { logicalAddressSegment }),
      ...(topologyNodeId === undefined ? {} : { topologyNodeId }),
      ...(itemName === undefined ? {} : { itemName }),
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
      group("Справочник/Контрагенты/Формы/Форма/Форма.yaml", "fileItem", "ClientApplicationForm", "Форма"),
      group("Справочник/Контрагенты/Свойства.yaml", "properties", "MetadataCatalog"),
    ])

    expect(assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Справочник/Контрагенты/Свойства.yaml",
      "Справочник/Контрагенты/Формы/Форма/Команды/Записать/Команда.yaml",
      "Справочник/Контрагенты/Формы/Форма/Форма.yaml",
    ])
    expect(assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма.yaml"))?.owner).toMatchObject(
      {
        itemType: "MetadataCatalog",
        name: "Контрагенты",
        logicalAddress: "Справочник.Контрагенты",
      }
    )
    expect(
      assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Команда.yaml"))?.owner
    ).toMatchObject({
      itemType: "ClientApplicationForm",
      name: "Форма",
      logicalAddress: "Справочник.Контрагенты.Форма.Форма",
    })
  })

  it("builds an owner chain for recursively nested properties", () => {
    const assignments = createImportAssignments([
      group(
        "Подсистема/Родитель/Подсистемы/Дочерняя/Свойства.yaml",
        "properties",
        "MetadataSubsystem",
        "Подсистема"
      ),
      group("Подсистема/Родитель/Свойства.yaml", "properties", "MetadataSubsystem"),
    ])

    expect(assignments.find((assignment) => assignment.itemName === "Дочерняя")).toMatchObject({
      logicalAddress: "Подсистема.Родитель.Подсистема.Дочерняя",
      owner: {
        itemType: "MetadataSubsystem",
        name: "Родитель",
        logicalAddress: "Подсистема.Родитель",
      },
    })
  })

  it("copies the topology node identifier into an assignment", () => {
    const [assignment] = createImportAssignments([
      group(
        "Обработка/Загрузка/Формы/Основная/Форма.yaml",
        "fileItem",
        "ClientApplicationForm",
        "Форма",
        "processor-form-node"
      ),
    ])

    expect(assignment?.topologyNodeId).toBe("processor-form-node")
  })

  it("uses the semantic item name only for an explicitly named group", () => {
    const [assignment] = createImportAssignments([
      group(
        "Конфигурация.yaml",
        "configuration",
        "MetadataConfigurationExtension",
        undefined,
        undefined,
        "РасширениеКонтроль",
      ),
    ])

    expect(assignment?.itemName).toBe("РасширениеКонтроль")
    expect(assignment?.logicalAddress).toBe(configurationUid())
  })
})
