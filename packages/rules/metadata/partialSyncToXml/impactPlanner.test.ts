import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { classifyMetadataProjectPath, type MetadataProjectResourceMatch } from "../resourceTopology/core/projectProjection"
import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"
import { createPartialXmlPackagePolicyRegistry } from "./packagePolicy"
import { buildPartialXmlImpactPlan, type PartialXmlImpactPlan } from "./impactPlanner"
import type { PartialXmlChanges, PartialXmlFileVersion } from "./types"
import { childFormPartialXmlPackagePolicy } from "../forms/clientApplicationForm/partialXmlPackage"

const source = { kind: "itemRule" as const, description: "test" }
const configurationRule = { itemType: "Configuration", properties: {} } as MetadataItemRule
const languageRule = {
  itemType: "Language",
  properties: {},
  metadataTargetOwner: { kind: "self", root: "Language" },
} as MetadataItemRule
const objectRule = {
  itemType: "TestObject",
  properties: {},
  metadataTargetOwner: { kind: "self", root: "Catalog" },
} as MetadataItemRule
const formRule = { itemType: "TestForm", properties: {} } as MetadataItemRule
const fileItemRule = {
  itemType: "TestTable",
  properties: {},
  externalMetadata: { segment: "Table", placement: "ownedEntry" },
} as MetadataItemRule
const templateTarget = {
  kind: "member" as const,
  memberKind: "Template" as const,
  itemNameParameter: "itemName",
  itemProjectPattern: "Объект/{ownerName}/Макеты/{itemName}",
  owner: "assignment" as const,
}

