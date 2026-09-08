import {
parseWithJsYaml,
parseMetadataYaml,
type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import * as compiledRules from "@nkdk/runtime/rule-kit"
import {
configurationIndexStoreDescriptor,
openConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import fs from "node:fs"
import os from "node:os"
import { dirname,join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll,beforeAll,describe,expect,it,vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../tests/preparedYamlWorkerTestPool"
import {
createImportProjectStateTestService,
createXmlImportWorkerTestPool,
createInspectableXmlImportWorkerTestPool,
} from "../../tests/xmlImportWorkerTestPool"
import { createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { importConfigurationFromXml } from "./importConfiguration"
import { withoutUnsupportedConfigurationExtensionPropertyStates } from "./configurationExtensionFixtureSupport"
import * as formProofContexts from "../forms/clientApplicationForm/convertYAMLToXML"
import * as formDataPathContexts from "../forms/clientApplicationForm/formDataPathContext"
import * as boundaryReferences from "./boundaryReferences"
import * as serializedValidation from "./serializedYamlValidation"
import { projectStateFormEntries } from "../projectState/fileUpdate"
import { observeFinalImportYamlFacts } from "../../tests/finalImportValidationProbe"
import type { ProjectStateStructuredDocumentEntry } from "../projectState/fileUpdate"
import type { PendingMetadataTargetReference } from "../validation/projectReferenceIndex"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import { projectStatePendingCheck } from "../projectState/fileUpdate"
import { ProjectStateSnapshotView } from "../projectState/binary/snapshot"
import { createTypedProjectStateReader } from "../projectState/binary/typedReader"
import { buildProjectStateYamlFileUpdate } from "../project/projectStateYamlUpdate"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "configurationExtension")
const ownExchangePlanFixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "ownExtensionExchangePlan",
)
const configurationFixtureDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const catalogFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__")
const formFixtureDir = join(import.meta.dirname, "../forms/clientApplicationForm/__fixtures__")
const commonFormFixtureDir = join(
  import.meta.dirname,
  "../appliedObjects/metadataCommonForm/__fixtures__/sync/xml",
)
const languageFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataLanguage/__fixtures__")
const borrowedCommandBarButtonName = "ОбщаяПанельнаяКнопка"
const baseFormUuid = "4e9b2646-e73a-4c98-ad43-19ac74b24770"
const temporaryRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-extension-import-"))
let temporaryDirectoryIndex = 0
const xmlImportWorkerPoolHandle = createXmlImportWorkerTestPool()
const multipleWorkers = createInspectableXmlImportWorkerTestPool(3)
const preparedYamlWorkerFactory = createPreparedYamlWorkerThreadPoolFactory()
const projectState = createImportProjectStateTestService({
  createPool: (concurrency) => createPreparedYamlProjectWorkerPool({
    concurrency,
    createWorkerPool: preparedYamlWorkerFactory,
  }),
})
let importedExtension: Awaited<ReturnType<typeof importExtension>>
let multipleWorkerExtension: Awaited<ReturnType<typeof importExtension>>
let singleWorkerYaml: Record<string, string>
let multipleWorkerYaml: Record<string, string>
let rebuiltFormProofContexts = 0
let preparedFormProofContexts = 0
let reusedCurrentFormContext = false
let importedReferenceModes: { canonical: string; mode: string | undefined }[] = []
let ownChildHasPropertyState: boolean[] = []
const referenceComparisons: { expected: readonly PendingMetadataTargetReference[]; actual: readonly PendingMetadataTargetReference[] }[] = []
const checkComparisons: { expected: readonly ValidationPendingCheck[]; actual: readonly ValidationPendingCheck[] }[] = []

afterAll(async () => {
  await Promise.all([
    xmlImportWorkerPoolHandle.close(),
    multipleWorkers.handle.close(),
    projectState.close(),
  ])
  await fs.promises.rm(temporaryRoot, { recursive: true, force: true })
})

describe("configuration extension XML import", () => {
  it("сохраняет окончательные проверки расширения без повторного сбора по YAML", () => {
    expect(checkComparisons.length).toBeGreaterThan(0)
    const values = (checks: readonly ValidationPendingCheck[]) => checks.map(projectStatePendingCheck)
      .sort((left, right) => JSON.stringify(left.yamlPath).localeCompare(JSON.stringify(right.yamlPath)))
    for (const { expected, actual } of checkComparisons) expect(values(actual)).toEqual(values(expected))
  })
  beforeAll(async () => {
    const serialized = vi.spyOn(serializedValidation, "validateSerializedProjectYaml")
    const compile = compiledRules.createCompiledRuleExecution
    const annotationByYaml = new WeakMap<object, XmlAnomalyAnnotations>()
    let annotatedBeforeExport = 0
    const proof = vi.spyOn(compiledRules, "createCompiledRuleExecution").mockImplementation(params => compile({
      ...params,
      prepare(item) {
        const prepared = params.prepare(item)
        if (prepared.annotations !== undefined) annotationByYaml.set(item.yaml, prepared.annotations)
        return prepared
      },
      beforeFinish(item) {
        params.beforeFinish?.(item)
        if (item.yaml.ПутьКДанным !== "НеОбъявленное.Поле") return
        expect(item.yamlPath.length).toBeGreaterThan(0)
        expect(annotationByYaml.get(item.yaml)?.at(item.yaml, "ПутьКДанным")?.kind).toBe("invalid")
        annotatedBeforeExport++
      },
    }))
    const rebuild = vi.spyOn(formProofContexts, "prepareClientApplicationFormProofContexts")
    const prepared = vi.spyOn(formProofContexts, "prepareClientApplicationFormProofContextsFromPrepared")
    const paths = vi.spyOn(formDataPathContexts, "prepareFormDataPathContext")
    const references = vi.spyOn(boundaryReferences, "collectBoundaryReferenceFacts")
    const metadataDocumentsByFile = new Map<string, readonly ProjectStateStructuredDocumentEntry[]>()
    const observation = observeFinalImportYamlFacts(({ params: validationParams, expected: finalExpected, update }) => {
        if (validationParams.isolated === true) {
          const file = validationParams.file
          expect(update).toEqual(buildProjectStateYamlFileUpdate({
            projectDir: validationParams.projectDir, firstPass: finalExpected,
            descriptor: { componentPath: file.componentPath, componentDir: file.componentDir,
              rootProjectPath: file.rootProjectPath, projectPath: file.projectPath, role: file.kind, indexContribution: "isolated" },
          }))
        }
        const actual = validationParams.facts
        if (validationParams!.file.kind !== "form") expect(finalExpected.dependencies).toEqual([])
        const { ref: _ref, filePath: _filePath, fieldIndex: _fieldIndex, ...ownerValues } = finalExpected.objectRecords[0]?.ownerFacts ?? {}
        expect(actual.ownerFacts ?? {}).toEqual(ownerValues)
        if (validationParams!.file.kind !== "form") {
          metadataDocumentsByFile.set(validationParams!.file.rootProjectPath, finalExpected.structuredDocuments ?? [])
        }
        const components = (values: typeof finalExpected.structuredComponents) => [...(values ?? [])]
          .sort((a, b) => JSON.stringify([a.componentKind, a.name, a.yamlPath]).localeCompare(JSON.stringify([b.componentKind, b.name, b.yamlPath])))
        expect(components(actual.structuredComponents)).toEqual(components(finalExpected.structuredComponents))
        expect(actual.localizedTextProperties > 0).toBe(finalExpected.validationContextDependencies !== undefined)
        expect(projectStateFormEntries(actual.formIndex === undefined ? undefined : {
          owner: { kind: validationParams!.file.owner.dir, name: validationParams!.file.owner.name }, index: actual.formIndex,
        })).toEqual(projectStateFormEntries(finalExpected.form))
        const objects = (entries: typeof finalExpected.objectIndexEntries) => [...entries].sort((a, b) => a.canonical.localeCompare(b.canonical))
        expect(objects(actual.objectIndexEntries)).toEqual(objects(finalExpected.objectIndexEntries))
        const addresses = (entries: typeof finalExpected.logicalAddresses) => [...(entries ?? [])].sort((a, b) => a.logicalAddress.localeCompare(b.logicalAddress))
        expect(addresses(actual.logicalAddresses)).toEqual(addresses(finalExpected.logicalAddresses))
        const expectedChecks = finalExpected.state.kind === "form" || finalExpected.state.kind === "properties"
          ? finalExpected.state.pendingChecks : []
        referenceComparisons.push({ expected: finalExpected.pendingReferences, actual: actual.references })
        checkComparisons.push({ expected: expectedChecks, actual: actual.checks })
    })
    try {
      importedExtension = await importExtension()
      expect(serialized).not.toHaveBeenCalled()
      expect(annotatedBeforeExport).toBeGreaterThan(0)
      const snapshot = new ProjectStateSnapshotView((await projectState.createReadToken(importedExtension.projectDir)).buffers)
      const reader = createTypedProjectStateReader(snapshot)
      expect([...metadataDocumentsByFile.keys()].some(path => path.startsWith("cf/"))).toBe(true)
      expect([...metadataDocumentsByFile.keys()].some(path => path.startsWith("cfe/"))).toBe(true)
      for (const [path, documents] of metadataDocumentsByFile) {
        const fileId = snapshot.findFile(path)
        expect(fileId, path).toBeDefined()
        const ordered = (values: typeof documents) => [...values].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
        expect(ordered(reader.structuredDocuments(fileId!)), path).toEqual(ordered(documents))
      }
      importedReferenceModes = references.mock.results.flatMap(result => result.type === "return"
        ? result.value.references.map(reference => ({ canonical: reference.canonical, mode: reference.propertyStateMode })) : [])
      ownChildHasPropertyState = references.mock.calls.filter(([input]) => input.name === "СобственныйРеквизит")
        .map(([input]) => input.propertyStateCapability !== undefined)
      rebuiltFormProofContexts = rebuild.mock.calls.filter(([, params]) => params?.yaml !== undefined).length
      preparedFormProofContexts = prepared.mock.calls.filter(([, context]) => context !== undefined).length
      const seen = new Set<object>()
      reusedCurrentFormContext = paths.mock.calls.some(([{ currentConfigurationForm }]) => {
        if (currentConfigurationForm === undefined) return false
        if (seen.has(currentConfigurationForm)) return true
        seen.add(currentConfigurationForm)
        return false
      })
    } finally {
      serialized.mockRestore()
      proof.mockRestore()
      rebuild.mockRestore()
      prepared.mockRestore()
      paths.mockRestore()
      references.mockRestore()
      observation.restore()
    }
    multipleWorkerExtension = await importExtension(multipleWorkers.handle, 3)
    const yamlFiles = (imported: typeof importedExtension) => Object.fromEntries(imported.snapshot.hashes
      .filter(({ projectPath }) => projectPath.endsWith(".yaml"))
      .map(({ projectPath }) => [projectPath, readText(join(imported.projectDir, imported.result.componentPath!), projectPath)]))
    singleWorkerYaml = yamlFiles(importedExtension)
    multipleWorkerYaml = yamlFiles(multipleWorkerExtension)
  })

  it("передаёт режимы заимствованных ссылок непосредственно из локального импорта", () => {
    expect(importedReferenceModes).toContainEqual({
      canonical: "Catalog.СправочникПолный.Form.ФормаОтчета", mode: "extend",
    })
    expect(ownChildHasPropertyState).toEqual([false])
  })

  it("сохраняет полный список ссылок по сравнению с независимым обходом", () => {
    const normalized = (references: readonly PendingMetadataTargetReference[]) => references.map(reference => ({
      canonical: reference.canonical, yamlPath: reference.yamlPath,
    })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
    expect(referenceComparisons.length).toBeGreaterThan(0)
    const additions: ReturnType<typeof normalized> = []
    for (const { expected, actual } of referenceComparisons) {
      const previous = normalized(expected)
      const next = normalized(actual)
      expect(next).toEqual(expect.arrayContaining(previous))
      additions.push(...next.filter(value => !previous.some(entry => JSON.stringify(entry) === JSON.stringify(value))))
    }
    expect(additions).toEqual([{ canonical: "Catalog.ПроектныеЗадачи", yamlPath: ["Состав", 0, "Метаданные"] }])
  })

  it("сохраняет YAML и диагностику формы с основой при одном и трёх владельцах заданий", () => {
    expect(multipleWorkerYaml).toEqual(singleWorkerYaml)
    expect(multipleWorkerExtension.result.failed).toEqual([])
    expect(multipleWorkerExtension.result.warnings).toEqual(importedExtension.result.warnings)
    expect(multipleWorkerExtension.result.succeeded).toBe(importedExtension.result.succeeded)
    const assigned = [0, 1, 2].map(index => multipleWorkers.commands(index)
      .flatMap(command => command.kind === "firstPassBatch" ? command.assignments : []))
    expect(assigned.filter(assignments => assignments.length > 0)).toHaveLength(3)
  })

  it("использует готовый контекст путей для сверки формы и основы, не восстанавливая его через YAML", () => {
    expect(preparedFormProofContexts).toBeGreaterThan(0)
    expect(rebuiltFormProofContexts).toBe(0)
    expect(reusedCurrentFormContext).toBe(true)
  })

  it("сохраняет структуру расширения и локализует импортированные аномалии", () => {
    const { projectDir, result, configuration, catalog, form, yamlText, catalogText, baseFormText, snapshot } = importedExtension

    expect(result).toMatchObject({
      componentPath: "cfe/РасширениеКонтроль",
      succeeded: 8,
      failed: [],
    })
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "unresolved_data_path" }),
    ]))
    expect(configuration).toMatchObject({
      Имя: "РасширениеКонтроль",
      НазначениеРасширенияКонфигурации: "Адаптация",
      ОсновнойЯзык: "БазовыйЯзык",
    })
    expect(catalog).toMatchObject({
      Реквизиты: {
        РеквизитСправочника: { Синоним: "", Тип: "ЛюбаяСсылка", Формат: "ДФ=dd.MM.yyyy" },
        СобственныйРеквизит: { Синоним: "", Тип: "Строка(20)" },
      },
    })
    expect(form).toMatchObject({
      Элементы: {
        СобственноеПоле: { Вид: "ПолеВвода", Ширина: 10 },
        ПолеБазовогоРеквизита: {
          Вид: "ПолеНадписи",
          ПутьКДанным: "БазовыйОбъект.БазовыйРеквизит.Description",
        },
      },
    })
    expect(yamlText).toContain("ОсновнойЯзык: !xml/invalid БазовыйЯзык")
    expect(yamlText).toContain("ПутьКДанным: !xml/invalid БазовыйОбъект.БазовыйРеквизит.Description")
    expect(yamlText).toContain("Properties\\UnknownProperty: !xml/raw")
    expect(yamlText).toContain("Тип: !xml/raw")
    const borrowedAttributeYaml = textBetween(
      catalogText,
      "  РеквизитСправочника:",
      "  СобственныйРеквизит:",
    )
    expect(borrowedAttributeYaml).not.toContain("ПринадлежностьОбъекта: !xml/raw")
    expect(borrowedAttributeYaml).not.toContain("Properties: !xml/raw")

    const baseForm = readYaml(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
    ) as Record<string, unknown>
    expect(baseForm).toMatchObject({ Элементы: { БазовоеПоле: { Вид: "ПолеВвода", Ширина: 99 } } })
    expect(baseFormText).toContain("!xml/invalid de: Hinweis")
    const entities = [...snapshot.blocks.values()].flatMap(({ entities }) => entities)
    expect(entities.some(
      ({ logicalAddress }) => logicalAddress === "Справочник.СправочникПолный.Форма.ФормаОтчета.form"
    )).toBe(false)
    expect(fs.existsSync(join(
      projectDir,
      ".nkdk/components/cfe/РасширениеКонтроль/configuration-index.lmdb",
    ))).toBe(true)
  })

  it("помечает неявный путь через незаимствованный реквизит по текущей cf без встроенного BaseForm", () => {
    const { projectDir, formWithoutBase, formWithoutBaseText } = importedExtension

    expect((formWithoutBase as { Элементы: Record<string, { ПутьКДанным?: unknown }> }).Элементы.СобственноеПоле)
      .toMatchObject({ ПутьКДанным: "БазовыйОбъект.СобственноеПоле" })
    expect(formWithoutBaseText)
      .toMatch(/ПутьКДанным: !xml\/raw\n\s+\$значение: !xml\/invalid БазовыйОбъект\.СобственноеПоле\n\s+\$xml: null/u)
    expect(formWithoutBaseText)
      .toMatch(/ПутьКДанным: !xml\/raw\n\s+\$значение: !xml\/invalid БазовыйОбъект\.Код\n\s+\$xml: null/u)
    expect(formWithoutBaseText)
      .toMatch(/ПутьКДанным: !xml\/raw\n\s+\$значение: !xml\/invalid БазовыйОбъект\.НеизвестнаяТаблица\.Колонка\n\s+\$xml: null/u)
    expect(formWithoutBaseText).toContain('"@Form\\\\UnknownProperty": !xml/raw')
    expect(formWithoutBaseText).toContain("Form\\Properties\\UnknownProperty: !xml/raw")
    expect((formWithoutBase as { Элементы: Record<string, { ПутьКДанным?: unknown }> }).Элементы.Код)
      .toMatchObject({ ПутьКДанным: "БазовыйОбъект.Код" })
    expect(fs.existsSync(join(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/БазоваяФорма.yaml",
    ))).toBe(false)
  })

  it.each(["", ".ОсноваФормы"])("сохраняет ID реквизита и вложенной колонки при контрольном экспорте %s", (representation) => {
    const entities = [...importedExtension.snapshot.blocks.values()].flatMap(({ entities }) => entities)
    const root = `Справочник.СправочникПолный.Форма.ФормаОтчета${representation}.Атрибут.СохраненныйОбъект`
    expect(entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ logicalAddress: root, xmlId: "1000009" }),
      expect.objectContaining({
        logicalAddress: `${root}.ДополнительныеКолонки.СохраненныйОбъект%2EСтроки.Колонка.ТрудозатратыФакт`,
        xmlId: "1",
      }),
    ]))
    expect(importedExtension.result.failed).toEqual([])
  })

  it("не сохраняет восстановимую основу вложенной и общей формы", () => {
    const { projectDir } = importedExtension

    expect(fs.existsSync(join(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаРавнаяОснова/БазоваяФорма.yaml",
    ))).toBe(false)
    expect(fs.existsSync(join(
      projectDir,
      "cfe/РасширениеКонтроль/ОбщаяФорма/ОбщаяРавнаяОснова/БазоваяФорма.yaml",
    ))).toBe(false)
    expect(readText(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаРавнаяОснова/Форма.yaml",
    )).toEqual(expect.stringContaining('"@Form\\\\BaseForm\\\\Future": !xml/raw'))
    expect(readText(
      projectDir,
      "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаРавнаяОснова/Форма.yaml",
    )).toContain('"@Form\\\\BaseForm\\\\AutoCommandBar\\\\FutureNested": !xml/raw')
  })

  it("помечает путь элемента только из исторической основы", () => {
    const { historicalFormText, historicalBaseFormText } = importedExtension

    expect(historicalFormText)
      .toMatch(/ПутьКДанным: !xml\/raw\n\s+\$значение: !xml\/invalid БазовыйОбъект\.ИсторическоеПоле\n\s+\$xml: null/u)
    expect(historicalFormText).toContain('"@Form\\\\UnknownProperty": !xml/raw')
    expect(historicalFormText).not.toContain('"@Form\\\\BaseForm')
    expect(historicalBaseFormText).toContain("ИсторическоеПоле:")
  })

  it("импортирует состав собственного плана расширения без ExtensionProperty", () => {
    const { exchangePlan, result } = importedExtension

    expect(result.failed).toEqual([])
    expect(exchangePlan).toMatchObject({
      Состав: [{ Метаданные: "Справочник.ПроектныеЗадачи", Авторегистрация: "Запретить" }],
    })
    const parsed = parseMetadataYaml(readText(importedExtension.projectDir,
      "cfe/РасширениеКонтроль/ПланОбмена/дкз_ОбменТипы/Свойства.yaml"))
    expect(parsed.annotations.at(parsed.data as object, "@")?.xml).toEqual({
      "_xmlns:app": null, "_xmlns:cfg": null, "_xmlns:cmi": null,
      "_xmlns:ent": null, "_xmlns:lf": null, "_xmlns:style": null,
      "_xmlns:sys": null, "_xmlns:v8ui": null, "_xmlns:web": null,
      "_xmlns:win": null, "_xmlns:xen": null, "_xmlns:xpr": null,
    })
    expect(parsed.annotations.at(parsed.data as object, "@\\#attributes")).toBeUndefined()
  })

})

