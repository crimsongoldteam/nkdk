import {
createConfigurationIndexCollector,
parseMetadataYamlData,
snapshotXmlAnomalyAnnotations
} from "@nkdk/runtime"
import { currentRuleRegistrySet,withRuleRegistrySet,type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach,describe,expect,it,vi } from "vitest"
import "../../tests/metadataExecutionContext"
import { mockXmlImportContext } from "../../tests/mockContext"
import {
ClientApplicationFormRules,
ClientApplicationFormWithExtendedPresentationRules,
} from "../forms/clientApplicationForm/rules"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createOperationProfiler } from "../validation/profile"
import { discoverXmlImport } from "./discovery"
import {
prepareImportYaml,
importAuditOutcomeCountForTests,
registeredImportRuleLookupCountForTests,
resetImportAuditOutcomeCountForTests,
resetRootProofParsePassCountForTests,
resetRegisteredImportRuleLookupCountForTests,
rootProofParsePassCountForTests,
resolveAssignmentRule,
} from "./prepareYaml"
import type { ImportAssignment } from "./types"
import {
createPreparedImportRecordSource,
encodePreparedImportRecord,
restorePreparedImportRecord,
} from "./preparedRecord"

const configurationFixturesDir = join(import.meta.dirname, "../appliedObjects/configuration/__fixtures__")
const syncXmlDir = join(configurationFixturesDir, "syncConfiguration/xml")
const catalogSyncFixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/sync/xml")
const subsystemFixturePath = join(import.meta.dirname, "../appliedObjects/metadataSubsystem/__fixtures__/full.xml")
const extensionFixtureDir = join(import.meta.dirname, "__fixtures__/configurationExtension")
const AlternateComponentRootRule = { itemType: "MetadataAlternateComponent", properties: {} } as MetadataItemRule