const topology = compileMetadataResourceTopology([{
  resources: [
    content("Конфигурация.yaml", "configuration", configurationRule, "none"),
    document("", "Configuration.xml", "metadata", true),
    document("", "Ext/ClientApplicationInterface.xml", "property", false),
    document("", "Ext/MainSectionCommandInterface.xml", "property", false),
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Конфигурация.yaml",
      projectPattern: "МодульПриложения.bsl",
      xmlPattern: "Ext/ManagedApplicationModule.bsl",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      source,
    },
    content("Язык/{ownerName}.yaml", "properties", languageRule, "configurationComposition"),
    document("", "Languages/{ownerName}.xml", "metadata", true),
    content("Объект/{ownerName}/Свойства.yaml", "properties", objectRule, "configurationComposition"),
    document("", "Objects/{ownerName}.xml", "metadata", true),
    content("ОбъектСМанифестом/{ownerName}/Свойства.yaml", "properties", objectRule, "none"),
    document("", "ManifestObjects/{ownerName}.xml", "metadata", true),
    document("", "ManifestObjects/{ownerName}/Ext/Help.xml", "property", false),
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "ОбъектСМанифестом/{ownerName}/Свойства.yaml",
      projectPattern: "ОбъектСМанифестом/{ownerName}/Справка/{relativePath...}",
      xmlPattern: "ManifestObjects/{ownerName}/Ext/Help/{relativePath...}",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      selection: {
        manifestPattern: "ManifestObjects/{ownerName}/Ext/Help.xml",
        listPath: ["Help", "Page"],
        candidateParameter: "relativePath",
        candidateSuffix: ".html",
      },
      source,
    },
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Свойства.yaml",
      projectPattern: "Объект/{ownerName}/Команды/Проверочная.bsl",
      xmlPattern: "Objects/{ownerName}/Commands/Проверочная/Ext/CommandModule.bsl",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      source,
    },
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Свойства.yaml",
      projectPattern: "Объект/{ownerName}/Макеты/{itemName}/Template.xml",
      xmlPattern: "Objects/{ownerName}/Templates/{itemName}.xml",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      fileBackedTarget: templateTarget,
      source,
    },
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Свойства.yaml",
      projectPattern: "Объект/{ownerName}/Макеты/{itemName}/Template.txt",
      xmlPattern: "Objects/{ownerName}/Templates/{itemName}/Ext/Template.txt",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      fileBackedTarget: templateTarget,
      source,
    },
    {
      ...content(
        "Объект/{ownerName}/Таблицы/{itemName}/Свойства.yaml",
        "fileItem",
        fileItemRule,
        "configurationComposition",
      ),
      ownerProjectPattern: "Объект/{ownerName}/Свойства.yaml",
      logicalAddressSegment: "Таблица",
    },
    document(
      "",
      "Objects/{ownerName}/Tables/{itemName}.xml",
      "metadata",
      true,
    ),
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Таблицы/{itemName}/Свойства.yaml",
      projectPattern: "Объект/{ownerName}/Таблицы/{itemName}/Команды/Проверочная.bsl",
      xmlPattern: "Objects/{ownerName}/Tables/{itemName}/Commands/Проверочная/Ext/CommandModule.bsl",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      source,
    },
    {
      ...content(
        "Объект/{ownerName}/Таблицы/{itemName}/Вложения/{nestedName}/Свойства.yaml",
        "fileItem",
        fileItemRule,
        "configurationComposition",
      ),
      ownerProjectPattern: "Объект/{ownerName}/Таблицы/{itemName}/Свойства.yaml",
      logicalAddressSegment: "Вложение",
    },
    document(
      "",
      "Objects/{ownerName}/Tables/{itemName}/Nested/{nestedName}.xml",
      "metadata",
      true,
    ),
    content("Особый.yaml", "properties", objectRule, "none"),
    document("", "Objects/Товары.xml", "metadata", true),
    {
      ...content(
        "Объект/{ownerName}/Формы/{itemName}/Форма.yaml",
        "fileItem",
        formRule,
        "none",
      ),
      logicalAddressSegment: "Форма",
      ownerProjectPattern: "Объект/{ownerName}/Свойства.yaml",
      fileBackedTarget: {
        kind: "member" as const,
        memberKind: "Form" as const,
        itemNameParameter: "itemName",
        itemProjectPattern: "Объект/{ownerName}/Формы/{itemName}",
        owner: "assignmentOwner" as const,
      },
    },
    document("", "Objects/{ownerName}/Forms/{itemName}.xml", "metadata", true),
    document("", "Objects/{ownerName}/Forms/{itemName}/Ext/Form.xml", "body", true),
    {
      kind: "yamlCompanion" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Формы/{itemName}/Форма.yaml",
      projectPattern: "Объект/{ownerName}/Формы/{itemName}/БазоваяФорма.yaml",
      required: false,
      itemRule: formRule,
      projectRole: "form" as const,
      indexContribution: "isolated" as const,
      logicalAddressSegment: "ОсноваФормы",
      source,
    },
    {
      kind: "assignmentInput" as const,
      assignmentProjectPattern: "Объект/{ownerName}/Формы/{itemName}/Форма.yaml",
      projectPattern: "Объект/{ownerName}/Формы/{itemName}/ДинамическийСписок/{queryName}.query",
      source,
    },
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "",
      projectPattern: "Объект/{ownerName}/Формы/{itemName}/Модуль.bsl",
      xmlPattern: "Objects/{ownerName}/Forms/{itemName}/Ext/Form/Module.bsl",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      source,
    },
    content("Самостоятельный/{ownerName}/Свойства.yaml", "properties", objectRule, "none"),
    document("", "Standalone/{ownerName}.xml", "metadata", true),
    document("", "Standalone/{ownerName}/Ext/Body.xml", "body", true),
    document("", "Standalone/{ownerName}/Ext/Optional.xml", "property", false),
    document("", "Standalone/{ownerName}/Ext/Property.xml", "property", true),
    {
      kind: "externalFile" as const,
      assignmentProjectPattern: "Самостоятельный/{ownerName}/Свойства.yaml",
      projectPattern: "Самостоятельный/{ownerName}/Модуль.bsl",
      xmlPattern: "Standalone/{ownerName}/Ext/Module.bsl",
      direction: "both" as const,
      transferCapabilityId: "test",
      compositionImpact: "none" as const,
      source,
    },
    {
      kind: "ignore" as const,
      side: "project" as const,
      pattern: "Служебное/{relativePath...}",
      source,
    },
  ],
}])