async function importExtension(pool = xmlImportWorkerPoolHandle, concurrency = 1) {
  const projectDir = temporaryDirectory()
  await importBaseConfiguration(projectDir, pool, concurrency)
  const inputDir = temporaryDirectory()
  fs.cpSync(fixtureDir, inputDir, { recursive: true })
  fs.cpSync(
    join(ownExchangePlanFixtureDir, "ExchangePlans"),
    join(inputDir, "ExchangePlans"),
    { recursive: true },
  )
  for (const relativePath of [
    "Configuration.xml",
    "Catalogs/СправочникПолный.xml",
    "Catalogs/СправочникПолный/Forms/ФормаОтчета.xml",
  ]) {
    removeUnknownPropertyStates(join(inputDir, ...relativePath.split("/")))
  }
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\n\t\t</Properties>\n",
    "\n\t\t\t<DefaultObjectForm>Catalog.СправочникПолный.Form.ФормаОтчета</DefaultObjectForm>\n\t\t</Properties>\n",
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета.xml"),
    "88888888-8888-4888-8888-888888888888",
    baseFormUuid,
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t\t\t<Width>99</Width>",
    [
      "\t\t\t\t<Width>99</Width>",
      "\t\t\t\t<DataPath>НеОбъявленное.Поле</DataPath>",
      "\t\t\t\t<ToolTip>",
      "\t\t\t\t\t<v8:item>",
      "\t\t\t\t\t\t<v8:lang>de</v8:lang>",
      "\t\t\t\t\t\t<v8:content>Hinweis</v8:content>",
      "\t\t\t\t\t</v8:item>",
      "\t\t\t\t</ToolTip>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Configuration.xml"),
    "\t\t\t<Name>РасширениеКонтроль</Name>",
    [
      "\t\t\t<Name>РасширениеКонтроль</Name>",
      "\t\t\t<Synonym>",
      "\t\t\t\t<v8:item>",
      "\t\t\t\t\t<v8:lang>ru</v8:lang>",
      "\t\t\t\t\t<v8:content>Расширение контроль</v8:content>",
      "\t\t\t\t</v8:item>",
      "\t\t\t</Synonym>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Configuration.xml"),
    "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>",
    "\t\t\t<ConfigurationExtensionCompatibilityMode>Version8_3_20</ConfigurationExtensionCompatibilityMode>\n" +
      "\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
    [
      "\t\t<InputField name=\"Код\" id=\"20\">",
      "\t\t\t<ContextMenu name=\"КодКонтекстноеМеню\" id=\"21\"/>",
      "\t\t\t<ExtendedTooltip name=\"КодРасширеннаяПодсказка\" id=\"22\"/>",
      "\t\t</InputField>",
      "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
    ].join("\n")
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t</Attributes>\n\t</BaseForm>",
    [
      "\t\t\t<ConditionalAppearance>",
      "\t\t\t\t<dcsset:item>",
      "\t\t\t\t\t<dcsset:selection><dcsset:item><dcsset:field>НеизвестныйЭлементОсновы</dcsset:field></dcsset:item></dcsset:selection>",
      "\t\t\t\t\t<dcsset:filter>",
      "\t\t\t\t\t\t<dcsset:item xsi:type=\"dcsset:FilterItemComparison\">",
      "\t\t\t\t\t\t\t<dcsset:left xsi:type=\"dcscor:Field\">НеизвестныйИсточник.Поле</dcsset:left>",
      "\t\t\t\t\t\t\t<dcsset:comparisonType>Equal</dcsset:comparisonType>",
      "\t\t\t\t\t\t\t<dcsset:right xsi:type=\"xs:boolean\">true</dcsset:right>",
      "\t\t\t\t\t\t</dcsset:item>",
      "\t\t\t\t\t</dcsset:filter>",
      "\t\t\t\t\t<dcsset:appearance/>",
      "\t\t\t\t</dcsset:item>",
      "\t\t\t</ConditionalAppearance>",
      "\t\t</Attributes>",
      "\t</BaseForm>",
    ].join("\n")
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t<BaseForm version=\"2.20\">\n\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
    [
      "\t<BaseForm version=\"2.20\">",
      "\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\">",
      "\t\t\t<ChildItems>",
      `\t\t\t\t<Button name=\"${borrowedCommandBarButtonName}\" id=\"10\">`,
      "\t\t\t\t\t<Type>CommandBarButton</Type>",
      "\t\t\t\t\t<CommandName>Form.StandardCommand.Close</CommandName>",
      "\t\t\t\t</Button>",
      "\t\t\t</ChildItems>",
      "\t\t</AutoCommandBar>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "<v8:Type>xs:dateTime</v8:Type>",
    "<v8:TypeSet>cfg:AnyRef</v8:TypeSet>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "<v8:Type>xs:string</v8:Type>",
    "<v8:TypeSet>cfg:AnyRef</v8:TypeSet>"
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный", "Forms", "ФормаОтчета", "Ext", "Form.xml"),
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"8\">\n\t\t\t<Type>\n\t\t\t\t<v8:Type>cfg:CatalogObject.БазовыйСправочник</v8:Type>\n\t\t\t</Type>\n\t\t</Attribute>",
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"8\">\n\t\t\t<Type>\n\t\t\t\t<v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type>\n\t\t\t</Type>\n\t\t</Attribute>"
  )
  addFormWithoutBase(inputDir)
  addFormWithRedundantBase(inputDir)
  addFormWithHistoricalElement(inputDir)
  addCommonFormWithRedundantBase(inputDir)
  addSavedFormIdentityRegression(inputDir)
  const unresolvedTable = fs.readFileSync(
    join(formFixtureDir, "../../elements/table/__fixtures__/minimal.xml"),
    "utf8",
  ).replaceAll("Таблица", "НеизвестнаяТаблица")
    .replace(/id="(\d+)"/g, (_match, id) => `id="${Number(id) + 100}"`)
    .replace("</Table>", [
      '<RowFilter xsi:nil="true"/>',
      '<ChildItems><InputField name="НеизвестнаяТаблицаКолонка" id="120">',
      '<ContextMenu name="НеизвестнаяТаблицаКолонкаКонтекстноеМеню" id="121"/>',
      '<ExtendedTooltip name="НеизвестнаяТаблицаКолонкаРасширеннаяПодсказка" id="122"/>',
      '</InputField></ChildItems></Table>',
    ].join("\n"))
  replaceExactlyOnce(
    join(inputDir, "Catalogs/СправочникПолный/Forms/ФормаБезОсновы/Ext/Form.xml"),
    "\t</ChildItems>\n\t<Attributes>",
    `${unresolvedTable}\n\t</ChildItems>\n\t<Attributes>`,
  )

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency,
    operationId: "configuration-extension-e2e",
    xmlImportWorkerPoolHandle: pool,
    projectState,
  })
  const importedFormPath = join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml",
  )
  if (!fs.existsSync(importedFormPath)) throw new Error(`Импорт не создал форму: ${JSON.stringify(result)}`)
  const importedCatalogPath = join(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml",
  )
  if (!fs.existsSync(importedCatalogPath)) throw new Error(`Импорт не создал справочник: ${JSON.stringify(result)}`)
  const importedConfigurationPath = join(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  if (!fs.existsSync(importedConfigurationPath)) {
    throw new Error(`Импорт не создал конфигурацию расширения: ${JSON.stringify(result)}`)
  }
  const configuration = readYaml(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml")
  const exchangePlan = readYaml(
    projectDir,
    "cfe/РасширениеКонтроль/ПланОбмена/дкз_ОбменТипы/Свойства.yaml",
  )
  const catalog = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml")
  const form = readYaml(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml")
  const formWithoutBaseProjectPath =
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаБезОсновы/Форма.yaml"
  const formWithoutBasePath = join(projectDir, ...formWithoutBaseProjectPath.split("/"))
  if (!fs.existsSync(formWithoutBasePath)) {
    throw new Error(`Импорт не создал форму без основы: ${JSON.stringify(result)}`)
  }
  const formWithoutBase = readYaml(projectDir, formWithoutBaseProjectPath)
  const formWithoutBaseText = readText(
    projectDir,
    formWithoutBaseProjectPath,
  )
  const historicalFormText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаИсторическийЭлемент/Форма.yaml",
  )
  const historicalBaseFormText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаИсторическийЭлемент/БазоваяФорма.yaml",
  )
  const catalogText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml",
  )
  const baseFormText = readText(
    projectDir,
    "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
  )
  const yamlText = [
    readText(projectDir, "cfe/РасширениеКонтроль/Конфигурация.yaml"),
    catalogText,
    readText(projectDir, "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаОтчета/Форма.yaml"),
  ].join("\n")
  const descriptor = configurationIndexStoreDescriptor(projectDir, {
    kind: "configurationExtension",
    name: "РасширениеКонтроль",
  })
  if (!fs.existsSync(descriptor.dataPath)) throw new Error(`Импорт не создал снимок: ${JSON.stringify(result)}`)
  const store = openConfigurationIndexStore(descriptor, "readOnly")
  const hashes = store.readHashes()
  const snapshot = { hashes, blocks: store.getBlocks(hashes.map(({ projectPath }) => projectPath)) }
  await store.close()

  return {
    projectDir,
    result,
    configuration,
    exchangePlan,
    catalog,
    form,
    formWithoutBase,
    formWithoutBaseText,
    historicalFormText,
    historicalBaseFormText,
    yamlText,
    catalogText,
    baseFormText,
    snapshot,
  }
}

