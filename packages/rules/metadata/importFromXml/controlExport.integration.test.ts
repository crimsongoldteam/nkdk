import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import {
  compareXmlStructures,
  createConfigurationIndexCollector,
  createLocalConfigurationIndexReader,
  parseXmlDocumentWithSaxes,
  restoreXmlAnomalyAnnotations,
  serializeYAMLDocument,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { createValidationProjectComponent } from "../validation/projectComponents"
import { prepareFullXmlSyncAssignment } from "../fullSyncToXml/prepareAssignment"
import { buildPreparedAssignmentControlDocument } from "../fullSyncToXml/xmlAnomalyAssignment"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import {
  controlExportCountForTests,
  executeImportControlExport,
  resetControlExportCountForTests,
} from "./controlExport"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"

const syncXmlDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__/syncConfiguration/xml")
let topology: ReturnType<typeof createValidationProjectComponent>["topology"]
let catalogNode: NonNullable<typeof topology>["assignments"][number]
let catalogFormNode: NonNullable<typeof topology>["assignments"][number]
let exchangePlanNode: NonNullable<typeof topology>["assignments"][number]

describe("executeImportControlExport", () => {
  const tempDirs: string[] = []

  beforeAll(() => {
    topology = createValidationProjectComponent("/project", { kind: "configuration" }).topology
    const node = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Свойства.yaml",
    )
    if (node === undefined) throw new Error("Не найден topology-узел справочника")
    catalogNode = node
    const formNode = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    )
    if (formNode === undefined) throw new Error("Не найден topology-узел формы справочника")
    catalogFormNode = formNode
    const exchangeNode = topology.assignments.find(
      ({ projectPattern }) => projectPattern === "ПланОбмена/{ownerName}/Свойства.yaml",
    )
    if (exchangeNode === undefined) throw new Error("Не найден topology-узел плана обмена")
    exchangePlanNode = exchangeNode
  })
  beforeEach(resetControlExportCountForTests)
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("выполняет один обычный экспорт assignment независимо от числа PropertyRule", async () => {
    const ordinaryExporter = vi.fn(prepareFullXmlSyncAssignment)
    const { prepared, initialAnnotations, result } = await runCatalogControlExport(undefined, ordinaryExporter)

    expect(Object.keys(prepared.rule.properties).length).toBeGreaterThan(10)
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual(["Properties"])
    expect(ordinaryExporter).toHaveBeenCalledTimes(1)
    expect(ordinaryExporter).toHaveBeenCalledWith(expect.objectContaining({
      xmlAnomalyRawFallback: false,
    }))
    expect(controlExportCountForTests()).toBe(1)
  })

  it("считает фактический failed exporter invocation, но не ранний отказ projection", async () => {
    await expect(runCatalogControlExport(undefined, () => {
      throw new Error("ordinary exporter failed")
    })).rejects.toThrow("ordinary exporter failed")
    expect(controlExportCountForTests()).toBe(1)

    resetControlExportCountForTests()
    const assignment = { ...catalogAssignment(), targetProjectPath: "Неизвестно/Свойства.yaml" }
    await expect(executeCatalogControlExport({
      assignment,
      data: {},
      annotations: { version: 1, entries: [] },
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
    })).rejects.toThrow("content topology")
    expect(controlExportCountForTests()).toBe(0)
  })

  it("передаёт полный профиль без чтения XML ради UUID", async () => {
    const exportProfile: XmlComponentExportProfile = {
      componentKind: "configurationExtension",
      adoptedUuids: { "Справочник.Контрагенты": "11111111-1111-4111-8111-111111111111" },
      xmlDefaultVariantByLogicalAddress: {
        Конфигурация: "adopted",
        "Справочник.Контрагенты": "adopted",
      },
      typeDescriptionXMLNameByType: { AnyIBRef: "AnyRef" },
    }
    let captured: XmlComponentExportProfile | undefined

    await expect(executeImportControlExport({
      assignment: catalogAssignment(),
      data: {},
      annotations: { version: 1, entries: [] },
      audit: { sources: [], boundaries: [] },
      topology,
      context: {
        ...mockXmlImportContext(),
        fromXML: { forReference: false, componentKind: "configurationExtension" },
      },
      exportProfile,
      index: createLocalConfigurationIndexReader(new Map()),
      composition: catalogComposition(),
      ordinaryExporter(params) {
        captured = {
          componentKind: params.context.exportToXML.componentKind as "configurationExtension",
          adoptedUuids: params.context.exportToXML.adoptedUuids ?? {},
          xmlDefaultVariantByLogicalAddress:
            params.context.exportToXML.xmlDefaultVariantByLogicalAddress ?? {},
          typeDescriptionXMLNameByType:
            params.context.exportToXML.typeDescriptionXMLNameByType,
        }
        throw new Error("projection captured")
      },
    })).rejects.toThrow("projection captured")

    expect(captured).toEqual(exportProfile)
  })

  it("передаёт обычному экспорту подготовленный источник BaseForm", async () => {
    const index = createLocalConfigurationIndexReader(new Map())
    const baseConfigurationIndex = createLocalConfigurationIndexReader(new Map())
    const annotations = { version: 1 as const, entries: [] }
    const prepared = (projectPath: string, data: unknown) => ({
      projectPath,
      filePath: projectPath,
      role: "form" as const,
      owner: { dir: "Справочник", name: "Контрагенты" },
      data,
      annotations: restoreXmlAnomalyAnnotations(data, annotations),
      syntaxDiagnostics: [],
    })
    const baseFormSource = {
      kind: "projected" as const,
      baseForm: {
        projectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
        prepared: prepared("Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml", {}),
      },
      currentConfigurationForm: {
        projectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
        prepared: prepared("Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml", {}),
      },
    }
    let captured: Parameters<typeof prepareFullXmlSyncAssignment>[0] | undefined

    await expect(executeImportControlExport({
      assignment: catalogAssignment(),
      data: {},
      annotations,
      audit: { sources: [], boundaries: [] },
      topology,
      context: mockXmlImportContext(),
      exportProfile: configurationExportProfileForTests(),
      index,
      baseConfigurationIndex,
      composition: catalogComposition(),
      baseFormSource,
      ordinaryExporter(params) {
        captured = params
        throw new Error("projection captured")
      },
    })).rejects.toThrow("projection captured")

    expect(captured).toMatchObject({ baseFormSource, baseConfigurationIndex })
    expect(captured?.index).toBe(index)
    expect(captured?.baseConfigurationIndex).not.toBe(index)
  })

  it("не запускает ordinary exporter для корневого raw", async () => {
    const ordinaryExporter = vi.fn(() => { throw new Error("root raw не должен экспортироваться") })
    const annotations = {
      version: 1 as const,
      root: { kind: "raw" as const, occurrence: 1, target: "root" as const },
      entries: [],
    }

    const result = await executeCatalogControlExport({
      assignment: catalogAssignment(),
      data: { Future: "value" },
      annotations,
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
      ordinaryExporter,
    })

    expect(result).toEqual({
      data: { Future: "value" },
      annotations,
      rereadSourcePaths: [],
      warnings: [],
    })
    expect(ordinaryExporter).not.toHaveBeenCalled()
    expect(controlExportCountForTests()).toBe(0)
  })

  it("удаляет предварительный raw, если обычный экспорт восстановил XML без него", async () => {
    const { prepared, index } = await prepareCatalogControlInput()
    const data = {
      ...(prepared.yaml as Record<string, unknown>),
      ТипКода: "Число",
    }
    const initial = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
    const annotations = {
      ...initial,
      entries: [
        ...initial.entries,
        {
          parentPath: [],
          key: "ТипКода",
          annotation: { kind: "raw" as const, occurrence: 1, target: "value" as const },
        },
      ],
    }

    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      data,
      annotations,
    })

    expect((result.data as Record<string, unknown>).ТипКода).toBeUndefined()
    expect(result.annotations.entries).not.toEqual(expect.arrayContaining(annotations.entries))
    expect(newAnnotationKeys(annotations, result.annotations)).toEqual(["Properties"])
    expect(result.rereadSourcePaths).toEqual([])
  })

  it("полностью заменяет чтение дочерних файлов переданной composition", async () => {
    const { prepared, index } = await prepareCatalogControlInput()
    const cwd = process.cwd()
    const conflictCwd = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-composition-"))
    tempDirs.push(conflictCwd)
    fs.mkdirSync(join(conflictCwd, "Справочник/Контрагенты/Формы/ЛожнаяФорма"), { recursive: true })
    process.chdir(conflictCwd)
    const exists = vi.spyOn(fs, "existsSync").mockImplementation(() => {
      throw new Error("proof export не должен читать cwd")
    })
    const readdir = vi.spyOn(fs, "readdirSync").mockImplementation(() => {
      throw new Error("proof export не должен перечислять cwd")
    })

    try {
      const result = await executePreparedCatalogControlExport({
        prepared,
        index,
      })

      expect(result.rereadSourcePaths).toEqual([])
    } finally {
      exists.mockRestore()
      readdir.mockRestore()
      process.chdir(cwd)
    }
  })

  it("связывает property source только с точным output, а не со всеми необязательными", async () => {
    const assignment = catalogAssignment()
    const helpSourcePath = "/source/Catalogs/Контрагенты/Ext/Help.xml"
    const propertyTargets: string[] = []
    const ordinaryExporter = vi.fn((params: Parameters<typeof prepareFullXmlSyncAssignment>[0]) => {
      propertyTargets.push(...params.assignment.potentialOutputs
        .filter(({ role }) => role === "property")
        .map(({ targetXmlPath }) => targetXmlPath))
      throw new Error("projection captured")
    })

    await expect(executeCatalogControlExport({
      assignment: {
        ...assignment,
        xmlFiles: [
          ...assignment.xmlFiles,
          { role: "property", sourcePath: helpSourcePath },
        ],
      },
      data: {},
      annotations: { version: 1, entries: [] },
      audit: { sources: [], boundaries: [] },
      index: createLocalConfigurationIndexReader(new Map()),
      ordinaryExporter,
    })).rejects.toThrow("projection captured")

    expect(propertyTargets).toEqual([
      expect.stringMatching(/Catalogs\/Контрагенты\/Ext\/Help\.xml$/u),
    ])
  })

  it("локализует неканоническое число 01 и перечитывает только его source", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", "<CodeLength>01</CodeLength>"),
    )
    const { initialAnnotations, result } = await runCatalogControlExport(sourcePath)

    expect((result.data as Record<string, unknown>).ДлинаКода).toBe(1)
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "ДлинаКода",
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: { "#text": "01" },
          hasSemanticValue: true,
        },
      }),
    ]))
    expect(result.rereadSourcePaths).toEqual([])
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual([
      "ДлинаКода",
      "Properties",
    ])
    expect(controlExportCountForTests()).toBe(1)
  })

  it("сохраняет отсутствующий канонический реквизит точечным raw", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-exchange-plan-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "ПланОбменаВсеСвойства.xml")
    const fixture = fs.readFileSync(
      join(import.meta.dirname, "../appliedObjects/metadataExchangePlan/__fixtures__/full.xml"),
      "utf8",
    )
    const source = fixture.replace(
      /\s*<xr:StandardAttribute name="ExchangeDate">[\s\S]*?<\/xr:StandardAttribute>/u,
      "",
    )
    if (source === fixture) throw new Error("В fixture не найден ExchangeDate")
    fs.writeFileSync(sourcePath, source)
    const assignment = exchangePlanAssignment(sourcePath)
    const { prepared, index } = await prepareControlInput(assignment)
    let ordinaryExportParams: Parameters<typeof prepareFullXmlSyncAssignment>[0] | undefined

    const result = await executeImportControlExport({
      assignment,
      data: prepared.yaml,
      annotations: snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations),
      audit: prepared.proofAudit,
      rule: prepared.rule,
      topology,
      context: mockXmlImportContext(),
      exportProfile: configurationExportProfileForTests(),
      index,
      composition: { children: () => [] },
      ordinaryExporter(params) {
        ordinaryExportParams = params
        return prepareFullXmlSyncAssignment(params)
      },
    })
    const annotations = restoreXmlAnomalyAnnotations(result.data, result.annotations)
    const text = serializeYAMLDocument(result.data, annotations).text

    expect(text).toContain([
      "  ДатаОбмена: !xml/raw",
      "    $xml: null",
    ].join("\n"))
    expect(text).not.toContain("СтандартныеРеквизиты: !xml/raw")
    expect(text).not.toContain("name: !xml/raw")
    expect(result.warnings).toEqual([])

    if (ordinaryExportParams === undefined) throw new Error("Обычный экспорт плана обмена не был вызван")
    const focusedAnnotations = restoreXmlAnomalyAnnotations(result.data, {
      version: 1,
      entries: result.annotations.entries.filter(({ parentPath, key }) =>
        parentPath[0] === "СтандартныеРеквизиты" || key === "СтандартныеРеквизиты"
      ),
    })
    const exported = prepareFullXmlSyncAssignment({
      ...ordinaryExportParams,
      preparedYamlFile: {
        ...ordinaryExportParams.preparedYamlFile,
        data: result.data,
        annotations: focusedAnnotations,
      },
      xmlAnomalyRawFallback: true,
    })
    const metadata = exported.documents.find(({ targetXmlPath }) =>
      targetXmlPath.endsWith("/ПланОбменаВсеСвойства.xml")
    )
    if (metadata === undefined) throw new Error("Экспорт не подготовил XML плана обмена")
    const xml = buildPreparedAssignmentControlDocument({
      document: metadata,
      context: ordinaryExportParams.context,
    }).materializeXml()

    const sourceStandardAttributes = nestedXmlElement(
      parseXmlDocumentWithSaxes(source).roots[0]!,
      ["ExchangePlan", "Properties", "StandardAttributes"],
    )
    const exportedStandardAttributes = nestedXmlElement(
      parseXmlDocumentWithSaxes(xml).roots[0]!,
      ["ExchangePlan", "Properties", "StandardAttributes"],
    )
    expect(compareXmlStructures([sourceStandardAttributes], [exportedStandardAttributes])).toEqual([])
    expect(xml).not.toContain('name="ExchangeDate"')
    expect(xml).not.toContain("<_name>")
  })

  it("локализует неизвестный xsi:type на значении свойства", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-xsi-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", '<CodeLength xsi:type="xs:future">9</CodeLength>'),
    )
    const { initialAnnotations, result } = await runCatalogControlExport(sourcePath)

    expect((result.data as Record<string, unknown>).ДлинаКода).toBeUndefined()
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "ДлинаКода",
        annotation: expect.objectContaining({
          kind: "raw",
          xml: { "_xsi:type": "xs:future", "#text": "9" },
          hasSemanticValue: false,
        }),
      }),
    ]))
    expect(newAnnotationKeys(initialAnnotations, result.annotations)).toEqual([
      "ДлинаКода",
      "Properties",
    ])
    expect(controlExportCountForTests()).toBe(1)
  })

  it("не принимает неизвестный XML-узел Item за служебный элемент коллекции", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-item-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace("<CodeLength>9</CodeLength>", "<CodeLength>9</CodeLength><Item>future</Item>"),
    )

    const { prepared, index } = await prepareCatalogControlInput(sourcePath)
    const materializeXml = vi.fn<() => string>()
    const document = vi.fn()
    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      controlDocumentBuilder(params) {
        const control = buildPreparedAssignmentControlDocument(params)
        document.mockImplementation(control.document)
        return { ...control, materializeXml, document }
      },
    })

    expect(document).toHaveBeenCalledTimes(1)
    expect(materializeXml).not.toHaveBeenCalled()
    expect(prepared.proofAudit.documents).toHaveLength(1)
    expect(Object.prototype.hasOwnProperty.call(result.data, "Properties\\Item")).toBe(true)
    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        parentPath: [],
        key: "Properties\\Item",
        annotation: expect.objectContaining({ kind: "raw" }),
      }),
    ]))
  })

  it("не сохраняет raw-поправку, которая не меняет обычный xr:Item", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-control-export-known-item-"))
    tempDirs.push(inputDir)
    const sourcePath = join(inputDir, "Контрагенты.xml")
    fs.writeFileSync(
      sourcePath,
      fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
        .replace(
          "<Owners/>",
          '<Owners><xr:Item xsi:type="xr:MDObjectRef">Catalog.Контрагенты</xr:Item></Owners>',
        ),
    )
    const { prepared, index } = await prepareCatalogControlInput(sourcePath)
    const detailedAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)

    const result = await executePreparedCatalogControlExport({
      prepared,
      index,
      annotations: {
          ...detailedAnnotations,
          entries: [
            ...detailedAnnotations.entries,
            {
              parentPath: [],
              key: "Properties\\Owners\\xr:Item",
              annotation: {
                kind: "raw" as const,
                occurrence: 1,
                target: "value" as const,
                xml: { "_xsi:type": "xr:MDObjectRef" },
                hasSemanticValue: false,
              },
            },
          ],
        },
    })

    expect(result.annotations.entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Properties\\Owners\\xr:Item" }),
    ]))
  })

  it("сохраняет нестандартное имя singleton через !xml/name без raw", async () => {
    const sourceBody = fs.readFileSync(
      join(syncXmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"),
      "utf8",
    )
    const { assignment } = createCatalogFormInput(
      tempDirs,
      "nkdk-control-export-form-",
      sourceBody.replace("ПолеВвода1РасширеннаяПодсказка", "ПолеВвода1ExtendedTooltip"),
    )
    const { prepared, index } = await prepareControlInput(assignment)
    const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
    const result = await executePreparedFormControlExport(assignment, prepared, index, initialAnnotations)

    expect(result.rereadSourcePaths).toEqual([])
    expect(result.warnings).toEqual([])
    expect(serializeYAMLDocument(prepared.yaml).text)
      .toContain("Имя: !xml/name ПолеВвода1ExtendedTooltip")
    expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
      parentPath: ["Элементы", "ПолеВвода1"],
      key: "@Form\\РасширеннаяПодсказка",
    }))
    expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
      parentPath: [],
      key: "@Form",
    }))
  })

  it("локализует raw-поправки свёрнутых заголовков по отдельным командам формы", async () => {
    const { assignment, bodyPath } = createCatalogFormInput(tempDirs, "nkdk-control-export-form-commands-", [
      '<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core">',
      "  <Commands>",
      '    <Command name="ОК" id="1">',
      "      <Title>",
      "        <v8:item><v8:lang>ru</v8:lang><v8:content>ОК</v8:content></v8:item>",
      "        <v8:item><v8:lang>en</v8:lang><v8:content>OK</v8:content></v8:item>",
      "      </Title>",
      "      <Representation>TextPicture</Representation>",
      "    </Command>",
      '    <Command name="Отмена" id="2">',
      "      <Title>",
      "        <v8:item><v8:lang>ru</v8:lang><v8:content>Отмена</v8:content></v8:item>",
      "        <v8:item><v8:lang>en</v8:lang><v8:content>Cancel</v8:content></v8:item>",
      "      </Title>",
      "      <Representation>TextPicture</Representation>",
      "    </Command>",
      "  </Commands>",
      "</Form>",
    ].join("\n"))
    const { prepared, index } = await prepareControlInput(assignment)
    const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)

    expect(prepared.proofAudit.itemAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourcePath: bodyPath,
        xmlPath: "/Form[1]/Commands[1]/Command[1]",
        yamlPath: ["Команды", "ОК"],
      }),
      expect.objectContaining({
        sourcePath: bodyPath,
        xmlPath: "/Form[1]/Commands[1]/Command[2]",
        yamlPath: ["Команды", "Отмена"],
      }),
    ]))

    const result = await executePreparedFormControlExport(
      assignment,
      prepared,
      index,
      initialAnnotations,
    )

    expect(result.annotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ parentPath: ["Команды", "ОК"], key: "Заголовок" }),
      expect.objectContaining({ parentPath: ["Команды", "Отмена"], key: "Заголовок" }),
    ]))
    expect(result.annotations.entries.filter(({ key, annotation }) =>
      key === "Команды" && annotation.kind === "raw"
    )).toEqual([])
  })

  it("сохраняет строковый xsi:type числового MinValue через минимальный !xml/raw", async () => {
    const minMaxFixture = fs.readFileSync(
      join(import.meta.dirname, "../forms/elements/inputField/__fixtures__/minMaxStringType.xml"),
      "utf8",
    )
    const minMaxValues = minMaxFixture.match(/^\s*<(?:MinValue|MaxValue)\b.*<\/(?:MinValue|MaxValue)>$/gmu)
    if (minMaxValues?.length !== 2) throw new Error("В фикстуре не найдены MinValue и MaxValue")
    const sourceBody = fs.readFileSync(
      join(syncXmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"),
      "utf8",
    ).replace(
      "\t\t\t<ContextMenu",
      `${minMaxValues.map(value => `\t\t\t${value.trim()}`).join("\n")}\n\t\t\t<ContextMenu`,
    )
    const { assignment } = createCatalogFormInput(
      tempDirs,
      "nkdk-control-export-form-min-value-",
      sourceBody,
    )
    const { prepared, index } = await prepareControlInput(assignment)
    const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
    let ordinaryExportParams: Parameters<typeof prepareFullXmlSyncAssignment>[0] | undefined
    const result = await executePreparedFormControlExport(
      assignment,
      prepared,
      index,
      initialAnnotations,
      false,
      (params) => {
        ordinaryExportParams = params
        return prepareFullXmlSyncAssignment(params)
      },
    )

    expect(result.rereadSourcePaths).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.annotations.entries).toContainEqual({
      parentPath: ["Элементы", "ПолеВвода1"],
      key: "МинимальноеЗначение",
      annotation: {
        kind: "raw",
        occurrence: 1,
        target: "value",
        xml: { "_xsi:type": "xs:string" },
        hasSemanticValue: true,
      },
    })
    expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
      parentPath: ["Элементы", "ПолеВвода1"],
      key: "МаксимальноеЗначение",
    }))
    const annotations = restoreXmlAnomalyAnnotations(result.data, result.annotations)
    expect(serializeYAMLDocument(result.data, annotations).text).toContain([
      "    МинимальноеЗначение: !xml/raw",
      "      $значение: 1",
      "      $xml:",
      "        _xsi:type: xs:string",
    ].join("\n"))

    if (ordinaryExportParams === undefined) throw new Error("Обычный экспорт формы не был вызван")
    const exported = prepareFullXmlSyncAssignment({
      ...ordinaryExportParams,
      preparedYamlFile: {
        ...ordinaryExportParams.preparedYamlFile,
        data: result.data,
        annotations,
      },
      xmlAnomalyRawFallback: true,
    })
    const body = exported.documents.find(({ targetXmlPath }) => targetXmlPath.endsWith("/Ext/Form.xml"))
    if (body === undefined) throw new Error("Экспорт не подготовил Form.xml")
    const xml = buildPreparedAssignmentControlDocument({
      document: body,
      context: ordinaryExportParams.context,
    }).materializeXml()
    expect(xml).toContain('<MinValue xsi:type="xs:string">1</MinValue>')
    expect(xml).toContain('<MaxValue xsi:type="xs:decimal">99.99</MaxValue>')
  })

  it("не сохраняет raw пустых AdditionalColumns, восстановленных в Form.xml", async () => {
    const { assignment } = createCatalogFormInput(tempDirs, "nkdk-control-export-empty-additional-columns-", [
      '<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core">',
      "  <Attributes>",
      '    <Attribute name="Объект" id="1">',
      "      <Type><v8:Type>xs:string</v8:Type></Type>",
      '      <Columns><AdditionalColumns table="Объект.Пустая"/></Columns>',
      "    </Attribute>",
      "  </Attributes>",
      "</Form>",
    ].join("\n"))
    const { prepared, index } = await prepareControlInput(assignment)
    const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)

    expect(initialAnnotations.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Columns\\AdditionalColumns" }),
    ]))

    const result = await executePreparedFormControlExport(
      assignment,
      prepared,
      index,
      initialAnnotations,
      true,
    )

    expect(result.annotations.entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Columns\\AdditionalColumns" }),
    ]))
  })

  it("локализует raw заголовка дополнительной колонки на свойстве Заголовок", async () => {
    const { assignment } = createCatalogFormInput(tempDirs, "nkdk-control-export-additional-column-title-", [
      '<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core">',
      "  <Attributes>",
      '    <Attribute name="Объект" id="1">',
      "      <Type><v8:Type>xs:string</v8:Type></Type>",
      '      <Columns><AdditionalColumns table="Объект.Товары">',
      '        <Column name="ХарактеристикиИспользуются" id="2">',
      "          <Title>",
      "            <v8:item><v8:lang>ru</v8:lang><v8:content>Характеристики используются</v8:content></v8:item>",
      "            <v8:item><v8:lang>en</v8:lang><v8:content>Variants are used</v8:content></v8:item>",
      "          </Title>",
      "          <Type><v8:Type>xs:boolean</v8:Type></Type>",
      "        </Column>",
      "      </AdditionalColumns></Columns>",
      "    </Attribute>",
      "  </Attributes>",
      "</Form>",
    ].join("\n"))
    const { prepared, index } = await prepareControlInput(assignment)
    const result = await executePreparedFormControlExport(
      assignment,
      prepared,
      index,
      snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations),
    )
    const annotations = restoreXmlAnomalyAnnotations(result.data, result.annotations)
    const text = serializeYAMLDocument(result.data, annotations).text

    expect(text).toContain([
      "        ХарактеристикиИспользуются:",
      "          Заголовок: !xml/raw",
    ].join("\n"))
    expect(text).not.toContain("        ХарактеристикиИспользуются: !xml/raw")
  })

  it("сохраняет исходную компактную форму YAML при точном контрольном экспорте", async () => {
    const { assignment } = createCatalogFormInput(tempDirs, "nkdk-control-export-semantic-shape-", [
      '<Form xmlns="http://v8.1c.ru/8.3/xcf/logform"/>',
    ].join("\n"))
    const { prepared, index } = await prepareControlInput(assignment)
    const annotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
    const projectedData = { ...(prepared.yaml as Record<string, unknown>), Нормализовано: true }

    let sourceIndex = 0
    const result = await executePreparedFormControlExport(
      assignment,
      prepared,
      index,
      annotations,
      false,
      (params) => {
        const exported = prepareFullXmlSyncAssignment(params)
        return {
          ...exported,
          semanticYamlFile: {
            ...exported.semanticYamlFile,
            data: projectedData,
          },
        }
      },
      (params) => {
        const control = buildPreparedAssignmentControlDocument(params)
        const source = prepared.proofAudit.sources[sourceIndex++]
        if (source === undefined) throw new Error("Для контрольного документа не найден исходный XML")
        return {
          ...control,
          roots: source.roots.map(({ xmlPath: path, elementName: name, structuralHash }) => ({
            name,
            path,
            structuralHash,
          })),
        }
      },
    )

    expect(result.data).toBe(prepared.yaml)
    expect(result.annotations).toBe(annotations)
  })
})