const registry = createPartialXmlPackagePolicyRegistry()
registry.register({
  assignment: {
    assignmentPattern: "Конфигурация.yaml",
    loadDocumentRoles: ["metadata"],
    structural: {
      includeOwnerAssignment: false,
      includeCurrentMemberSubtree: false,
      stopAtOwner: true,
    },
    companionDocuments: [
      { xmlPattern: "Ext/ClientApplicationInterface.xml", loadTarget: true },
      { xmlPattern: "Ext/MainSectionCommandInterface.xml", loadTarget: true },
    ],
    companionReferences: [{ yamlPath: ["ОсновнойЯзык"], include: "targetAssignment", loadTarget: true }],
  },
  externalFiles: [{ projectPattern: "МодульПриложения.bsl", loadTarget: true }],
})
registry.register(childFormPartialXmlPackagePolicy)
registry.register({
  assignment: {
    assignmentPattern: "Самостоятельный/{ownerName}/Свойства.yaml",
    loadDocumentRoles: ["metadata"],
  },
  externalFiles: [{ projectPattern: "Самостоятельный/{ownerName}/Модуль.bsl", loadTarget: true }],
})
const policies = registry.resolve(topology)

const root = "Конфигурация.yaml"
const rootModule = "МодульПриложения.bsl"
const language = "Язык/Русский.yaml"
const owner = "Объект/Товары/Свойства.yaml"
const manifestOwner = "ОбъектСМанифестом/Товары/Свойства.yaml"
const ownerHelp = "ОбъектСМанифестом/Товары/Справка/ru.html"
const ownerModule = "Объект/Товары/Команды/Проверочная.bsl"
const firstTemplateXml = "Объект/Товары/Макеты/Первый/Template.xml"
const firstTemplateText = "Объект/Товары/Макеты/Первый/Template.txt"
const secondTemplateXml = "Объект/Товары/Макеты/Второй/Template.xml"
const secondTemplateText = "Объект/Товары/Макеты/Второй/Template.txt"
const firstForm = "Объект/Товары/Формы/Первая/Форма.yaml"
const firstModule = "Объект/Товары/Формы/Первая/Модуль.bsl"
const firstBaseForm = "Объект/Товары/Формы/Первая/БазоваяФорма.yaml"
const firstQuery = "Объект/Товары/Формы/Первая/ДинамическийСписок/Список.query"
const secondForm = "Объект/Товары/Формы/Вторая/Форма.yaml"
const secondModule = "Объект/Товары/Формы/Вторая/Модуль.bsl"
const firstTable = "Объект/Товары/Таблицы/Первая/Свойства.yaml"
const secondTable = "Объект/Товары/Таблицы/Вторая/Свойства.yaml"
const secondTableModule = "Объект/Товары/Таблицы/Вторая/Команды/Проверочная.bsl"
const secondNestedTable = "Объект/Товары/Таблицы/Вторая/Вложения/Вложенная/Свойства.yaml"
const standalone = "Самостоятельный/Новый/Свойства.yaml"
const standaloneModule = "Самостоятельный/Новый/Модуль.bsl"