function addSavedFormIdentityRegression(inputDir: string): void {
  const path = join(inputDir, "Catalogs/СправочникПолный/Forms/ФормаОтчета/Ext/Form.xml")
  const attribute = [
    '<Attribute name="СохраненныйОбъект" id="1000009">',
    '<Type><v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type></Type>',
    '<Columns><AdditionalColumns table="СохраненныйОбъект.Строки">',
    '<Column name="ТрудозатратыФакт" id="1"><Type><v8:Type>xs:decimal</v8:Type></Type></Column>',
    '</AdditionalColumns></Columns>',
    '</Attribute>',
  ].join("\n")
  replaceExactlyOnce(path, "\n\t</Attributes>", [
    "",
    '<Attribute name="СобственнаяДата" id="1000001"><Type><v8:Type>xs:dateTime</v8:Type></Type></Attribute>',
    attribute,
    "\t</Attributes>",
  ].join("\n"))
  replaceExactlyOnce(path, "\n\t\t</Attributes>", `\n${attribute}\n\t\t</Attributes>`)
}

function textBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (start < 0 || end < 0) {
    throw new Error(`Не найдены границы YAML-фрагмента: ${startMarker} / ${endMarker}`)
  }
  return source.slice(start, end)
}

async function importBaseConfiguration(projectDir: string, pool = xmlImportWorkerPoolHandle, concurrency = 1): Promise<void> {
  const inputDir = temporaryDirectory()
  const configurationPath = join(inputDir, "Configuration.xml")
  fs.copyFileSync(join(configurationFixtureDir, "minimal.xml"), configurationPath)
  replaceExactlyOnce(
    configurationPath,
    "\t\t</Properties>",
    [
      "\t\t\t<DefaultLanguage>Language.БазовыйЯзык</DefaultLanguage>",
      "\t\t</Properties>",
      "\t\t<ChildObjects><Language>БазовыйЯзык</Language></ChildObjects>",
    ].join("\n"),
  )

  const catalogPath = join(inputDir, "Catalogs", "СправочникПолный.xml")
  fs.mkdirSync(dirname(catalogPath), { recursive: true })
  fs.copyFileSync(join(catalogFixtureDir, "minimal.xml"), catalogPath)
  replaceAllInFile(catalogPath, "ПоУмолчанию", "СправочникПолный")
  replaceExactlyOnce(
    catalogPath,
    "\t\t<ChildObjects/>",
    [
      "\t\t<ChildObjects>",
      "\t\t\t<Attribute uuid=\"55555555-5555-4555-8555-555555555555\">",
      "\t\t\t\t<Properties>",
      "\t\t\t\t\t<Name>РеквизитСправочника</Name>",
      "\t\t\t\t\t<Synonym/>",
      "\t\t\t\t\t<Type><v8:Type>xs:dateTime</v8:Type><v8:DateQualifiers><v8:DateFractions>Date</v8:DateFractions></v8:DateQualifiers></Type>",
      "\t\t\t\t</Properties>",
      "\t\t\t</Attribute>",
      "\t\t\t<Form>ФормаОтчета</Form>",
      "\t\t\t<Form>ФормаБезОсновы</Form>",
      "\t\t\t<Form>ФормаРавнаяОснова</Form>",
      "\t\t\t<Form>ФормаИсторическийЭлемент</Form>",
      "\t\t</ChildObjects>",
    ].join("\n"),
  )

  for (const formName of [
    "ФормаОтчета",
    "ФормаБезОсновы",
    "ФормаРавнаяОснова",
    "ФормаИсторическийЭлемент",
  ]) {
    const formsDir = join(inputDir, "Catalogs", "СправочникПолный", "Forms")
    const metadataPath = join(formsDir, `${formName}.xml`)
    const bodyPath = join(formsDir, formName, "Ext", "Form.xml")
    fs.mkdirSync(dirname(bodyPath), { recursive: true })
    fs.copyFileSync(join(formFixtureDir, "minimalMetadata.xml"), metadataPath)
    replaceAllInFile(metadataPath, "Минимальная", formName)
    fs.copyFileSync(join(formFixtureDir, "minimal.xml"), bodyPath)
    if (formName === "ФормаОтчета") {
      replaceExactlyOnce(
        bodyPath,
        "\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
        [
          "\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\">",
          "\t\t<ChildItems>",
          `\t\t\t<Button name=\"${borrowedCommandBarButtonName}\" id=\"10\">`,
          "\t\t\t\t<Type>CommandBarButton</Type>",
          "\t\t\t\t<CommandName>Form.StandardCommand.Close</CommandName>",
          "\t\t\t</Button>",
          "\t\t</ChildItems>",
          "\t</AutoCommandBar>",
        ].join("\n"),
      )
      replaceExactlyOnce(
        bodyPath,
        "\t<Attributes/>",
        [
          "\t<ChildItems>",
          "\t\t<InputField name=\"БазовоеПоле\" id=\"1\">",
          "\t\t\t<DataPath>БазовыйРеквизитФормы</DataPath>",
          "\t\t\t<Width>99</Width>",
          "\t\t\t<ContextMenu name=\"БазовоеПолеКонтекстноеМеню\" id=\"2\"/>",
          "\t\t\t<ExtendedTooltip name=\"БазовоеПолеРасширеннаяПодсказка\" id=\"3\"/>",
          "\t\t</InputField>",
          "\t</ChildItems>",
          ...baseFormAttributesXml(),
        ].join("\n"),
      )
    } else {
      replaceExactlyOnce(bodyPath, "\t<Attributes/>", baseFormAttributesXml().join("\n"))
      if (formName === "ФормаРавнаяОснова") addFormEvent(bodyPath)
    }
  }

  addBaseCommonForm(inputDir)

  const languagePath = join(inputDir, "Languages", "БазовыйЯзык.xml")
  fs.mkdirSync(dirname(languagePath), { recursive: true })
  fs.copyFileSync(join(languageFixtureDir, "ru.xml"), languagePath)
  replaceExactlyOnce(languagePath, "<Name>Русский</Name>", "<Name>БазовыйЯзык</Name>")

  const result = await importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency,
    operationId: "configuration-base-e2e",
    xmlImportWorkerPoolHandle: pool,
    projectState,
  })
  expect(result.failed).toEqual([])
  expect(result.componentPath).toBe("cf")
  expect(result.succeeded).toBe(8)
}