async function runCatalogControlExport(
  sourcePath?: string,
  ordinaryExporter?: typeof prepareFullXmlSyncAssignment,
) {
  const { prepared, index } = await prepareCatalogControlInput(sourcePath)
  const initialAnnotations = snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations)
  const result = await executePreparedCatalogControlExport({
    prepared,
    index,
    annotations: initialAnnotations,
    ...(ordinaryExporter === undefined ? {} : { ordinaryExporter }),
  })
  return { prepared, initialAnnotations, result }
}

async function prepareCatalogControlInput(sourcePath?: string) {
  return prepareControlInput(catalogAssignment(sourcePath))
}

async function prepareControlInput(assignment: ImportAssignment) {
  const collector = createConfigurationIndexCollector()
  const prepared = await prepareImportYaml({
    assignment,
    context: mockXmlImportContext(),
    collector,
    topology,
  })
  const fragment = collector.fragment(prepared.targetProjectPath)
  const index = createLocalConfigurationIndexReader(new Map([
    [fragment.targetProjectPath, { entities: fragment.entities }],
  ]))
  return { prepared, index }
}

async function executePreparedCatalogControlExport(params: {
  prepared: Awaited<ReturnType<typeof prepareImportYaml>>
  index: ReturnType<typeof createLocalConfigurationIndexReader>
  data?: unknown
  annotations?: ReturnType<typeof snapshotXmlAnomalyAnnotations>
  ordinaryExporter?: typeof prepareFullXmlSyncAssignment
  controlDocumentBuilder?: typeof buildPreparedAssignmentControlDocument
}) {
  return executeCatalogControlExport({
    assignment: params.prepared.assignment,
    data: params.data ?? params.prepared.yaml,
    annotations: params.annotations
      ?? snapshotXmlAnomalyAnnotations(params.prepared.yaml, params.prepared.annotations),
    audit: params.prepared.proofAudit,
    rule: params.prepared.rule,
    index: params.index,
    ...(params.ordinaryExporter === undefined ? {} : { ordinaryExporter: params.ordinaryExporter }),
    ...(params.controlDocumentBuilder === undefined
      ? {}
      : { controlDocumentBuilder: params.controlDocumentBuilder }),
  })
}