describe("partial XML impact planner", () => {
  it("загружает весь payload нового многодокументного задания", () => {
    const current = [root, standalone, standaloneModule]

    expect(plan(current, changes({ added: [standalone] })).loadTargets).toEqual([
      "Standalone/Новый.xml",
      "Standalone/Новый/Ext/Body.xml",
      "Standalone/Новый/Ext/Module.bsl",
      "Standalone/Новый/Ext/Optional.xml",
      "Standalone/Новый/Ext/Property.xml",
    ].sort(utf8))
    expect(plan(current, changes({ changed: [standalone] })).loadTargets).toEqual([
      "Standalone/Новый.xml",
    ])
  })

  it("при изменении конфигурации сохраняет корневые внешние файлы", () => {
    const result = plan(
      [root, rootModule, language],
      changes({ changed: [root] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, rootModule, language].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([rootModule])
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Ext/ManagedApplicationModule.bsl",
      "Languages/Русский.xml",
    ].sort(utf8))
  })

  it("выбирает metadata владельца при изменении его YAML", () => {
    expect(plan([root, language, owner], changes({ changed: [owner] }))).toMatchObject({
      selection: { kind: "selected", projectPaths: [owner] },
      loadTargets: ["Objects/Товары.xml"],
    })
    expect(documentPaths(plan([root, language, owner], changes({ changed: [owner] })))).toEqual([
      "Objects/Товары.xml",
    ])
  })

  it("добавляет внешние файлы, перечисленные в созданном XML-манифесте", () => {
    const result = plan([root, manifestOwner, ownerHelp], changes({ changed: [manifestOwner] }))

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [manifestOwner, ownerHelp].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([ownerHelp])
    expect(result.loadTargets).toEqual([
      "ManifestObjects/Товары.xml",
      "ManifestObjects/Товары/Ext/Help.xml",
    ].sort(utf8))
  })

  it("загружает изменённый внешний файл через его XML-манифест", () => {
    const result = plan([root, manifestOwner, ownerHelp], changes({ changed: [ownerHelp] }))

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [manifestOwner, ownerHelp].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([ownerHelp])
    expect(documentPaths(result)).toEqual(["ManifestObjects/Товары/Ext/Help.xml"])
    expect(result.loadTargets).toEqual(["ManifestObjects/Товары/Ext/Help.xml"])
  })

  it("загружает владельца, описатель и тело изменённой формы", () => {
    const result = plan([root, language, owner, firstForm], changes({ changed: [firstForm] }))

    expectFirstFormAssignment(result)
  })

  it.each(["changed", "added"] as const)("включает задание формы при %s её сохранённой основы", (kind) => {
    const result = plan(
      [root, language, owner, firstForm, firstBaseForm],
      changes({ [kind]: [firstBaseForm] }),
    )

    expectFirstFormAssignment(result)
  })

  it("включает задание формы при удалении сохранённой основы", () => {
    const result = plan(
      [root, language, owner, firstForm],
      changes({ deleted: [firstBaseForm] }),
    )

    expectFirstFormAssignment(result, false)
  })

  it.each(["changed", "added", "deleted"] as const)("включает задание формы при %s входа задания", (kind) => {
    const result = plan(
      kind === "deleted"
        ? [root, language, owner, firstForm]
        : [root, language, owner, firstForm, firstQuery],
      changes({ [kind]: [firstQuery] }),
    )

    expectFirstFormAssignment(result)
  })

  it.each(["changed", "added"] as const)("выбирает только %s модуль существующей формы", (kind) => {
    const result = plan([root, language, owner, firstForm, firstModule], changes({ [kind]: [firstModule] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstModule] })
    expect(result.externalProjectPaths).toEqual([firstModule])
    expect(result.loadTargets).toEqual(["Objects/Товары/Forms/Первая/Ext/Form/Module.bsl"])
  })

  it("при изменении файла внешнего объекта не расширяет пакет до владельца", () => {
    const result = plan(
      [root, language, owner, firstTemplateXml, firstTemplateText],
      changes({ changed: [firstTemplateText] }),
    )

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstTemplateText] })
    expect(result.externalProjectPaths).toEqual([firstTemplateText])
    expect(result.loadTargets).toEqual([
      "Objects/Товары/Templates/Первый/Ext/Template.txt",
    ])
  })

  it("при создании внешнего файлового объекта загружает владельца и передаёт всю коллекцию", () => {
    const result = plan(
      [
        root,
        language,
        owner,
        firstTemplateXml,
        firstTemplateText,
        secondTemplateXml,
        secondTemplateText,
      ],
      changes({ added: [secondTemplateXml, secondTemplateText] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [
        root,
        owner,
        firstTemplateXml,
        firstTemplateText,
        secondTemplateXml,
        secondTemplateText,
      ].sort(utf8),
    })
    expect(documentPaths(result)).toEqual(["Configuration.xml", "Objects/Товары.xml"])
    expect(result.externalProjectPaths).toEqual([
      firstTemplateXml,
      firstTemplateText,
      secondTemplateXml,
      secondTemplateText,
    ].sort(utf8))
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Objects/Товары.xml",
      "Objects/Товары/Templates/Второй.xml",
      "Objects/Товары/Templates/Второй/Ext/Template.txt",
    ].sort(utf8))
  })

  it("при удалении внешнего файлового объекта загружает владельца и оставшуюся коллекцию", () => {
    const result = plan(
      [root, language, owner, firstTemplateXml, firstTemplateText],
      changes({ deleted: [secondTemplateXml, secondTemplateText] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, firstTemplateXml, firstTemplateText].sort(utf8),
    })
    expect(documentPaths(result)).toEqual(["Configuration.xml", "Objects/Товары.xml"])
    expect(result.externalProjectPaths).toEqual([firstTemplateXml, firstTemplateText].sort(utf8))
    expect(result.loadTargets).toEqual(["Configuration.xml", "Objects/Товары.xml"])
  })

  it("при добавлении формы включает владельца и весь актуальный подкаталог, но загружает новую форму", () => {
    const result = plan(
      [root, language, owner, firstForm, firstModule, secondForm, secondModule],
      changes({ added: [secondForm] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, secondForm, secondModule, firstForm, firstModule].sort(utf8),
    })
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Objects/Товары.xml",
      "Objects/Товары/Forms/Вторая.xml",
      "Objects/Товары/Forms/Вторая/Ext/Form.xml",
      "Objects/Товары/Forms/Вторая/Ext/Form/Module.bsl",
    ].sort(utf8))
  })

  it("при добавлении формы сохраняет внешние файлы владельца", () => {
    const result = plan(
      [root, language, owner, ownerModule, firstForm],
      changes({ added: [firstForm] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, ownerModule, firstForm].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([ownerModule])
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Objects/Товары.xml",
      "Objects/Товары/Forms/Первая.xml",
      "Objects/Товары/Forms/Первая/Ext/Form.xml",
    ].sort(utf8))
  })

  it("при удалении внешнего файла принимает изменённое задание владельца", () => {
    const result = plan(
      [root, language, owner],
      changes({ changed: [owner], deleted: [ownerModule] }),
    )

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [owner] })
    expect(result.externalProjectPaths).toEqual([])
    expect(result.loadTargets).toEqual(["Objects/Товары.xml"])
  })

  it("при удалении формы включает владельца и оставшийся подкаталог, но загружает только владельца", () => {
    const result = plan(
      [root, language, owner, firstForm, firstModule],
      changes({ deleted: [secondForm, secondModule] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, firstForm, firstModule].sort(utf8),
    })
    expect(result.loadTargets).toEqual(["Configuration.xml", "Objects/Товары.xml"])
  })

  it.each([
    ["добавлении", "added", [], [], []],
    [
      "изменении",
      "changed",
      [secondNestedTable],
      [secondNestedTable],
      ["Objects/Товары/Tables/Вторая/Nested/Вложенная.xml"],
    ],
  ] as const)("при %s файлового дочернего объекта включает владельца и соседние объекты", (
    _title,
    kind,
    extraCurrent,
    extraExpected,
    extraLoadTargets,
  ) => {
    const result = plan(
      [root, language, owner, firstTable, secondTable, ...extraCurrent],
      changes({ [kind]: [secondTable] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, firstTable, secondTable, ...extraExpected].sort(utf8),
    })
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Objects/Товары.xml",
      "Objects/Товары/Tables/Вторая.xml",
      ...extraLoadTargets,
    ].sort(utf8))
  })

  it("при удалении файлового дочернего объекта включает владельца и оставшиеся объекты", () => {
    const result = plan(
      [root, language, owner, firstTable],
      changes({ deleted: [secondTable] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, firstTable].sort(utf8),
    })
    expect(result.loadTargets).toEqual(["Configuration.xml", "Objects/Товары.xml"].sort(utf8))
  })

  it("поглощает вложенные удаления удалённым файловым владельцем", () => {
    const result = plan(
      [root, language, owner, firstTable],
      changes({ deleted: [secondTable, secondTableModule, secondNestedTable] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, firstTable].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([])
    expect(result.loadTargets).toEqual(["Configuration.xml", "Objects/Товары.xml"].sort(utf8))
  })

  it("при изменении вложенного файлового объекта сохраняет внешние файлы его владельца", () => {
    const result = plan(
      [root, language, owner, secondTable, secondTableModule, secondNestedTable],
      changes({ changed: [secondNestedTable] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [root, owner, secondTable, secondTableModule, secondNestedTable].sort(utf8),
    })
    expect(result.externalProjectPaths).toEqual([secondTableModule])
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Objects/Товары.xml",
      "Objects/Товары/Tables/Вторая.xml",
      "Objects/Товары/Tables/Вторая/Nested/Вложенная.xml",
    ].sort(utf8))
  })

  it("при добавлении и удалении верхнего объекта включает корень и его явных спутников", () => {
    const added = plan([root, rootModule, language, owner], changes({ added: [owner] }))
    expect(added.selection).toEqual({
      kind: "selected",
      projectPaths: [root, rootModule, language, owner].sort(utf8),
    })
    expect(documentPaths(added)).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Languages/Русский.xml",
      "Objects/Товары.xml",
    ].sort(utf8))
    expect(added.loadTargets).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Ext/ManagedApplicationModule.bsl",
      "Languages/Русский.xml",
      "Objects/Товары.xml",
    ].sort(utf8))

    const deleted = plan([root, rootModule, language], changes({ deleted: [owner] }))
    expect(deleted.selection).toEqual({ kind: "selected", projectPaths: [root, rootModule, language].sort(utf8) })
    expect(deleted.loadTargets).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Ext/ManagedApplicationModule.bsl",
      "Languages/Русский.xml",
    ].sort(utf8))
  })

  it("объединяет удаление и добавление переименованного объекта", () => {
    const renamed = "Объект/НовыеТовары/Свойства.yaml"
    const result = plan([root, language, renamed], changes({ added: [renamed], deleted: [owner] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root, language, renamed].sort(utf8) })
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Languages/Русский.xml",
      "Objects/НовыеТовары.xml",
    ].sort(utf8))
  })

  it("поглощает дочерние удаления удалённым верхним объектом", () => {
    const result = plan([root, language], changes({ deleted: [owner, firstForm, firstModule] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root, language].sort(utf8) })
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Ext/MainSectionCommandInterface.xml",
      "Languages/Русский.xml",
    ].sort(utf8))
  })

  it("не расширяет пакет по обычной канонической ссылке", () => {
    const result = plan([root, language, owner], changes({ changed: [owner] }), {
      [owner]: [{ yamlPath: ["ОбычнаяСсылка"], canonical: "Language.Русский" }],
    })

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [owner] })
  })

  it("пропускает отсутствующую необязательную ссылку-спутник", () => {
    const optionalCompanion = {
      yamlPath: ["ОсновнойЯзык"],
      include: "targetAssignment",
      loadTarget: true,
      required: false,
    } as const
    const optionalRegistry = createPartialXmlPackagePolicyRegistry()
    optionalRegistry.register({
      assignment: {
        assignmentPattern: "Конфигурация.yaml",
        loadDocumentRoles: ["metadata"],
        companionReferences: [optionalCompanion],
      },
    })

    const result = buildPartialXmlImpactPlan({
      topology,
      currentResources: resources([root]),
      changes: changes({ changed: [root] }),
      policies: optionalRegistry.resolve(topology),
      referencesFor: () => [],
      resolveCanonicalTarget: () => undefined,
    })

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root] })
    expect(result.loadTargets).toEqual(["Configuration.xml"])
  })

  it("останавливает циклических спутников и устраняет повторы", () => {
    const cyclicRegistry = createPartialXmlPackagePolicyRegistry()
    cyclicRegistry.register({
      assignment: {
        assignmentPattern: "Конфигурация.yaml",
        loadDocumentRoles: ["metadata"],
        companionReferences: [{ yamlPath: ["ОсновнойЯзык"], include: "targetAssignment", loadTarget: true }],
      },
    })
    cyclicRegistry.register({
      assignment: {
        assignmentPattern: "Язык/{ownerName}.yaml",
        loadDocumentRoles: ["metadata"],
        companionReferences: [{ yamlPath: ["Корень"], include: "targetAssignment", loadTarget: true }],
      },
    })
    const result = buildPartialXmlImpactPlan({
      topology,
      currentResources: resources([root, language]),
      changes: changes({ changed: [root] }),
      policies: cyclicRegistry.resolve(topology),
      referencesFor: (path) => path === root
        ? [{ yamlPath: ["ОсновнойЯзык"], canonical: "Language.Русский" }]
        : [{ yamlPath: ["Корень"], canonical: "Configuration.Main" }],
      resolveCanonicalTarget: (canonical) => canonical === "Language.Русский" ? language : root,
    })

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root, language].sort(utf8) })
  })

  it("игнорирует объявленный путь и блокирует неклассифицированный", () => {
    expect(plan([root, language], changes({ changed: ["Служебное/state.bin"] })).selection)
      .toEqual({ kind: "selected", projectPaths: [] })
    expect(() => plan([root, language], changes({ changed: ["Неизвестно.bin"] })))
      .toThrow("не классифицирован")
  })

  it("блокирует опасный XML-путь и коллизию после подстановки", () => {
    const unsafeForm = "Объект/Товары/Формы/../Форма.yaml"
    expect(() => plan([root, language, owner, unsafeForm], changes({ changed: [unsafeForm] })))
      .toThrow("XML-путь должен быть нормализованным")

    expect(() => plan([root, language, owner, "Особый.yaml"], changes({
      changed: [owner, "Особый.yaml"],
    }))).toThrow("Повторный XML-путь Objects/Товары.xml")
  })
})