function baseFormAttributesXml(): string[] {
  return [
    "\t<Attributes>",
    "\t\t<Attribute name=\"БазовыйРеквизитФормы\" id=\"4\">",
    "\t\t\t<Type><v8:Type>xs:dateTime</v8:Type></Type>",
    "\t\t</Attribute>",
    "\t\t<Attribute name=\"БазовыйОбъект\" id=\"5\">",
    "\t\t\t<Type><v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type></Type>",
    "\t\t\t<MainAttribute>true</MainAttribute>",
    "\t\t</Attribute>",
    "\t</Attributes>",
  ]
}

function addFormWithoutBase(inputDir: string): void {
  const catalogDir = join(inputDir, "Catalogs", "СправочникПолный")
  const formsDir = join(catalogDir, "Forms")
  const sourceMetadataPath = join(formsDir, "ФормаОтчета.xml")
  const targetMetadataPath = join(formsDir, "ФормаБезОсновы.xml")
  const targetFormDir = join(formsDir, "ФормаБезОсновы")
  fs.copyFileSync(sourceMetadataPath, targetMetadataPath)
  fs.cpSync(join(formsDir, "ФормаОтчета"), targetFormDir, { recursive: true })
  replaceExactlyOnce(
    targetMetadataPath,
    "77777777-7777-4777-8777-777777777777",
    "99999999-9999-4999-8999-999999999999",
  )
  replaceExactlyOnce(targetMetadataPath, "<Name>ФормаОтчета</Name>", "<Name>ФормаБезОсновы</Name>")
  const targetFormPath = join(targetFormDir, "Ext", "Form.xml")
  removeBaseFormElement(targetFormPath)
  replaceExactlyOnce(
    targetFormPath,
    [
      "\t\t<Attribute name=\"БазовыйОбъект\" id=\"8\">",
      "\t\t\t<Type>",
      "\t\t\t\t<v8:Type>cfg:CatalogObject.СправочникПолный</v8:Type>",
      "\t\t\t</Type>",
      "\t\t</Attribute>\n",
    ].join("\n"),
    "",
  )
  replaceExactlyOnce(
    targetFormPath,
    [
      "\t\t<LabelField name=\"ПолеБазовогоРеквизита\" id=\"5\">",
      "\t\t\t<DataPath>БазовыйОбъект.БазовыйРеквизит.Description</DataPath>",
      "\t\t\t<ContextMenu name=\"ПолеБазовогоРеквизитаКонтекстноеМеню\" id=\"6\"/>",
      "\t\t\t<ExtendedTooltip name=\"ПолеБазовогоРеквизитаРасширеннаяПодсказка\" id=\"7\"/>",
      "\t\t</LabelField>\n",
    ].join("\n"),
    "",
  )
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\t\t\t<Form>ФормаОтчета</Form>",
    "\t\t\t<Form>ФормаОтчета</Form>\n\t\t\t<Form>ФормаБезОсновы</Form>",
  )
}