function executeCatalogControlExport(
  params: Omit<
    Parameters<typeof executeImportControlExport>[0],
    "topology" | "context" | "composition" | "exportProfile"
  > & { readonly exportProfile?: XmlComponentExportProfile },
) {
  return executeImportControlExport({
    ...params,
    topology,
    context: mockXmlImportContext(),
    composition: catalogComposition(),
    exportProfile: params.exportProfile ?? configurationExportProfileForTests(),
  })
}

function configurationExportProfileForTests(): XmlComponentExportProfile {
  return {
    componentKind: "configuration",
    adoptedUuids: {},
    xmlDefaultVariantByLogicalAddress: {},
  }
}

function newAnnotationKeys(
  before: ReturnType<typeof snapshotXmlAnomalyAnnotations>,
  after: ReturnType<typeof snapshotXmlAnomalyAnnotations>,
): (string | number)[] {
  const existing = new Set(before.entries.map((entry) => JSON.stringify(entry)))
  return after.entries.filter((entry) => !existing.has(JSON.stringify(entry))).map(({ key }) => key)
}

function catalogComposition() {
  return {
    children(ownerLogicalAddress: string) {
      if (ownerLogicalAddress !== "Справочник.Контрагенты") return []
      return [{
        sourceProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "ФормаЭлемента",
        logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
        assignmentRole: "fileItem" as const,
        ownerLogicalAddress,
      }]
    },
  }
}

