import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { expect, it, vi } from "vitest"
import * as knownValidation from "../packages/rules/metadata/importFromXml/serializedYamlValidation"
import "../packages/rules/tests/metadataExecutionContext"
import { mockContextFromXML } from "../packages/rules/tests/mockContext"
import { createImportProjectStateTestService, createXmlImportWorkerTestPool } from "../packages/rules/tests/xmlImportWorkerTestPool"
import { createPreparedYamlWorkerThreadPoolFactory } from "../packages/rules/tests/preparedYamlWorkerTestPool"
import { createPreparedYamlProjectWorkerPool } from "../packages/rules/metadata/project/preparedYamlProjectWorkerPool"
import { importConfigurationFromXml } from "../packages/rules/metadata/importFromXml/importConfiguration"
import { observeFinalImportYamlFacts } from "../packages/rules/tests/finalImportValidationProbe"
import type { PendingMetadataTargetReference } from "../packages/rules/metadata/validation/projectReferenceIndex"
import type { ValidationPendingCheck } from "../packages/rules/metadata/validation/projectValidationPendingChecks"
import { projectStatePendingCheck, projectStateOwnerFacts, projectStateFieldEntries, projectStateFormEntries, toProjectStateFileUpdate, type ProjectStateYamlFileUpdate } from "../packages/rules/metadata/projectState/fileUpdate"
import { ProjectStateSnapshotView } from "../packages/rules/metadata/projectState/binary/snapshot"
import { createTypedProjectStateReader } from "../packages/rules/metadata/projectState/binary/typedReader"
import { projectFormStructureDocuments } from "../packages/rules/metadata/project/projectStateYamlUpdate"