function addFormWithRedundantBase(inputDir: string): void {
  const catalogDir = join(inputDir, "Catalogs", "СправочникПолный")
  const formsDir = join(catalogDir, "Forms")
  const sourceMetadataPath = join(formsDir, "ФормаБезОсновы.xml")
  const targetMetadataPath = join(formsDir, "ФормаРавнаяОснова.xml")
  const sourceFormDir = join(formsDir, "ФормаБезОсновы")
  const targetFormDir = join(formsDir, "ФормаРавнаяОснова")
  fs.copyFileSync(sourceMetadataPath, targetMetadataPath)
  fs.cpSync(sourceFormDir, targetFormDir, { recursive: true })
  replaceExactlyOnce(
    targetMetadataPath,
    "99999999-9999-4999-8999-999999999999",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  )
  replaceExactlyOnce(targetMetadataPath, "<Name>ФормаБезОсновы</Name>", "<Name>ФормаРавнаяОснова</Name>")

  const targetFormPath = join(targetFormDir, "Ext", "Form.xml")
  addFormEvent(targetFormPath)
  const baseForm = [
    "\t<BaseForm version=\"2.20\">",
    "\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\">",
    "\t\t\t<FutureNested>keep</FutureNested>",
    "\t\t</AutoCommandBar>",
    ...formEventXml("\t\t"),
    ...baseFormAttributesXml().map((line) => `\t${line}`),
    "\t\t<Future>keep</Future>",
    "\t</BaseForm>",
  ].join("\n")
  replaceExactlyOnce(targetFormPath, "</Form>", `${baseForm}\n</Form>`)
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\t\t\t<Form>ФормаБезОсновы</Form>",
    "\t\t\t<Form>ФормаБезОсновы</Form>\n\t\t\t<Form>ФормаРавнаяОснова</Form>",
  )
}

