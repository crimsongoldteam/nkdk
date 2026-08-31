import {
  createConfigurationIndexCollector,
  parseXmlDocumentWithSaxes,
  type XmlImportConfigurationContext,
} from "@nkdk/runtime"
import fs from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { mockXmlImportContext } from "../../tests/mockContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { createMetadataItemProjectSchemaExporter } from "../projectDefinition/projectSpecHelpers"
import type { ValidationProjectFile } from "../validation/projectFiles"
import { prepareImportFacts } from "./prepareFacts"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import {
  extractImportValidationContribution,
  extractImportValidationContributionFromFacts,
} from "./validationContribution"

const configurationFixturesDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const metadataPath = join(configurationFixturesDir, "syncConfiguration/xml/Catalogs/Контрагенты.xml")
const commonFormFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCommonForm/__fixtures__/sync/xml")
const extensionFixtureDir = join(import.meta.dirname, "__fixtures__/configurationExtension")

describe("prepareImportFacts", () => {
  it("даёт тот же configuration и dependency вклад без assignment-level YAML", async () => {
    const assignment = catalogAssignment()
    const { facts, legacy, legacyCollector } = await preparePair(assignment, mockXmlImportContext())
    const file = validationFile(assignment.targetProjectPath)

    expect(facts.configurationFragment).toEqual(legacyCollector.fragment(assignment.targetProjectPath))
    expect(facts.localIndexes).toEqual(legacy.localIndexes)
    expect(facts.generatedFiles).toEqual(legacy.generatedFiles)
    expect(extractImportValidationContributionFromFacts({
      prepared: facts,
      projectDir: "/project",
      file,
    })).toEqual(extractImportValidationContribution({
      prepared: legacy,
      projectDir: "/project",
      file,
    }))
    expect(facts).not.toHaveProperty("yaml")
    expect(facts).not.toHaveProperty("annotations")
    expect(facts).not.toHaveProperty("proofAudit")
  })

  it.each([
    ["корень конфигурации", () => configurationAssignment(
      join(extensionFixtureDir, "Configuration.xml"),
      "configuration",
    ), () => mockXmlImportContext()],
    ["внешнее XML-свойство", () => assignmentForProjectPath({
      id: "common-form",
      targetProjectPath: "ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml",
      itemType: "MetadataCommonForm",
      itemName: "КонстантаВсеСвойства",
      logicalAddress: "ОбщаяФорма.КонстантаВсеСвойства",
      owner: undefined,
      xmlFiles: [
        { role: "metadata", sourcePath: join(commonFormFixtureDir, "КонстантаВсеСвойства.xml") },
        { role: "property", sourcePath: join(commonFormFixtureDir, "КонстантаВсеСвойства/Ext/Form.xml") },
      ],
    }), () => mockXmlImportContext()],
    ["управляемая форма", managedFormAssignment, () => extensionContext()],
    ["корень расширения", () => configurationAssignment(
      join(extensionFixtureDir, "Configuration.xml"),
      "configuration-extension",
    ), () => extensionContext()],
  ] as const)("сохраняет эквивалентные факты: %s", async (_name, createAssignment, createContext) => {
    const assignment = createAssignment()
    const context = createContext()
    const { facts, legacy, legacyCollector } = await preparePair(assignment, context)

    expect(facts.configurationFragment).toEqual(legacyCollector.fragment(assignment.targetProjectPath))
    expect(withoutFormDataPath(facts.localIndexes)).toEqual(withoutFormDataPath(legacy.localIndexes))
    expect(facts.generatedFiles).toEqual(legacy.generatedFiles)
  })

  it("строит адресуемые объекты и logicalAddress напрямую из фактов", async () => {
    const assignment = assignmentForProjectPath({
      id: "catalog-with-children",
      targetProjectPath: "Справочник/СправочникCоВсемиОбъектами/Свойства.yaml",
      itemType: "MetadataCatalog",
      itemName: "СправочникCоВсемиОбъектами",
      logicalAddress: "Справочник.СправочникCоВсемиОбъектами",
      owner: undefined,
      xmlFiles: [{
        role: "metadata",
        sourcePath: join(
          import.meta.dirname,
          "../appliedObjects/metadataCatalog/__fixtures__/sync/xml/СправочникCоВсемиОбъектами.xml",
        ),
      }],
    })
    const { facts, legacy } = await preparePair(assignment, mockXmlImportContext())
    const file = validationFileForAssignment(assignment)
    const expected = extractImportValidationContribution({ prepared: legacy, projectDir: "/project", file })
    const actual = extractImportValidationContributionFromFacts({ prepared: facts, projectDir: "/project", file })

    expect(expected.validationContribution.logicalAddresses.length).toBeGreaterThan(0)
    expect(actual).toEqual(expected)
  })

  it("не требует таблицу YAML-аннотаций для временной проекции фактов", async () => {
    const assignment = catalogAssignment()
    const xml = fs.readFileSync(metadataPath, "utf8").replace("<v8:lang>ru</v8:lang>", "<v8:lang>xx</v8:lang>")

    await expect(prepareImportFacts({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
      inputs: [{
        input: assignment.xmlFiles[0]!,
        document: parseXmlDocumentWithSaxes(xml, { preserveXsiNil: true }),
      }],
    })).resolves.toMatchObject({ targetProjectPath: assignment.targetProjectPath })
  })
})