it.each([false, true])("не теряет окончательные факты XML; повторное измерение: %s", async (duplicateDimension) => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "nkdk-final-references-"))
  const projectDir = resolve(temporaryRoot, "project")
  mkdirSync(projectDir)
  let inputDir = resolve(import.meta.dirname, "fixtures/xml/cf")
  if (duplicateDimension) {
    const copiedInput = resolve(temporaryRoot, "xml")
    cpSync(inputDir, copiedInput, { recursive: true })
    inputDir = copiedInput
    const file = resolve(inputDir, "CalculationRegisters/РегистрРасчетаВсеСвойства/Recalculations/ПерерасчетВсеСвойства.xml")
    const xml = readFileSync(file, "utf8")
    const changed = xml.replace("<Name>ИзмерениеПоУмолчанию</Name>", "<Name>ИзмерениеПерерасчетаВсеСвойства</Name>")
      .replace("16783e34-9766-4fe1-89ea-39fba43ed0a9", "5684dcd4-1685-4fc0-879a-c584a0768a94")
      .replace('<xr:Item xsi:type="xr:MDObjectRef">CalculationRegister.РегистрРасчетаВедущий.Dimension.ИзмерениеПараметрыВыбора</xr:Item>', "")
    expect(changed).not.toBe(xml)
    writeFileSync(file, changed)
  }
  const pool = createXmlImportWorkerTestPool()
  const createWorkerPool = createPreparedYamlWorkerThreadPoolFactory()
  const projectState = createImportProjectStateTestService({
    createPool: concurrency => createPreparedYamlProjectWorkerPool({ concurrency, createWorkerPool }),
  })
  let comparisons = 0
  const rootValidation = vi.spyOn(knownValidation, "validateKnownProjectYaml")
  const languageDependencies = new Map<string, readonly { readonly key: string; readonly version: string }[]>()
  const ownerProjections = new Map<string, Pick<ProjectStateYamlFileUpdate, "owners" | "fields">>()
  const dependencyProjections = new Map<string, readonly string[]>()
  const formProjections = new Map<string, ProjectStateYamlFileUpdate["forms"]>()
  const structureProjections = new Map<string, ReturnType<typeof projectFormStructureDocuments>>()
  const targetProjections = new Map<string, ProjectStateYamlFileUpdate["targets"]>()
  const additional: { canonical: string; yamlPath: readonly (string | number)[] }[] = []
  const observation = observeFinalImportYamlFacts(({ params: validationParams, expected: finalExpected }) => {
      const facts = validationParams.facts
      const file = validationParams.file.projectPath
      if (finalExpected.validationContextDependencies !== undefined) {
        languageDependencies.set(validationParams.file.rootProjectPath, finalExpected.validationContextDependencies)
      }
      if (validationParams!.file.kind !== "form") expect(finalExpected.dependencies, file).toEqual([])
      const sourceFile = validationParams!.file
      const expectedUpdate = toProjectStateFileUpdate(finalExpected, {
        projectPath: sourceFile.rootProjectPath, componentPath: sourceFile.componentPath,
        resourceKind: "yaml", yamlRole: sourceFile.kind,
      })
      targetProjections.set(sourceFile.rootProjectPath, expectedUpdate.targets)
      expect.soft(validationParams.localValidation, file).toEqual(expectedUpdate.localValidation)
      const { ref: _ref, filePath: _filePath, fieldIndex: _fieldIndex, ...ownerValues } = finalExpected.objectRecords[0]?.ownerFacts ?? {}
      expect.soft(facts.ownerFacts ?? {}, file).toEqual(ownerValues)
      ownerProjections.set(validationParams!.file.rootProjectPath, {
        owners: finalExpected.objectRecords.flatMap(projectStateOwnerFacts),
        fields: finalExpected.objectRecords.flatMap(projectStateFieldEntries),
      })
      const objects = (entries: typeof finalExpected.objectIndexEntries) => [...entries].sort((a, b) => a.canonical.localeCompare(b.canonical))
      expect.soft(objects(facts.objectIndexEntries), file).toEqual(objects(finalExpected.objectIndexEntries))
      const addresses = (entries: typeof finalExpected.logicalAddresses) => [...(entries ?? [])].sort((a, b) => a.logicalAddress.localeCompare(b.logicalAddress))
      expect.soft(addresses(facts.logicalAddresses), file).toEqual(addresses(finalExpected.logicalAddresses))
      const expected = finalExpected.pendingReferences
      const expectedChecks = finalExpected.state.kind === "form" || finalExpected.state.kind === "properties"
        ? finalExpected.state.pendingChecks : []
      const actual = facts.references
      if (validationParams!.file.kind !== "form") structureProjections.set(validationParams!.file.rootProjectPath, finalExpected.structuredDocuments ?? [])
      const componentKeys = (components: typeof finalExpected.structuredComponents) => [...(components ?? [])]
        .sort((a, b) => JSON.stringify([a.componentKind, a.name, a.yamlPath]).localeCompare(JSON.stringify([b.componentKind, b.name, b.yamlPath])))
      expect.soft(componentKeys(facts.structuredComponents), file).toEqual(componentKeys(finalExpected.structuredComponents))
      if (validationParams!.file.kind === "form") {
        const source = validationParams!.file
        structureProjections.set(source.rootProjectPath, projectFormStructureDocuments({ projectDir, descriptor: {
          componentPath: source.componentPath, componentDir: source.componentDir, rootProjectPath: source.rootProjectPath,
          projectPath: source.projectPath, role: source.kind,
        }, components: finalExpected.structuredComponents }))
      }
      expect.soft(facts.localizedTextProperties > 0, `${file}: языковой контекст`)
        .toBe(finalExpected.validationContextDependencies !== undefined)
      const forms = projectStateFormEntries(finalExpected.form)
      expect.soft(projectStateFormEntries(facts.formIndex === undefined ? undefined : {
        owner: { kind: validationParams!.file.owner.dir, name: validationParams!.file.owner.name }, index: facts.formIndex,
      }), file).toEqual(forms)
      if (validationParams!.file.kind === "form") formProjections.set(validationParams!.file.rootProjectPath, forms)
      const actualDependencies = new Set(actual.map(reference => reference.canonical))
      expect.soft(finalExpected.dependencies.filter(canonical => !actualDependencies.has(canonical)), `${file}: зависимости`).toEqual([])
      expect.soft(facts.dependencies, file).toEqual([...actualDependencies])
      dependencyProjections.set(validationParams!.file.rootProjectPath,
        validationParams!.file.kind === "form" ? facts.dependencies : [...new Set(finalExpected.dependencies)])
      // Индекс формы хранится отдельно и не входит в запись pendingCheck.
      const checkKeys = (checks: readonly ValidationPendingCheck[]) => checks.map(projectStatePendingCheck)
        .sort((left, right) => JSON.stringify(left.yamlPath).localeCompare(JSON.stringify(right.yamlPath)))
      expect.soft(checkKeys(facts.checks), file).toEqual(checkKeys(expectedChecks))
      const key = (value: PendingMetadataTargetReference) => JSON.stringify([value.canonical, value.yamlPath])
      const present = new Set(actual.map(key))
      const missing = expected.filter(value => !present.has(key(value)))
      expect.soft(missing.map(key), file).toEqual([])
      for (const reference of expected) {
        const matching = actual.filter(value => key(value) === key(reference))
        expect.soft(matching.length, file).toBe(expected.filter(value => key(value) === key(reference)).length)
        for (const value of matching) {
          expect.soft({ target: value.target, constraint: value.constraint }, file)
            .toEqual({ target: reference.target, constraint: reference.constraint })
          expect.soft(value.xmlAnomaly, `${file}: ${JSON.stringify(reference.yamlPath)}`).toBe(reference.xmlAnomaly)
          if (reference.propertyStateMode !== undefined) expect.soft(value.propertyStateMode, file).toBe(reference.propertyStateMode)
        }
      }
      const previous = new Set(expected.map(key))
      additional.push(...actual.filter(value => !previous.has(key(value)))
        .map(({ canonical, yamlPath }) => ({ canonical, yamlPath })))
      comparisons += 1
  })
  try {
    const result = await importConfigurationFromXml({
      context: mockContextFromXML(), inputDir,
      projectDir, concurrency: 1, operationId: "final-references-parity", xmlImportWorkerPoolHandle: pool, projectState,
    })
    expect(result.failed.filter(value => value.code !== "project_validation")).toEqual([])
    expect(comparisons).toBeGreaterThan(100)
    expect(rootValidation).not.toHaveBeenCalled()
    const snapshot = new ProjectStateSnapshotView((await projectState.createReadToken(projectDir)).buffers)
    const reader = createTypedProjectStateReader(snapshot)
    for (const [projectPath, projection] of ownerProjections) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      expect(reader.owners(fileId!), projectPath).toEqual(projection.owners)
      expect(reader.fields(fileId!), projectPath).toEqual(projection.fields)
    }
    expect(languageDependencies.size).toBeGreaterThan(0)
    for (const [projectPath, targets] of targetProjections) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      const ordered = (values: typeof targets) => [...values].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      expect(ordered(reader.yamlFacts(fileId!)!.targets.filter(target => target.fileBacked === undefined)), projectPath)
        .toEqual(ordered(targets))
    }
    for (const [projectPath, documents] of structureProjections) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      const ordered = (values: typeof documents) => [...values].sort((a, b) => JSON.stringify([a.componentKind, a.name, a.yamlPath])
        .localeCompare(JSON.stringify([b.componentKind, b.name, b.yamlPath])))
      expect(ordered(reader.structuredDocuments(fileId!)), projectPath).toEqual(ordered(documents))
    }
    for (const [projectPath, forms] of formProjections) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      expect(reader.forms(fileId!), projectPath).toEqual(forms)
    }
    for (const [projectPath, dependencies] of dependencyProjections) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      expect(reader.yamlFacts(fileId!)?.dependencies, projectPath).toEqual(dependencies)
    }
    for (const [projectPath, expectedLanguages] of languageDependencies) {
      const fileId = snapshot.findFile(projectPath)
      expect(fileId, projectPath).toBeDefined()
      expect(reader.validationContextDependencies(fileId!), projectPath).toEqual(expectedLanguages)
    }
    // Старый снимок правил не описывает неявную цель MetadataFields и эти
    // вложенные коллекции. Новый список обязан индексировать их явные ссылки.
    const expectedAdditional = [
      // Снимок правил формы не раскрывает ссылки в ключах видимости элементов.
      ...[
        "КоманднаяПанель/Элементы/CommanBarButton",
        "КоманднаяПанель/Элементы/CommandBarHyperlink",
        "Элементы/Button",
        "Элементы/Hyperlink",
        "Элементы/ДекорацияКартинка",
        "Элементы/ДекорацияНадпись",
        "Элементы/Дерево",
        "Элементы/ДинамическийСписок",
        "Элементы/КоманднаяПанель",
        "Элементы/КоманднаяПанель/Элементы/ГруппаКнопок",
        "Элементы/КоманднаяПанель/Элементы/Подменю",
        "Элементы/ОбычнаяГруппа",
        "Элементы/ПолеHTMLДокумента",
        "Элементы/ПолеВвода",
        "Элементы/ПолеГеографическойСхемы",
        "Элементы/ПолеГрафическойСхемы",
        "Элементы/ПолеДендрограммы",
        "Элементы/ПолеДиаграммы",
        "Элементы/ПолеИндикатора",
        "Элементы/ПолеКалендаря",
        "Элементы/ПолеКартинки",
        "Элементы/ПолеНадписи",
        "Элементы/ПолеПереключателя",
        "Элементы/ПолеПериода",
        "Элементы/ПолеПланировщика",
        "Элементы/ПолеТабличногоДокумента",
        "Элементы/ПолеТекстовогоДокумента",
        "Элементы/ПолеФорматированногоДокумента",
        "Элементы/Страницы",
        "Элементы/Страницы/Элементы/Страница",
        "Элементы/Таблица",
        "Элементы/Таблица/Элементы/ПолеВводаВсеСвойства",
        "Элементы/Таблица/Элементы/ТаблицаКартинка",
        "Элементы/Таблица/Элементы/ТаблицаНадпись",
        "Элементы/Таблица/Элементы/ТаблицаФлажок",
        "Элементы/Таблица1/Элементы/ГруппаКолонок",
        "Элементы/Флажок",
        "Элементы/ЭлементФормы",
        "Элементы/ЭлементФормы",
        "Элементы/ЭлементФормы",
      ].map(path => ({ canonical: "Role.Администратор", yamlPath: ["Форма", ...path.split("/"), "Использование", "Роли", "Администратор"] })),
      ...[
        "BusinessProcess.БизнесПроцессВсеСвойства.StandardAttribute.Number",
        "Task.ЗадачаВсеСвойства.StandardAttribute.Number",
        "ChartOfCalculationTypes.ПланРасчетаВсеСвойства.StandardAttribute.Description",
        "ChartOfCharacteristicTypes.ПланВидовХарактеристикВсеСвойства.StandardAttribute.Code",
        "ChartOfAccounts.ПланСчетовВсеСвойства.StandardAttribute.Description",
      ].map(canonical => ({ canonical, yamlPath: ["ПоляБлокировкиДанных", 0] })),
      ...["Базовые", "Ведущие", "Вытесняющие"].map(property => ({
        canonical: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства.predefinedValue.ПредопредленноеВсе",
        yamlPath: ["Предопределенные", "Предопределенное2", property, 0],
      })),
      ...[
        "Catalog.СправочникВладелец", "Document.ДокументВсеСвойства",
        "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", "Catalog.СправочникПолный",
        "CalculationRegister.РегистрРасчетаВсеСвойства.Recalculation.ПерерасчетВсеСвойства",
      ].map((canonical, index) => ({ canonical, yamlPath: ["Состав", index, "Метаданные"] })),
    ]
    const ordered = (values: typeof additional) => values.map(value => JSON.stringify(value)).sort()
    expect(ordered(additional)).toEqual(ordered(expectedAdditional))
  } finally {
    observation.restore()
    rootValidation.mockRestore()
    await pool.close()
    await projectState.close()
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}, 120_000)