function catalogAssignment(sourcePath = join(syncXmlDir, "Catalogs/Контрагенты.xml")): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
    topologyAddress: { nodeId: catalogNode.id, values: { ownerName: "Контрагенты" } },
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}

function exchangePlanAssignment(sourcePath: string): ImportAssignment {
  const ownerName = "ПланОбменаВсеСвойства"
  return {
    id: "exchange-plan",
    role: "properties",
    topologyAddress: { nodeId: exchangePlanNode.id, values: { ownerName } },
    targetProjectPath: `ПланОбмена/${ownerName}/Свойства.yaml`,
    itemType: "MetadataExchangePlan",
    itemName: ownerName,
    logicalAddress: `ПланОбмена.${ownerName}`,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}

function nestedXmlElement(
  root: ReturnType<typeof parseXmlDocumentWithSaxes>["roots"][number],
  names: readonly string[],
) {
  let current = root
  for (const name of names) {
    const child = current.content.find((node) => node.type === "element" && node.name === name)
    if (child === undefined || child.type !== "element") throw new Error(`Не найден XML-элемент ${name}`)
    current = child
  }
  return current
}

function catalogFormAssignment(metadataPath: string, bodyPath: string): ImportAssignment {
  return {
    id: "catalog-form",
    role: "fileItem",
    topologyAddress: {
      nodeId: catalogFormNode.id,
      values: { ownerName: "Контрагенты", itemName: "ФормаЭлемента" },
    },
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
      { role: "metadata", sourcePath: metadataPath },
      { role: "body", sourcePath: bodyPath },
    ],
    externalFiles: [],
  }
}