function catalogAssignment(): ImportAssignment {
  const targetProjectPath = "Справочник/Контрагенты/Свойства.yaml"
  const match = classifyMetadataProjectPath(compileRegisteredMetadataResourceTopology(), targetProjectPath)
  if (match?.assignment === undefined) throw new Error(`Не найден topology-адрес: ${targetProjectPath}`)
  return {
    id: "catalog",
    topologyAddress: { nodeId: match.assignment.id, values: match.values },
    role: "properties",
    targetProjectPath,
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
    externalFiles: [],
  }
}

function configurationAssignment(
  sourcePath: string,
  id: string,
): ImportAssignment {
  return {
    id,
    topologyAddress: { nodeId: id, values: {} },
    role: "configuration",
    targetProjectPath: "Конфигурация.yaml",
    itemType: "MetadataConfiguration",
    itemName: "",
    logicalAddress: "Конфигурация",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}

function assignmentForProjectPath(params: {
  id: string
  targetProjectPath: string
  itemType: string
  itemName: string
  logicalAddress: string
  owner: ImportAssignment["owner"]
  xmlFiles: ImportAssignment["xmlFiles"]
}): ImportAssignment {
  const match = classifyMetadataProjectPath(
    compileRegisteredMetadataResourceTopology(),
    params.targetProjectPath,
  )
  if (match?.assignment === undefined) throw new Error(`Не найден topology-адрес: ${params.targetProjectPath}`)
  return {
    ...params,
    topologyAddress: { nodeId: match.assignment.id, values: match.values },
    role: params.itemType === "ClientApplicationForm" ? "fileItem" : "properties",
    externalFiles: [],
  }
}

function managedFormAssignment(): ImportAssignment {
  const formRoot = join(extensionFixtureDir, "Catalogs/СправочникПолный/Forms/ФормаОтчета")
  return assignmentForProjectPath({
    id: "form",
    targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
    itemType: "ClientApplicationForm",
    itemName: "ФормаОтчета",
    logicalAddress: "Справочник.СправочникПолный.Форма.ФормаОтчета",
    owner: {
      itemType: "MetadataCatalog",
      name: "СправочникПолный",
      logicalAddress: "Справочник.СправочникПолный",
    },
    xmlFiles: [
      { role: "metadata", sourcePath: `${formRoot}.xml` },
      { role: "body", sourcePath: join(formRoot, "Ext/Form.xml") },
    ],
  })
}

async function preparePair(
  assignment: ImportAssignment,
  context: XmlImportConfigurationContext,
) {
  const legacyCollector = createConfigurationIndexCollector()
  const legacy = await prepareImportYaml({
    assignment,
    context,
    collector: legacyCollector,
    proofDetail: "roots",
  })
  const factsCollector = createConfigurationIndexCollector()
  const facts = await prepareImportFacts({
    assignment,
    context,
    collector: factsCollector,
    inputs: parseAssignmentInputs(assignment),
  })
  return { facts, factsCollector, legacy, legacyCollector }
}

function parseAssignmentInputs(assignment: ImportAssignment) {
  return assignment.xmlFiles.map((input) => ({
    input,
    document: parseXmlDocumentWithSaxes(fs.readFileSync(input.sourcePath, "utf8"), {
      preserveXsiNil: true,
      preserveEmptyElementNames: ["AdditionalFields"],
    }),
  }))
}

function extensionContext() {
  const context = mockXmlImportContext()
  return {
    ...context,
    fromXML: { ...context.fromXML, componentKind: "configurationExtension" as const },
  }
}

function withoutFormDataPath(indexes: Awaited<ReturnType<typeof prepareImportFacts>>["localIndexes"]) {
  const { formDataPathIndex: _formDataPathIndex, ...metadata } = indexes.metadata
  return { metadata }
}

function validationFile(projectPath: string): ValidationProjectFile {
  return {
    componentPath: "cf",
    componentDir: "/project",
    rootProjectPath: `cf/${projectPath}`,
    absolutePath: `/project/${projectPath}`,
    projectPath,
    kind: "properties",
    topologyNodeId: "catalog",
    itemType: MetadataCatalogRules.itemType,
    owner: {
      dir: "Справочник",
      name: "Контрагенты",
      spec: {
        dir: "Справочник",
        kind: "metadataItem",
        rule: MetadataCatalogRules,
        exportSchema: createMetadataItemProjectSchemaExporter(MetadataCatalogRules),
      },
    },
    itemRule: MetadataCatalogRules,
    metadataTarget: {
      canonical: "Catalog.Контрагенты",
      owner: { root: "Catalog", objectName: "Контрагенты" },
    },
    logicalAddress: "Справочник.Контрагенты",
  }
}

function validationFileForAssignment(assignment: ImportAssignment): ValidationProjectFile {
  const base = validationFile(assignment.targetProjectPath)
  return {
    ...base,
    owner: { ...base.owner, name: assignment.itemName },
    metadataTarget: {
      canonical: `Catalog.${assignment.itemName}`,
      owner: { root: "Catalog", objectName: assignment.itemName },
    },
    logicalAddress: assignment.logicalAddress,
  }
}