function historicalFieldXml(indent: string): string[] {
  return [
    `${indent}<InputField name="ИсторическоеПоле" id="30">`,
    `${indent}\t<ContextMenu name="ИсторическоеПолеКонтекстноеМеню" id="31"/>`,
    `${indent}\t<ExtendedTooltip name="ИсторическоеПолеРасширеннаяПодсказка" id="32"/>`,
    `${indent}</InputField>`,
  ]
}

function addFormWithHistoricalElement(inputDir: string): void {
  const formsDir = join(inputDir, "Catalogs", "СправочникПолный", "Forms")
  const sourceMetadataPath = join(formsDir, "ФормаБезОсновы.xml")
  const targetMetadataPath = join(formsDir, "ФормаИсторическийЭлемент.xml")
  const sourceFormDir = join(formsDir, "ФормаБезОсновы")
  const targetFormDir = join(formsDir, "ФормаИсторическийЭлемент")
  fs.copyFileSync(sourceMetadataPath, targetMetadataPath)
  fs.cpSync(sourceFormDir, targetFormDir, { recursive: true })
  replaceExactlyOnce(
    targetMetadataPath,
    "99999999-9999-4999-8999-999999999999",
    "12121212-1212-4121-8121-121212121212",
  )
  replaceExactlyOnce(
    targetMetadataPath,
    "<Name>ФормаБезОсновы</Name>",
    "<Name>ФормаИсторическийЭлемент</Name>",
  )

  const targetFormPath = join(targetFormDir, "Ext", "Form.xml")
  replaceExactlyOnce(
    targetFormPath,
    "\t</ChildItems>\n\t<Attributes>",
    `${historicalFieldXml("\t\t").join("\n")}\n\t</ChildItems>\n\t<Attributes>`,
  )
  const baseForm = [
    "\t<BaseForm version=\"2.20\">",
    "\t\t<AutoCommandBar name=\"ФормаКоманднаяПанель\" id=\"-1\"/>",
    "\t\t<ChildItems>",
    ...historicalFieldXml("\t\t\t"),
    "\t\t</ChildItems>",
    "\t\t<Attributes/>",
    "\t</BaseForm>",
  ].join("\n")
  replaceExactlyOnce(targetFormPath, "</Form>", `${baseForm}\n</Form>`)
  replaceExactlyOnce(
    join(inputDir, "Catalogs", "СправочникПолный.xml"),
    "\t\t\t<Form>ФормаРавнаяОснова</Form>",
    "\t\t\t<Form>ФормаРавнаяОснова</Form>\n" +
      "\t\t\t<Form>ФормаИсторическийЭлемент</Form>",
  )
}