function createCatalogFormInput(
  tempDirs: string[],
  prefix: string,
  bodyXml: string,
): { assignment: ImportAssignment; bodyPath: string } {
  const inputDir = fs.mkdtempSync(join(os.tmpdir(), prefix))
  tempDirs.push(inputDir)
  const fixtureDir = join(syncXmlDir, "Catalogs/Контрагенты/Forms")
  const metadataPath = join(inputDir, "ФормаЭлемента.xml")
  const bodyPath = join(inputDir, "Form.xml")
  fs.copyFileSync(join(fixtureDir, "ФормаЭлемента.xml"), metadataPath)
  fs.writeFileSync(bodyPath, bodyXml)
  return { assignment: catalogFormAssignment(metadataPath, bodyPath), bodyPath }
}

async function executePreparedFormControlExport(
  assignment: ImportAssignment,
  prepared: Awaited<ReturnType<typeof prepareControlInput>>["prepared"],
  index: Awaited<ReturnType<typeof prepareControlInput>>["index"],
  annotations: ReturnType<typeof snapshotXmlAnomalyAnnotations>,
  _detailed = false,
  ordinaryExporter?: typeof prepareFullXmlSyncAssignment,
  controlDocumentBuilder?: typeof buildPreparedAssignmentControlDocument,
) {
  return executeImportControlExport({
    assignment,
    data: prepared.yaml,
    annotations,
    audit: prepared.proofAudit,
    rule: prepared.rule,
    topology,
    context: mockXmlImportContext(),
    exportProfile: configurationExportProfileForTests(),
    index,
    composition: { children: () => [] },
    ...(ordinaryExporter === undefined ? {} : { ordinaryExporter }),
    ...(controlDocumentBuilder === undefined ? {} : { controlDocumentBuilder }),
  })
}