function plan(
  paths: readonly string[],
  value: PartialXmlChanges,
  references: Readonly<Record<string, readonly { yamlPath: readonly (string | number)[]; canonical: string }[]>> = {
    [root]: [{ yamlPath: ["ОсновнойЯзык"], canonical: "Language.Русский" }],
  },
) {
  return buildPartialXmlImpactPlan({
    topology,
    currentResources: resources(paths),
    changes: value,
    policies,
    referencesFor: (path) => references[path] ?? [],
    resolveCanonicalTarget: (canonical) => canonical === "Language.Русский" ? language : undefined,
  })
}

function expectFirstFormAssignment(result: PartialXmlImpactPlan, checkDocuments = true): void {
  const xmlPaths = [
    "Configuration.xml",
    "Objects/Товары.xml",
    "Objects/Товары/Forms/Первая.xml",
    "Objects/Товары/Forms/Первая/Ext/Form.xml",
  ]
  expect(result.selection).toEqual({
    kind: "selected",
    projectPaths: [root, owner, firstForm].sort(utf8),
  })
  if (checkDocuments) expect(documentPaths(result)).toEqual(xmlPaths)
  expect(result.loadTargets).toEqual(xmlPaths.sort(utf8))
}

function resources(paths: readonly string[]): MetadataProjectResourceMatch[] {
  return paths.map((projectPath) => {
    const match = classifyMetadataProjectPath(topology, projectPath)
    if (match === undefined || match.kind === "ignore") throw new Error(`Нет текущего ресурса ${projectPath}`)
    return match
  })
}