function addBaseCommonForm(inputDir: string): void {
  const { bodyPath } = createCommonFormFiles(inputDir, "dddddddd-dddd-4ddd-8ddd-dddddddddddd")
  addFormEvent(bodyPath)
}

function addCommonFormWithRedundantBase(inputDir: string): void {
  const { metadataPath, bodyPath } = createCommonFormFiles(
    inputDir,
    "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  )

  replaceExactlyOnce(
    metadataPath,
    "\t\t<Properties>",
    [
      "\t\t<InternalInfo>",
      "\t\t\t<xr:PropertyState>",
      "\t\t\t\t<xr:Property>Form</xr:Property>",
      "\t\t\t\t<xr:State>Extended</xr:State>",
      "\t\t\t</xr:PropertyState>",
      "\t\t</InternalInfo>",
      "\t\t<Properties>",
      "\t\t\t<ObjectBelonging>Adopted</ObjectBelonging>",
    ].join("\n"),
  )
  replaceExactlyOnce(
    metadataPath,
    "\t\t\t<Comment>Комментарий</Comment>",
    "\t\t\t<Comment>Комментарий</Comment>\n" +
      "\t\t\t<ExtendedConfigurationObject>dddddddd-dddd-4ddd-8ddd-dddddddddddd</ExtendedConfigurationObject>",
  )

  const baseBody = fs.readFileSync(
    join(commonFormFixtureDir, "КонстантаВсеСвойства", "Ext", "Form.xml"),
    "utf8",
  ).replaceAll("КонстантаВсеСвойства", "ОбщаяРавнаяОснова")
  const withEvent = insertFormEvent(baseBody)
  const inner = formBodyInnerXml(withEvent)
  fs.writeFileSync(
    bodyPath,
    withEvent.replace(
      "</Form>",
      [
        "\t<BaseForm version=\"2.20\">",
        ...inner.split("\n").map((line) => `\t${line}`),
        "\t</BaseForm>",
        "</Form>",
      ].join("\n"),
    ),
  )
}

function createCommonFormFiles(inputDir: string, uuid: string) {
  const commonFormsDir = join(inputDir, "CommonForms")
  const metadataPath = join(commonFormsDir, "ОбщаяРавнаяОснова.xml")
  const bodyPath = join(commonFormsDir, "ОбщаяРавнаяОснова", "Ext", "Form.xml")
  fs.mkdirSync(dirname(bodyPath), { recursive: true })
  fs.copyFileSync(join(commonFormFixtureDir, "КонстантаВсеСвойства.xml"), metadataPath)
  replaceAllInFile(metadataPath, "КонстантаВсеСвойства", "ОбщаяРавнаяОснова")
  replaceExactlyOnce(
    metadataPath,
    "0d003021-0016-43a6-b789-e2ab99a04253",
    uuid,
  )
  fs.copyFileSync(join(commonFormFixtureDir, "КонстантаВсеСвойства", "Ext", "Form.xml"), bodyPath)
  replaceAllInFile(bodyPath, "КонстантаВсеСвойства", "ОбщаяРавнаяОснова")
  return { metadataPath, bodyPath }
}

function addFormEvent(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  fs.writeFileSync(path, insertFormEvent(content))
}

function insertFormEvent(content: string): string {
  const marker = /\n(\t<AutoCommandBar[^\n]*\/>)\r?\n/u
  const match = marker.exec(content)
  if (match?.[1] === undefined) throw new Error("Не найдена командная панель формы")
  return content.replace(marker, `\n${match[1]}\n${formEventXml("\t").join("\n")}\n`)
}

function formEventXml(indent: string): string[] {
  return [
    `${indent}<Events>`,
    `${indent}\t<Event name=\"OnOpen\">ПриОткрытии</Event>`,
    `${indent}</Events>`,
  ]
}

function formBodyInnerXml(content: string): string {
  const normalized = content.replaceAll("\r\n", "\n")
  const openingEnd = normalized.indexOf("\n", normalized.indexOf("<Form "))
  const closing = normalized.lastIndexOf("</Form>")
  if (openingEnd === -1 || closing === -1) throw new Error("Не найдены границы Form.xml")
  return normalized.slice(openingEnd + 1, closing).trimEnd()
}

function removeBaseFormElement(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  const start = content.indexOf("\t<BaseForm version=\"2.20\">")
  const closing = "\t</BaseForm>"
  const end = content.indexOf(closing, start)
  if (start === -1 || end === -1) throw new Error(`Не найден BaseForm: ${path}`)
  fs.writeFileSync(path, content.slice(0, start) + content.slice(end + closing.length + 1))
}

function replaceExactlyOnce(path: string, source: string, replacement: string): void {
  const content = fs.readFileSync(path, "utf8")
  const first = content.indexOf(source)
  if (first === -1 || content.indexOf(source, first + source.length) !== -1) {
    throw new Error(`Ожидалось ровно одно вхождение в ${path}: ${source}`)
  }
  fs.writeFileSync(path, content.slice(0, first) + replacement + content.slice(first + source.length))
}

function replaceAllInFile(path: string, source: string, replacement: string): void {
  const content = fs.readFileSync(path, "utf8")
  if (!content.includes(source)) throw new Error(`Не найдено вхождение в ${path}: ${source}`)
  fs.writeFileSync(path, content.replaceAll(source, replacement))
}

function removeUnknownPropertyStates(path: string): void {
  const content = fs.readFileSync(path, "utf8")
  fs.writeFileSync(path, withoutUnsupportedConfigurationExtensionPropertyStates(content))
}

function temporaryDirectory(): string {
  const directory = join(temporaryRoot, String(temporaryDirectoryIndex++))
  fs.mkdirSync(directory)
  return directory
}

function readYaml(projectDir: string, relativePath: string): unknown {
  const parsed = parseWithJsYaml(readText(projectDir, relativePath))
  if (parsed.syntaxErrors.length > 0) throw parsed.syntaxErrors[0]
  return parsed.data
}

function readText(projectDir: string, relativePath: string): string {
  return fs.readFileSync(join(projectDir, ...relativePath.split("/")), "utf8")
}