function metadataImportAssignment(params: {
  id: string
  targetProjectPath: string
  itemType: string
  itemName: string
  logicalAddress: string
  metadataPath: string
}): ImportAssignment {
  return {
    id: params.id,
    topologyAddress: assignmentTopologyAddress(params.targetProjectPath),
    role: "properties",
    targetProjectPath: params.targetProjectPath,
    itemType: params.itemType,
    itemName: params.itemName,
    logicalAddress: params.logicalAddress,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: params.metadataPath }],
    externalFiles: [],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("prepareImportYaml", () => {
  it("uses the component kind to resolve the configuration root rule", () => {
    const current = currentRuleRegistrySet<RuleRegistrySet>()
    if (current === undefined) throw new Error("Не задан тестовый rule registry")
    const components = new Map(current.components)
    components.set("externalReport", { kind: "externalReport", rootRule: AlternateComponentRootRule })

    withRuleRegistrySet({ ...current, components }, () => {
      expect(resolveAssignmentRule(
        {
          ...catalogAssignment(),
          role: "configuration",
        },
        "externalReport"
      )).toBe(AlternateComponentRootRule)
    })
  })

  it("resolves a specialized form rule by topology node", () => {
    const topology = compileRegisteredMetadataResourceTopology()
    const processorFormNode = topology.assignments.find(
      ({ projectPattern }) =>
        projectPattern ===
        "Обработка/{ownerName}/Формы/{itemName}/Форма.yaml"
    )
    if (processorFormNode === undefined) {
      throw new Error("Не найден узел формы обработки")
    }

    expect(
      resolveAssignmentRule(
        {
          ...catalogAssignment(),
          role: "fileItem",
          topologyAddress: {
            nodeId: processorFormNode.id,
            values: { ownerName: "Загрузка", itemName: "Форма" },
          },
          itemType: ClientApplicationFormRules.itemType,
        },
        "configuration"
      )
    ).toBe(ClientApplicationFormWithExtendedPresentationRules)
    expect(() => resolveAssignmentRule(
      {
        ...catalogAssignment(),
        role: "fileItem",
        topologyAddress: { nodeId: "unknown-node", values: {} },
      },
      "configuration",
      topology,
    )).toThrow("Не найден узел topology XML-import: unknown-node")
  })

  it("prepares a processor form with the rule selected by topology", async () => {
    const inputDir = fs.mkdtempSync(
      join(os.tmpdir(), "nkdk-import-processor-form-")
    )
    try {
      const metadataPath = join(inputDir, "Форма.xml")
      const bodyPath = join(inputDir, "Form.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties>
      <Name>Форма</Name>
      <FormType>Managed</FormType>
      <ExtendedPresentation/>
    </Properties>
  </Form>
</MetaDataObject>`
      )
      fs.writeFileSync(
        bodyPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <ChildItems>
    <Table name="Таблица" id="1">
      <DataPath>Объект.ТабличнаяЧасть</DataPath>
      <RowFilter xsi:nil="true"/>
    </Table>
  </ChildItems>
</Form>`
      )
      const topology = compileRegisteredMetadataResourceTopology()
      const processorFormNode = topology.assignments.find(
        ({ projectPattern }) =>
          projectPattern ===
          "Обработка/{ownerName}/Формы/{itemName}/Форма.yaml"
      )
      if (processorFormNode === undefined) {
        throw new Error("Не найден узел формы обработки")
      }
      const prepared = await prepareImportYaml({
        assignment: {
          id: "processor-form",
          topologyAddress: {
            nodeId: processorFormNode.id,
            values: { ownerName: "Загрузка", itemName: "Форма" },
          },
          role: "fileItem",
          targetProjectPath:
            "Обработка/Загрузка/Формы/Форма/Форма.yaml",
          itemType: "ClientApplicationForm",
          itemName: "Форма",
          logicalAddress: "Обработка.Загрузка.Форма.Форма",
          owner: {
            itemType: "MetadataDataProcessor",
            name: "Загрузка",
            logicalAddress: "Обработка.Загрузка",
          },
          xmlFiles: [
            { role: "metadata", sourcePath: metadataPath },
            { role: "body", sourcePath: bodyPath },
          ],
          externalFiles: [],
        },
        context: mockXmlImportContext(),
        collector: createConfigurationIndexCollector(),
      })

      expect(prepared.rule).toBe(
        ClientApplicationFormWithExtendedPresentationRules
      )
      expect(prepared.yaml).not.toHaveProperty(
        "РасширенноеПредставление"
      )
      expect(prepared.proofAudit.boundaries).toContainEqual(expect.objectContaining({
        sourceRole: "body",
        xmlPath: "/Form[1]/ChildItems[1]/Table[1]/RowFilter[1]",
        yamlPath: ["Элементы", "Таблица", "ОтборСтрок"],
        auditState: "structurallyClaimed",
      }))
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("imports a common form through the standard nested rules converter", async () => {
    const fixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCommonForm/__fixtures__/sync")
    const collector = createConfigurationIndexCollector()
    const profiler = createOperationProfiler({
      operation: "import-from-xml",
      scope: { scope: "worker", workerIndex: 0 },
      aggregate: true,
    })
    const prepared = await prepareImportYaml({
      assignment: {
        id: "common-form",
        topologyAddress: assignmentTopologyAddress("ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml"),
        role: "properties",
        targetProjectPath: "ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml",
        itemType: "MetadataCommonForm",
        itemName: "КонстантаВсеСвойства",
        logicalAddress: "ОбщаяФорма.КонстантаВсеСвойства",
        owner: undefined,
        xmlFiles: [
          { role: "metadata", sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства.xml") },
          { role: "property", sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства/Ext/Form.xml") },
        ],
        externalFiles: [],
      },
      context: mockXmlImportContext(),
      collector,
      profiler,
    })
    const expected = parseMetadataYamlData(
      fs.readFileSync(join(fixtureDir, "yaml/КонстантаВсеСвойства/Свойства.yaml"), "utf8")
    )
    delete ((expected.data as { Форма?: Record<string, unknown> }).Форма)?.КоманднаяПанель

    expect(expected.syntaxErrors).toEqual([])
    expect(prepared.yaml).toEqual(expected.data)
    expect(prepared.localIndexes.metadata.formDataPathIndex?.getRoot("НаборКонстант"))
      .toMatchObject({ name: "НаборКонстант" })
    expect(profiler.records().map(({ substep }) => substep)).not.toContain(
      "XML в YAML: атомарный тип ClientApplicationForm"
    )
    const substeps = profiler.records().map(({ substep }) => substep)
    expect(substeps).toContain("XML в YAML: подготовка плана импорта")
    expect(substeps).toContain("XML в YAML: обход XML")
    expect(substeps).not.toContain("XML в YAML: определение порядка свойств")
    expect(substeps).not.toContain("XML в YAML: выбор свойств")
    expect(prepared.proofAudit.fallbackBoundaries).toContainEqual(expect.objectContaining({
      sourceRole: "property",
      xmlPath: "/Form[1]",
      yamlPath: ["Форма"],
    }))
    expect(prepared.proofAudit.boundaries).not.toContainEqual(expect.objectContaining({
      sourceRole: "property",
      xmlPath: "/Form[1]",
      yamlPath: ["Форма"],
    }))
    expect(prepared.proofAudit.itemAnchors).toContainEqual({
      sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства/Ext/Form.xml"),
      xmlPath: "/Form[1]/Attributes[1]/Attribute[1]",
      yamlPath: ["Форма", "Реквизиты", "НаборКонстант"],
      rulePath: ["form", "attributes"],
    })
    expect(collector.fragment("ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "ОбщаяФорма.КонстантаВсеСвойства.Элемент.КонстантаВсеСвойства",
      xmlId: "1",
    })
  })

  it("удерживает BaseForm встроенной общей формы как изолированный YAML-кандидат", async () => {
    const fixtureDir = join(import.meta.dirname, "../appliedObjects/metadataCommonForm/__fixtures__/sync")
    const prepared = await prepareImportYaml({
      assignment: {
        id: "borrowed-common-form",
        topologyAddress: assignmentTopologyAddress("ОбщаяФорма/InputField/Свойства.yaml"),
        role: "properties",
        targetProjectPath: "ОбщаяФорма/InputField/Свойства.yaml",
        itemType: "MetadataCommonForm",
        itemName: "InputField",
        logicalAddress: "ОбщаяФорма.InputField",
        owner: undefined,
        xmlFiles: [
          { role: "metadata", sourcePath: join(fixtureDir, "xml/КонстантаВсеСвойства.xml") },
          {
            role: "body",
            sourcePath: join(
              extensionFixtureDir,
              "Catalogs/СправочникПолный/Forms/ФормаОтчета/Ext/Form.xml",
            ),
          },
        ],
        externalFiles: [],
      },
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.baseFormCandidate).toMatchObject({
      baseProjectPath: "ОбщаяФорма/InputField/Свойства.yaml",
      targetProjectPath: "ОбщаяФорма/InputField/БазоваяФорма.yaml",
      yaml: {
        Реквизиты: { БазовыйРеквизитФормы: { Тип: "Дата" } },
        Элементы: { БазовоеПоле: { Вид: "ПолеВвода", Ширина: 99 } },
      },
    })
  })

  it("prepares an applied object without writing YAML or external files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment = catalogAssignment()
    const collector = createConfigurationIndexCollector()

    const prepared = await prepareImportYaml({
      assignment,
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.assignment).toBe(assignment)
    expect(prepared.targetProjectPath).toBe("Справочник/Контрагенты/Свойства.yaml")
    expect(prepared.yaml).toMatchObject({ Синоним: "Контрагенты справочник" })
    expect(prepared.localIndexes).toEqual(expect.any(Object))
    expect(prepared.deferred).toEqual(expect.any(Array))
    for (const deferred of prepared.deferred) {
      expect(deferred.target.object).toBe(
        deferred.valuePath
          .slice(0, -1)
          .reduce<unknown>((value, segment) => (value as Record<string | number, unknown>)[segment], prepared.yaml)
      )
    }
    expect(prepared.localIndexes).not.toHaveProperty("dependencies")
    expect(prepared).not.toHaveProperty("model")
    expect(prepared).not.toHaveProperty("xml")
    expect(prepared.generatedFiles).toEqual([])
    expect(JSON.stringify(prepared.yaml)).not.toContain("ФормаЭлемента")
    expect(collector.fragment(assignment.targetProjectPath).entities).toContainEqual({
      logicalAddress: "Справочник.Контрагенты",
      uuid: "0f4c2a9b-1d3e-4b6f-8a7c-9e1d2c3b4a5f",
    })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("сохраняет raw заведомо неизвестного XML без контрольного экспорта", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-proof-audit-"))
    try {
      const metadataPath = join(inputDir, "Контрагенты.xml")
      fs.writeFileSync(
        metadataPath,
        fs.readFileSync(join(syncXmlDir, "Catalogs/Контрагенты.xml"), "utf8")
          .replace("\t\t</Properties>", "\t\t\t<Future code=\"x\">value</Future>\n\t\t</Properties>"),
      )
      const prepared = await prepareImportYaml({
        assignment: { ...catalogAssignment(), xmlFiles: [{ role: "metadata", sourcePath: metadataPath }] },
        context: mockXmlImportContext(),
        collector: createConfigurationIndexCollector(),
      })
      const yaml = prepared.yaml as Record<string, unknown>

      expect(yaml["Properties\\Future"]).toBeUndefined()
      expect(prepared.annotations.at(yaml, "Properties\\Future")).toEqual(expect.objectContaining({
        kind: "raw",
        occurrence: 1,
        target: "value",
        hasSemanticValue: false,
        xml: { _code: "x", "#text": "value" },
      }))
      expect(snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations).entries).toEqual(
        expect.arrayContaining([expect.objectContaining({ parentPath: [], key: "Properties\\Future" })]),
      )
      expect(prepared.proofAudit.sources).toEqual([
        expect.objectContaining({ sourcePath: metadataPath, role: "metadata" }),
      ])
      expect(prepared.proofAudit.boundaries).toEqual(expect.arrayContaining([
        expect.objectContaining({ yamlPath: ["ДлинаКода"], presentInSource: true }),
      ]))
      expect(prepared.proofAudit.sources[0]?.roots[0]).not.toHaveProperty("attributes")
      expect(prepared.proofAudit.sources[0]?.roots[0]).not.toHaveProperty("content")
      expect(prepared.proofAudit.boundaries[0]?.levels[0]).not.toHaveProperty("compatibilityValue")
      expect(prepared.proofAudit.boundaries[0]?.levels[0]).not.toHaveProperty("attributes")
      expect(prepared.proofAudit.boundaries[0]?.levels[0]).not.toHaveProperty("content")
      expect(prepared).not.toHaveProperty("xml")
      expect(prepared).not.toHaveProperty("document")
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("для обычного первого прохода сохраняет только хэши корней proof", async () => {
    resetImportAuditOutcomeCountForTests()
    resetRootProofParsePassCountForTests()
    const prepared = await prepareImportYaml({
      assignment: catalogAssignment(),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
      proofDetail: "roots",
    })

    expect(prepared.proofAudit.sources).toHaveLength(1)
    expect(prepared.proofAudit.sources[0]?.roots).not.toEqual([])
    expect(prepared.proofAudit.boundaries).toEqual([])
    expect(prepared.proofAudit.itemAnchors).toEqual([])
    expect(importAuditOutcomeCountForTests()).toBe(0)
    expect(rootProofParsePassCountForTests()).toBe(1)
  })

  it.each([
    [
      "DocumentNumerator",
      "MetadataDocumentNumerator",
      "НумераторПоУмолчанию",
      "Нумератор/НумераторПоУмолчанию.yaml",
      "../appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml",
    ],
    [
      "Document",
      "MetadataDocument",
      "ДокументПоУмолчанию",
      "Документ/ДокументПоУмолчанию/Свойства.yaml",
      "../appliedObjects/metadataDocument/__fixtures__/minimal.xml",
    ],
    [
      "Sequence",
      "MetadataSequence",
      "ПоследовательностьПоУмолчанию",
      "Последовательность/ПоследовательностьПоУмолчанию/Свойства.yaml",
      "../appliedObjects/metadataSequence/__fixtures__/minimal.xml",
    ],
  ])("prepares %s through the direct XML to YAML traversal", async (_label, itemType, itemName, target, fixture) => {
    const prepared = await prepareImportYaml({
      assignment: {
        id: itemName,
        topologyAddress: assignmentTopologyAddress(target),
        role: "properties",
        targetProjectPath: target,
        itemType,
        itemName,
        logicalAddress: `${itemType}.${itemName}`,
        owner: undefined,
        xmlFiles: [{ role: "metadata", sourcePath: join(import.meta.dirname, fixture) }],
        externalFiles: [],
      },
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
  })

  it("creates the child logical address before importing child properties", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-child-address-"))
    const metadataPath = join(inputDir, "ТестСправочник.xml")
    try {
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses">
  <Catalog uuid="00000000-0000-0000-0000-000000000001">
    <Properties><Name>ТестСправочник</Name></Properties>
    <ChildObjects><Command uuid="00000000-0000-0000-0000-000000000002"><Properties><Name>Обновить</Name></Properties></Command></ChildObjects>
  </Catalog>
</MetaDataObject>`
      )
      const collector = createConfigurationIndexCollector()
      const targetProjectPath = "Справочник/ТестСправочник/Свойства.yaml"
      await prepareImportYaml({
        assignment: metadataImportAssignment({
          id: "catalog-with-command",
          targetProjectPath,
          itemType: "MetadataCatalog",
          itemName: "ТестСправочник",
          logicalAddress: "Справочник.ТестСправочник",
          metadataPath,
        }),
        context: mockXmlImportContext(),
        collector,
      })

      expect(collector.fragment(targetProjectPath).entities).toContainEqual({
        logicalAddress: "Справочник.ТестСправочник.Команда.Обновить",
        uuid: "00000000-0000-0000-0000-000000000002",
      })
    } finally { fs.rmSync(inputDir, { recursive: true, force: true }) }
  })

  it("prepares a nested file item through its registered metadata rule", async () => {
    const assignment: ImportAssignment = {
      id: "nested-subsystem",
      topologyAddress: assignmentTopologyAddress(
        "Подсистема/Родитель/Подсистемы/Дочерняя/Свойства.yaml",
      ),
      role: "fileItem",
      targetProjectPath: "Подсистема/Родитель/Подсистемы/Дочерняя/Свойства.yaml",
      itemType: "MetadataSubsystem",
      itemName: "ПодсистемаПолная",
      logicalAddress: "Подсистема.Родитель.MetadataSubsystem.ПодсистемаПолная",
      owner: {
        itemType: "MetadataSubsystem",
        name: "Родитель",
        logicalAddress: "Подсистема.Родитель",
      },
      xmlFiles: [{ role: "metadata", sourcePath: subsystemFixturePath }],
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.rule.itemType).toBe("MetadataSubsystem")
    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared.localIndexes.metadata.formDataPathIndex).toBeUndefined()
  })

  it("не ищет правило задания повторно после получения topology-адреса", async () => {
    resetRegisteredImportRuleLookupCountForTests()
    const assignment = catalogAssignment()

    await prepareImportYaml({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })
    await prepareImportYaml({
      assignment: { ...assignment, id: "catalog-copy" },
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(registeredImportRuleLookupCountForTests()).toBe(0)
  })

  it("discovers a fixture child template as an owner external file and prepares only the owner model", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-child-template-"))
    const ownerName = "СправочникCоВсемиОбъектами"
    const ownerRoot = join(inputDir, "Catalogs", ownerName)
    try {
      fs.mkdirSync(join(ownerRoot, "Templates", "Макет", "Ext"), { recursive: true })
      fs.copyFileSync(join(catalogSyncFixtureDir, `${ownerName}.xml`), `${ownerRoot}.xml`)
      fs.copyFileSync(join(catalogSyncFixtureDir, "Templates", "Макет.xml"), join(ownerRoot, "Templates", "Макет.xml"))
      fs.copyFileSync(
        join(catalogSyncFixtureDir, "Templates", "Макет", "Ext", "Template.txt"),
        join(ownerRoot, "Templates", "Макет", "Ext", "Template.txt")
      )

      const discovered = await discoverXmlImport({
        xmlDir: inputDir,
        topology: compileRegisteredMetadataResourceTopology(),
      })
      const prepared = await Promise.all(
        discovered.assignments.map((assignment) =>
          prepareImportYaml({
            assignment,
            context: mockXmlImportContext(),
            collector: createConfigurationIndexCollector(),
          })
        )
      )

      expect(prepared).toHaveLength(1)
      expect(prepared[0]?.yaml).toEqual(expect.any(Object))
      expect(prepared[0]?.assignment.externalFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sourcePath: join(ownerRoot, "Templates", "Макет.xml"),
            targetProjectPath: `Справочник/${ownerName}/Шаблоны/Макет/Template.xml`,
          }),
        ])
      )
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("prepares Конфигурация.yaml without writing files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const assignment: ImportAssignment = {
      id: "configuration",
      topologyAddress: assignmentTopologyAddress("Конфигурация.yaml"),
      role: "configuration",
      targetProjectPath: "Конфигурация.yaml",
      itemType: "MetadataConfiguration",
      itemName: "Конфигурация",
      logicalAddress: "Конфигурация",
      owner: undefined,
      xmlFiles: [{ role: "metadata", sourcePath: join(configurationFixturesDir, "full.xml") }],
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.targetProjectPath).toBe("Конфигурация.yaml")
    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared).not.toHaveProperty("model")
    expect(prepared.generatedFiles).toEqual([])
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("reads both form XML inputs without loading the owner model or writing files", async () => {
    const writeFile = vi.spyOn(fs.promises, "writeFile")
    const readFile = vi.spyOn(fs.promises, "readFile")
    const formRoot = join(syncXmlDir, "Catalogs/Контрагенты/Forms/ФормаЭлемента")
    const metadataPath = `${formRoot}.xml`
    const bodyPath = join(formRoot, "Ext/Form.xml")
    const ownerPath = join(syncXmlDir, "Catalogs/Контрагенты.xml")
    const assignmentPaths = {
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
      xmlFiles: [
        { role: "metadata" as const, sourcePath: metadataPath },
        { role: "body" as const, sourcePath: bodyPath },
      ],
    }
    const assignment: ImportAssignment = {
      id: "catalog-form",
      topologyAddress: assignmentTopologyAddress(assignmentPaths.targetProjectPath),
      role: "fileItem",
      targetProjectPath: assignmentPaths.targetProjectPath,
      itemType: "ClientApplicationForm",
      itemName: "ФормаЭлемента",
      logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
      owner: {
        itemType: "MetadataCatalog",
        name: "Контрагенты",
        logicalAddress: "Справочник.Контрагенты",
      },
      xmlFiles: assignmentPaths.xmlFiles,
      externalFiles: [],
    }

    const prepared = await prepareImportYaml({
      assignment,
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    expect(prepared.yaml).toEqual(expect.any(Object))
    expect(prepared.localIndexes.metadata.formDataPathIndex).toBeDefined()
    expect(prepared).not.toHaveProperty("model")
    expect(prepared).not.toHaveProperty("xml")
    const restored = restorePreparedImportRecord(
      encodePreparedImportRecord(createPreparedImportRecordSource(prepared)),
    )
    expect(restored.yaml).toEqual(prepared.yaml)
    expect(restored.formDataPathIndex).toBeDefined()
    expect(readFile).toHaveBeenCalledTimes(2)
    expect(readFile).toHaveBeenCalledWith(metadataPath, "utf-8")
    expect(readFile).toHaveBeenCalledWith(bodyPath, "utf-8")
    expect(readFile).not.toHaveBeenCalledWith(ownerPath, expect.anything())
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("удерживает BaseForm как изолированный YAML-кандидат", async () => {
    const topologyNode = compileRegisteredMetadataResourceTopology().assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    )
    if (topologyNode === undefined) throw new Error("Не найдено задание формы справочника")
    const collector = createConfigurationIndexCollector()
    const prepared = await prepareImportYaml({
      assignment: {
        id: "extension-form",
        topologyAddress: {
          nodeId: topologyNode.id,
          values: { ownerName: "СправочникПолный", itemName: "ФормаОтчета" },
        },
        role: "fileItem",
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
          {
            role: "metadata",
            sourcePath: join(extensionFixtureDir, "Catalogs/СправочникПолный/Forms/ФормаОтчета.xml"),
          },
          {
            role: "body",
            sourcePath: join(extensionFixtureDir, "Catalogs/СправочникПолный/Forms/ФормаОтчета/Ext/Form.xml"),
          },
        ],
        externalFiles: [],
      },
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.baseFormCandidate).toMatchObject({
      targetProjectPath: "Справочник/СправочникПолный/Формы/ФормаОтчета/БазоваяФорма.yaml",
      yaml: {
        Реквизиты: { БазовыйРеквизитФормы: { Тип: "Дата" } },
        Элементы: { БазовоеПоле: { Вид: "ПолеВвода", Ширина: 99 } },
      },
    })
    expect(prepared.baseFormCandidate?.configurationFragment.entities.every(({ logicalAddress }) =>
      logicalAddress.startsWith("Справочник.СправочникПолный.Форма.ФормаОтчета.ОсноваФормы")
    )).toBe(true)
    const restored = restorePreparedImportRecord(
      encodePreparedImportRecord(createPreparedImportRecordSource(prepared)),
    )
    expect(restored.yaml).toEqual(prepared.yaml)
    expect(restored.baseFormCandidate?.yaml).toEqual(prepared.baseFormCandidate?.yaml)
    expect(restored.baseFormCandidate?.configurationFragment).toEqual(
      prepared.baseFormCandidate?.configurationFragment,
    )
    expect(collector.fragment(prepared.targetProjectPath).entities.some(({ logicalAddress }) =>
      logicalAddress.includes("ОсноваФормы")
    )).toBe(false)
  })

  it("prepares an ordinary form whose assignment has no body XML", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-ordinary-form-"))
    try {
      const metadataPath = join(inputDir, "ОбычнаяФорма.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties><Name>ОбычнаяФорма</Name><FormType>Ordinary</FormType></Properties>
  </Form>
</MetaDataObject>`
      )
      const assignment: ImportAssignment = {
        id: "ordinary-form",
        topologyAddress: assignmentTopologyAddress(
          "Справочник/Контрагенты/Формы/ОбычнаяФорма/Форма.yaml",
        ),
        role: "fileItem",
        targetProjectPath: "Справочник/Контрагенты/Формы/ОбычнаяФорма/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "ОбычнаяФорма",
        logicalAddress: "Справочник.Контрагенты.Форма.ОбычнаяФорма",
        owner: {
          itemType: "MetadataCatalog",
          name: "Контрагенты",
          logicalAddress: "Справочник.Контрагенты",
        },
        xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
        externalFiles: [],
      }

      const prepared = await prepareImportYaml({
        assignment,
        context: mockXmlImportContext(),
        collector: createConfigurationIndexCollector(),
      })

      expect(prepared.yaml).toEqual({ ТипФормы: "Обычная" })
      expect(prepared).not.toHaveProperty("baseFormCandidate")
      expect(prepared).not.toHaveProperty("model")
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })

  it("rejects a managed form whose assignment has no body XML", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-import-managed-form-"))
    try {
      const metadataPath = join(inputDir, "УправляемаяФорма.xml")
      fs.writeFileSync(
        metadataPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties><Name>УправляемаяФорма</Name><FormType>Managed</FormType></Properties>
  </Form>
</MetaDataObject>`
      )
      const assignment: ImportAssignment = {
        id: "managed-form",
        topologyAddress: assignmentTopologyAddress(
          "Справочник/Контрагенты/Формы/УправляемаяФорма/Форма.yaml",
        ),
        role: "fileItem",
        targetProjectPath: "Справочник/Контрагенты/Формы/УправляемаяФорма/Форма.yaml",
        itemType: "ClientApplicationForm",
        itemName: "УправляемаяФорма",
        logicalAddress: "Справочник.Контрагенты.Форма.УправляемаяФорма",
        owner: {
          itemType: "MetadataCatalog",
          name: "Контрагенты",
          logicalAddress: "Справочник.Контрагенты",
        },
        xmlFiles: [{ role: "metadata", sourcePath: metadataPath }],
        externalFiles: [],
      }

      await expect(
        prepareImportYaml({
          assignment,
          context: mockXmlImportContext(),
          collector: createConfigurationIndexCollector(),
        })
      ).rejects.toThrow("Form.xml")
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true })
    }
  })
})

function catalogAssignment(): ImportAssignment {
  return {
    id: "catalog",
    topologyAddress: assignmentTopologyAddress("Справочник/Контрагенты/Свойства.yaml"),
    role: "properties",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: join(syncXmlDir, "Catalogs/Контрагенты.xml") }],
    externalFiles: [],
  }
}

function assignmentTopologyAddress(projectPath: string): ImportAssignment["topologyAddress"] {
  const match = classifyMetadataProjectPath(compileRegisteredMetadataResourceTopology(), projectPath)
  if (match?.assignment === undefined) throw new Error(`Не найден topology-адрес: ${projectPath}`)
  return { nodeId: match.assignment.id, values: match.values }
}