function changes(params: {
  readonly added?: readonly string[]
  readonly changed?: readonly string[]
  readonly deleted?: readonly string[]
}): PartialXmlChanges {
  return {
    added: (params.added ?? []).map(file),
    changed: (params.changed ?? []).map((path) => ({ current: file(path), previous: file(path) })),
    deleted: (params.deleted ?? []).map(file),
  }
}

function file(projectPath: string): PartialXmlFileVersion {
  return { projectPath, contentHash: 1n }
}

function documentPaths(result: ReturnType<typeof buildPartialXmlImpactPlan>): string[] {
  if (result.selection.kind !== "selected") throw new Error("Частичный план вернул полную выборку")
  const byId = new Map(topology.assignments.flatMap((assignment) =>
    assignment.xmlDocuments.map((document) => [document.id, document] as const)
  ))
  const valuesByPath = new Map(resources(result.selection.projectPaths).map((resource) => [resource.projectPath, resource.values]))
  return [...result.assignmentDocumentIds].flatMap(([projectPath, ids]) => [...ids].map((id) => {
    const document = byId.get(id)!
    let xmlPath = document.xmlPattern
    for (const [key, value] of Object.entries(valuesByPath.get(projectPath) ?? {})) {
      xmlPath = xmlPath.replaceAll(`{${key}}`, value)
    }
    return xmlPath
  })).sort(utf8)
}

function content(
  projectPattern: string,
  role: "configuration" | "properties" | "fileItem",
  itemRule: MetadataItemRule,
  compositionImpact: "none" | "configurationComposition",
) {
  return {
    kind: "content" as const,
    projectPattern,
    role,
    required: true,
    repeatable: role !== "configuration",
    compositionImpact,
    itemRule,
    source,
  }
}

function document(
  assignmentProjectPattern: string,
  xmlPattern: string,
  role: "metadata" | "body" | "property",
  required: boolean,
) {
  return {
    kind: "xmlDocument" as const,
    assignmentProjectPattern,
    xmlPattern,
    role,
    required,
    prepareCapabilityId: "test",
    source,
  }
}

function utf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
