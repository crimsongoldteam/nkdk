import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { classifyMetadataProjectPath, type MetadataProjectResourceMatch } from "../resourceTopology/core/projectProjection"
import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"
import { createPartialXmlPackagePolicyRegistry } from "./packagePolicy"
import { buildPartialXmlImpactPlan } from "./impactPlanner"
import type { PartialXmlChanges, PartialXmlFileVersion } from "./types"
import { childFormPartialXmlPackagePolicy } from "../forms/clientApplicationForm/partialXmlPackage"

const source = { kind: "itemRule" as const, description: "test" }
const configurationRule = { itemType: "Configuration", properties: {} } as MetadataItemRule
const languageRule = { itemType: "Language", properties: {} } as MetadataItemRule
const objectRule = {
  itemType: "TestObject",
  properties: {},
  metadataTargetOwner: { kind: "self", root: "Catalog" },
} as MetadataItemRule
const formRule = { itemType: "TestForm", properties: {} } as MetadataItemRule

const topology = compileMetadataResourceTopology([{
  resources: [
    content("Конфигурация.yaml", "configuration", configurationRule, "none"),
    document("", "Configuration.xml", "metadata", true),
    document("", "Ext/ClientApplicationInterface.xml", "property", false),
    content("Язык/{ownerName}/Свойства.yaml", "properties", languageRule, "configurationComposition"),
    document("", "Languages/{ownerName}.xml", "metadata", true),
    content("Объект/{ownerName}/Свойства.yaml", "properties", objectRule, "configurationComposition"),
    document("", "Objects/{ownerName}.xml", "metadata", true),
    content("Особый.yaml", "properties", objectRule, "none"),
    document("", "Objects/Товары.xml", "metadata", true),
    {
      ...content(
        "Объект/{ownerName}/Формы/{itemName}/Форма.yaml",
        "fileItem",
        formRule,
        "none",
      ),
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
      kind: "externalFile" as const,
      assignmentProjectPattern: "",
      projectPattern: "Объект/{ownerName}/Формы/{itemName}/Модуль.bsl",
      xmlPattern: "Objects/{ownerName}/Forms/{itemName}/Ext/Form/Module.bsl",
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
    companionDocuments: [{ xmlPattern: "Ext/ClientApplicationInterface.xml", loadTarget: false }],
    companionReferences: [{ yamlPath: ["ОсновнойЯзык"], include: "targetAssignment", loadTarget: true }],
  },
})
registry.register(childFormPartialXmlPackagePolicy)
const policies = registry.resolve(topology)

const root = "Конфигурация.yaml"
const language = "Язык/Русский/Свойства.yaml"
const owner = "Объект/Товары/Свойства.yaml"
const firstForm = "Объект/Товары/Формы/Первая/Форма.yaml"
const firstModule = "Объект/Товары/Формы/Первая/Модуль.bsl"
const firstBaseForm = "Объект/Товары/Формы/Первая/БазоваяФорма.yaml"
const secondForm = "Объект/Товары/Формы/Вторая/Форма.yaml"
const secondModule = "Объект/Товары/Формы/Вторая/Модуль.bsl"

describe("partial XML impact planner", () => {
  it("выбирает metadata владельца при изменении его YAML", () => {
    expect(plan([root, language, owner], changes({ changed: [owner] }))).toMatchObject({
      selection: { kind: "selected", projectPaths: [owner] },
      loadTargets: ["Objects/Товары.xml"],
    })
    expect(documentPaths(plan([root, language, owner], changes({ changed: [owner] })))).toEqual([
      "Objects/Товары.xml",
    ])
  })

  it("разделяет payload и load target формы", () => {
    const result = plan([root, language, owner, firstForm], changes({ changed: [firstForm] }))

    expect(documentPaths(result)).toEqual([
      "Objects/Товары/Forms/Первая.xml",
      "Objects/Товары/Forms/Первая/Ext/Form.xml",
    ])
    expect(result.loadTargets).toEqual(["Objects/Товары/Forms/Первая.xml"])
  })

  it.each(["changed", "added"] as const)("включает задание формы при %s её сохранённой основы", (kind) => {
    const result = plan(
      [root, language, owner, firstForm, firstBaseForm],
      changes({ [kind]: [firstBaseForm] }),
    )

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstForm] })
    expect(documentPaths(result)).toEqual([
      "Objects/Товары/Forms/Первая.xml",
      "Objects/Товары/Forms/Первая/Ext/Form.xml",
    ])
  })

  it("включает задание формы при удалении сохранённой основы", () => {
    const result = plan(
      [root, language, owner, firstForm],
      changes({ deleted: [firstBaseForm] }),
    )

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstForm] })
  })

  it("выбирает только изменённый модуль и загружает его", () => {
    const result = plan([root, language, owner, firstForm, firstModule], changes({ changed: [firstModule] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstModule] })
    expect(result.externalProjectPaths).toEqual([firstModule])
    expect(result.loadTargets).toEqual(["Objects/Товары/Forms/Первая/Ext/Form/Module.bsl"])
  })

  it("при добавлении формы включает владельца и весь актуальный подкаталог, но загружает новую форму", () => {
    const result = plan(
      [root, language, owner, firstForm, firstModule, secondForm, secondModule],
      changes({ added: [secondForm] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [owner, secondForm, secondModule, firstForm, firstModule].sort(utf8),
    })
    expect(result.loadTargets).toEqual([
      "Objects/Товары.xml",
      "Objects/Товары/Forms/Вторая.xml",
    ].sort(utf8))
  })

  it("при удалении формы включает владельца и оставшийся подкаталог, но загружает только владельца", () => {
    const result = plan(
      [root, language, owner, firstForm, firstModule],
      changes({ deleted: [secondForm, secondModule] }),
    )

    expect(result.selection).toEqual({
      kind: "selected",
      projectPaths: [owner, firstForm, firstModule].sort(utf8),
    })
    expect(result.loadTargets).toEqual(["Objects/Товары.xml"])
  })

  it("при добавлении и удалении верхнего объекта включает корень и его явных спутников", () => {
    const added = plan([root, language, owner], changes({ added: [owner] }))
    expect(added.selection).toEqual({
      kind: "selected",
      projectPaths: [root, language, owner].sort(utf8),
    })
    expect(documentPaths(added)).toEqual([
      "Configuration.xml",
      "Ext/ClientApplicationInterface.xml",
      "Languages/Русский.xml",
      "Objects/Товары.xml",
    ].sort(utf8))
    expect(added.loadTargets).toEqual([
      "Configuration.xml",
      "Languages/Русский.xml",
      "Objects/Товары.xml",
    ].sort(utf8))

    const deleted = plan([root, language], changes({ deleted: [owner] }))
    expect(deleted.selection).toEqual({ kind: "selected", projectPaths: [root, language].sort(utf8) })
    expect(deleted.loadTargets).toEqual(["Configuration.xml", "Languages/Русский.xml"].sort(utf8))
  })

  it("объединяет удаление и добавление переименованного объекта", () => {
    const renamed = "Объект/НовыеТовары/Свойства.yaml"
    const result = plan([root, language, renamed], changes({ added: [renamed], deleted: [owner] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root, language, renamed].sort(utf8) })
    expect(result.loadTargets).toEqual([
      "Configuration.xml",
      "Languages/Русский.xml",
      "Objects/НовыеТовары.xml",
    ].sort(utf8))
  })

  it("поглощает дочерние удаления удалённым верхним объектом", () => {
    const result = plan([root, language], changes({ deleted: [owner, firstForm, firstModule] }))

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [root, language].sort(utf8) })
    expect(result.loadTargets).toEqual(["Configuration.xml", "Languages/Русский.xml"].sort(utf8))
  })

  it("не расширяет пакет по обычной канонической ссылке", () => {
    const result = plan([root, language, owner], changes({ changed: [owner] }), {
      [owner]: [{ yamlPath: ["ОбычнаяСсылка"], canonical: "Language.Русский" }],
    })

    expect(result.selection).toEqual({ kind: "selected", projectPaths: [owner] })
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
        assignmentPattern: "Язык/{ownerName}/Свойства.yaml",
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
