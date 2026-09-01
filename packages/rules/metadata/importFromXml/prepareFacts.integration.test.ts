import {
  createConfigurationIndexCollector,
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  serializeYAMLDocument,
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
import { createValidationProjectAssignmentFileProjector } from "../validation/projectFiles"
import { createValidationProjectComponent } from "../validation/projectComponents"
import { extractProjectValidationFileFacts } from "../validation/projectValidationPasses"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
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
const fullCatalogFixture = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const e2eAllExtensionDir = join(import.meta.dirname, "../../../../e2e/fixtures/xml/cfe/all-extension")
const e2eConfigurationDir = join(import.meta.dirname, "../../../../e2e/fixtures/xml/cf")

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
    ["внешнее XML-свойство", commonFormAssignment, () => mockXmlImportContext()],
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

  it("сохраняет производные таблицы регистра в validation-вкладе", async () => {
    await expectProjectedValidationPair(accountingRegisterAssignment())
  })

  it("сохраняет производные поля регистра расчёта в validation-вкладе", async () => {
    await expectProjectedValidationPair(calculationRegisterAssignment())
  })

  it("сохраняет исходный порядок таблиц внешнего источника данных в configuration index", async () => {
    const assignment = externalDataSourceAssignment()
    const { facts, legacyCollector } = await preparePair(assignment, mockXmlImportContext())

    expect(facts.configurationFragment).toEqual(legacyCollector.fragment(assignment.targetProjectPath))
    expect(facts.configurationFragment.entities).toContainEqual(expect.objectContaining({
      logicalAddress: "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Свойство.Таблицы",
      children: [
        { xmlName: "Table", name: "ТаблицаВсеСвойства" },
        { xmlName: "Table", name: "ТаблицаПоУмолчанию" },
        { xmlName: "Table", name: "ТаблицаМодульНабора" },
      ],
    }))
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

  it("сохраняет проверку ПутьКДанным формы без assignment-level YAML", async () => {
    const assignment = invalidDataPathFormAssignment()
    const facts = await prepareImportFacts({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
      inputs: parseAssignmentInputs(assignment),
    })

    expect(facts.formValidation?.pendingChecks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "dataPath",
        yamlPath: ["Элементы", "ПолеВвода1", "ПутьКДанным"],
        value: "Реквизит",
      }),
    ]))
    expect(facts).not.toHaveProperty("yaml")
  })

  it("строит индекс путей формы напрямую из принятых фактов", async () => {
    const assignment = managedFormAssignment()
    const { facts, legacy } = await preparePair(assignment, extensionContext())

    expect(formDataPathSnapshot(facts.formValidation?.index)).toEqual(
      formDataPathSnapshot(legacy.localIndexes.metadata.formDataPathIndex),
    )
    expect(formDataPathSnapshot(facts.localIndexes.metadata.formDataPathIndex)).toEqual(
      formDataPathSnapshot(legacy.localIndexes.metadata.formDataPathIndex),
    )
  })

  it("не применяет standalone-проверки клиентской формы к MetadataCommonForm", async () => {
    const assignment = commonFormAssignment()
    const { facts, legacy } = await preparePair(assignment, mockXmlImportContext())
    const component = createValidationProjectComponent("/project", { kind: "configuration" })
    const file = createValidationProjectAssignmentFileProjector("/project", component)({
      projectPath: assignment.targetProjectPath,
      topologyAddress: assignment.topologyAddress,
    })
    if (file === undefined) throw new Error("Не найден validation-файл общей формы")

    expect(formDataPathSnapshot(facts.localIndexes.metadata.formDataPathIndex)).toEqual(
      formDataPathSnapshot(legacy.localIndexes.metadata.formDataPathIndex),
    )
    expect(extractImportValidationContributionFromFacts({
      prepared: facts,
      projectDir: "/project",
      file,
    })).toEqual(extractImportValidationContribution({
      prepared: legacy,
      projectDir: "/project",
      file,
    }))
    expect(facts.formValidation).toBeUndefined()
  })

  it("сохраняет validation-вклад общей формы расширения", async () => {
    const assignment = extensionCommonFormAssignment()
    const { facts, legacy } = await preparePair(assignment, extensionContext())
    const component = createValidationProjectComponent("/project", {
      kind: "configurationExtension",
      name: "Расширение_All",
    })
    const file = createValidationProjectAssignmentFileProjector("/project", component)({
      projectPath: assignment.targetProjectPath,
      topologyAddress: assignment.topologyAddress,
    })
    if (file === undefined) throw new Error("Не найден validation-файл общей формы расширения")

    expect(extractImportValidationContributionFromFacts({
      prepared: facts,
      projectDir: "/project",
      file,
    })).toEqual(extractImportValidationContribution({
      prepared: legacy,
      projectDir: "/project",
      file,
    }))
  })

  it("сохраняет validation-вклад ссылок динамического списка", async () => {
    await expectProjectedValidationPair(dynamicListCommonFormAssignment())
  })

  it.each([
    ["куб внешнего источника данных", externalDataSourceCubeAssignment],
    ["функциональная опция", functionalOptionAssignment],
    ["форма варианта отчёта", reportVariantFormAssignment],
  ] as const)("сохраняет полный validation-вклад e2e: %s", async (_name, createAssignment) => {
    const assignment = createAssignment()
    const { actual } = await expectProjectedValidationPair(assignment)
    if (_name === "куб внешнего источника данных") {
      expect(actual.validationContribution.objectRecords).toContainEqual(expect.objectContaining({
        ownerRef: {
          kind: "ВнешнийИсточникДанныхКуб",
          name: "ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства",
        },
      }))
      expect([...actual.validationContribution.objectRecords[0]!.fieldIndex!.fields.keys()])
        .toEqual(expect.arrayContaining(["ИзмерениеВсеСвойства", "РесурсВсеСвойства"]))
      expect(actual.validationContribution.memberIndexEntries.map(({ canonical }) => canonical))
        .toEqual(expect.arrayContaining([
          "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Command.Команда1",
          "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Dimension.ИзмерениеВсеСвойства",
          "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Resource.РесурсВсеСвойства",
        ]))
    }
  })

  it("не отправляет translateOnly-ссылку вложенного стандартного реквизита на проверку", async () => {
    const assignment = assignmentForProjectPath({
      id: "catalog-with-characteristics",
      targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
      itemType: "MetadataCatalog",
      itemName: "СправочникПолный",
      logicalAddress: "Справочник.СправочникПолный",
      owner: undefined,
      xmlFiles: [{ role: "metadata", sourcePath: fullCatalogFixture }],
    })
    const { facts, legacy } = await preparePair(assignment, mockXmlImportContext())
    const file = validationFileForAssignment(assignment)
    const text = serializeYAMLDocument(legacy.yaml).text
    const expected = extractProjectValidationFileFacts({
      projectDir: "/project",
      file,
      entry: { filePath: file.absolutePath, text, parsed: parseMetadataYaml(text) },
      rulesSnapshot: createValidationRulesSnapshot(mockXmlImportContext()),
      validationDiagnostics: false,
    })
    const actual = extractImportValidationContributionFromFacts({ prepared: facts, projectDir: "/project", file })
    expect(expected.pendingReferences).not.toContainEqual(
      expect.objectContaining({ constraint: expect.objectContaining({ validation: "translateOnly" }) }),
    )
    expect(actual.validationContribution.pendingReferences).not.toContainEqual(
      expect.objectContaining({ constraint: expect.objectContaining({ validation: "translateOnly" }) }),
    )
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

function invalidDataPathFormAssignment(): ImportAssignment {
  const formRoot = join(
    configurationFixturesDir,
    "syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента",
  )
  return assignmentForProjectPath({
    id: "invalid-data-path-form",
    targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
    owner: {
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    },
    xmlFiles: [
      { role: "metadata", sourcePath: `${formRoot}.xml` },
      { role: "body", sourcePath: join(formRoot, "Ext/Form.xml") },
    ],
  })
}

function commonFormAssignment(): ImportAssignment {
  return assignmentForProjectPath({
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
  })
}

function accountingRegisterAssignment(): ImportAssignment {
  return assignmentForProjectPath({
    id: "accounting-register",
    targetProjectPath: "РегистрБухгалтерии/РегистрБухгалтерииВсеСвойстваОбороты/Свойства.yaml",
    itemType: "MetadataAccountingRegister",
    itemName: "РегистрБухгалтерииВсеСвойстваОбороты",
    logicalAddress: "РегистрБухгалтерии.РегистрБухгалтерииВсеСвойстваОбороты",
    owner: undefined,
    xmlFiles: [{
      role: "metadata",
      sourcePath: join(
        e2eConfigurationDir,
        "AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml",
      ),
    }],
  })
}

function calculationRegisterAssignment(): ImportAssignment {
  return assignmentForProjectPath({
    id: "calculation-register",
    targetProjectPath: "РегистрРасчета/РегистрРасчетаВсеСвойства/Свойства.yaml",
    itemType: "MetadataCalculationRegister",
    itemName: "РегистрРасчетаВсеСвойства",
    logicalAddress: "РегистрРасчета.РегистрРасчетаВсеСвойства",
    owner: undefined,
    xmlFiles: [{
      role: "metadata",
      sourcePath: join(e2eConfigurationDir, "CalculationRegisters/РегистрРасчетаВсеСвойства.xml"),
    }],
  })
}

function externalDataSourceCubeAssignment(): ImportAssignment {
  const ownerName = "ВнешнийИсточникДанныхВсеСвойства"
  const itemName = "КубВсеСвойства"
  return assignmentForProjectPath({
    id: "external-data-source-cube",
    targetProjectPath: `ВнешнийИсточникДанных/${ownerName}/Кубы/${itemName}/Свойства.yaml`,
    itemType: "MetadataExternalDataSourceCube",
    itemName,
    logicalAddress: `ВнешнийИсточникДанных.${ownerName}.Куб.${itemName}`,
    owner: {
      itemType: "MetadataExternalDataSource",
      name: ownerName,
      logicalAddress: `ВнешнийИсточникДанных.${ownerName}`,
    },
    xmlFiles: [{
      role: "metadata",
      sourcePath: join(
        e2eConfigurationDir,
        `ExternalDataSources/${ownerName}/Cubes/${itemName}.xml`,
      ),
    }],
  })
}

function externalDataSourceAssignment(): ImportAssignment {
  const itemName = "ВнешнийИсточникДанныхВсеСвойства"
  return assignmentForProjectPath({
    id: "external-data-source",
    targetProjectPath: `ВнешнийИсточникДанных/${itemName}/Свойства.yaml`,
    itemType: "MetadataExternalDataSource",
    itemName,
    logicalAddress: `ВнешнийИсточникДанных.${itemName}`,
    owner: undefined,
    xmlFiles: [{
      role: "metadata",
      sourcePath: join(e2eConfigurationDir, `ExternalDataSources/${itemName}.xml`),
    }],
  })
}

function functionalOptionAssignment(): ImportAssignment {
  const itemName = "ФункциональнаяОпцияВсеСвойства"
  return assignmentForProjectPath({
    id: "functional-option",
    targetProjectPath: `ФункциональнаяОпция/${itemName}.yaml`,
    itemType: "MetadataFunctionalOption",
    itemName,
    logicalAddress: `ФункциональнаяОпция.${itemName}`,
    owner: undefined,
    xmlFiles: [{
      role: "metadata",
      sourcePath: join(e2eConfigurationDir, `FunctionalOptions/${itemName}.xml`),
    }],
  })
}

function reportVariantFormAssignment(): ImportAssignment {
  const ownerName = "ОтчетВсеСвойства"
  const itemName = "ФормаВарианта"
  const formRoot = join(e2eConfigurationDir, `Reports/${ownerName}/Forms/${itemName}`)
  return assignmentForProjectPath({
    id: "report-variant-form",
    targetProjectPath: `Отчет/${ownerName}/Формы/${itemName}/Форма.yaml`,
    itemType: "ClientApplicationForm",
    itemName,
    logicalAddress: `Отчет.${ownerName}.Форма.${itemName}`,
    owner: {
      itemType: "MetadataReport",
      name: ownerName,
      logicalAddress: `Отчет.${ownerName}`,
    },
    xmlFiles: [
      { role: "metadata", sourcePath: `${formRoot}.xml` },
      { role: "body", sourcePath: join(formRoot, "Ext/Form.xml") },
    ],
  })
}

function extensionCommonFormAssignment(): ImportAssignment {
  return assignmentForProjectPath({
    id: "extension-common-form",
    targetProjectPath: "ОбщаяФорма/InputField/Свойства.yaml",
    itemType: "MetadataCommonForm",
    itemName: "InputField",
    logicalAddress: "ОбщаяФорма.InputField",
    owner: undefined,
    xmlFiles: [
      { role: "metadata", sourcePath: join(e2eAllExtensionDir, "CommonForms/InputField.xml") },
      { role: "property", sourcePath: join(e2eAllExtensionDir, "CommonForms/InputField/Ext/Form.xml") },
    ],
  })
}

function dynamicListCommonFormAssignment(): ImportAssignment {
  const root = join(e2eConfigurationDir, "CommonForms/ДинамическийСписокОсновнаяТаблица")
  return assignmentForProjectPath({
    id: "dynamic-list-common-form",
    targetProjectPath: "ОбщаяФорма/ДинамическийСписокОсновнаяТаблица/Свойства.yaml",
    itemType: "MetadataCommonForm",
    itemName: "ДинамическийСписокОсновнаяТаблица",
    logicalAddress: "ОбщаяФорма.ДинамическийСписокОсновнаяТаблица",
    owner: undefined,
    xmlFiles: [
      { role: "metadata", sourcePath: `${root}.xml` },
      { role: "property", sourcePath: join(root, "Ext/Form.xml") },
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

async function expectProjectedValidationPair(
  assignment: ImportAssignment,
  context: XmlImportConfigurationContext = mockXmlImportContext(),
  address: { kind: "configuration" } | { kind: "configurationExtension"; name: string } = {
    kind: "configuration",
  },
) {
  const { facts, legacy } = await preparePair(assignment, context)
  const file = projectedValidationFile(assignment, address)
  const actual = extractImportValidationContributionFromFacts({ prepared: facts, projectDir: "/project", file })
  const expected = extractImportValidationContribution({ prepared: legacy, projectDir: "/project", file })
  expect(actual).toEqual(expected)
  return { actual, facts, legacy }
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

function formDataPathSnapshot(
  index: Awaited<ReturnType<typeof prepareImportFacts>>["localIndexes"]["metadata"]["formDataPathIndex"],
) {
  if (index === undefined) return undefined
  return {
    roots: [...index.roots],
    additionalColumnsByTablePath: [...index.additionalColumnsByTablePath].map(([path, columns]) => [
      path,
      [...columns],
    ]),
    tabularElementsByName: [...index.tabularElementsByName],
    dialect: index.dialect,
    duplicateDiagnostics: index.duplicateDiagnostics,
  }
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

function projectedValidationFile(
  assignment: ImportAssignment,
  address: { kind: "configuration" } | { kind: "configurationExtension"; name: string },
): ValidationProjectFile {
  const component = createValidationProjectComponent("/project", address)
  const file = createValidationProjectAssignmentFileProjector("/project", component)({
    projectPath: assignment.targetProjectPath,
    topologyAddress: assignment.topologyAddress,
  })
  if (file === undefined) throw new Error(`Не найден validation-файл: ${assignment.targetProjectPath}`)
  return file
}
