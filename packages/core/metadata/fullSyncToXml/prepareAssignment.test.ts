import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleSnapshot } from "../configurationIndex/testData"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import type { FullXmlSyncAssignment } from "./types"
import { compileMetadataResourceTopology } from "../resourceTopology/compiler"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { registerMetadataXmlPrepareCapability } from "../resourceTopology/capabilities"
import type { MetadataItemRule } from "../orchestration/property/types"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import { MetadataConfigurationExtensionRules } from "../appliedObjects/configurationExtension/rules"
import {
  ClientApplicationFormWithExtendedPresentationRules,
} from "../forms/clientApplicationForm/rules"

describe("prepareFullXmlSyncAssignment", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("calls one registered capability once for all of its XML outputs", () => {
    const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
    const source = { kind: "itemRule" as const, description: "test" }
    const topology = compileMetadataResourceTopology([
      {
        dir: "Объект",
        kind: "test",
        rule,
        exportSchema: () => ({}) as never,
        resources: [
          {
            kind: "content",
            projectPattern: "Объект/{ownerName}/Свойства.yaml",
            role: "properties",
            required: true,
            repeatable: true,
            compositionImpact: "configurationComposition",
            itemRule: rule,
            source,
          },
          ...(["metadata", "body"] as const).map((role) => ({
            kind: "xmlDocument" as const,
            assignmentProjectPattern: "",
            xmlPattern: `Objects/{ownerName}/${role}.xml`,
            role,
            required: true,
            prepareCapabilityId: "test-two-documents",
            source,
          })),
        ],
      },
    ])
    const node = topology.assignments[0]!
    const outputs = node.xmlDocuments.map((document) => ({
      declarationId: document.id,
      targetXmlPath: document.xmlPattern.replace("{ownerName}", "One"),
      role: document.role,
      required: document.required,
      prepareCapabilityId: "test-two-documents",
    }))
    const baseConfigurationIndex = createConfigurationIndexReader(
      snapshotConfigurationIndex(
        encodeConfigurationIndex({
          ...sampleSnapshot(),
          entities: [
            {
              logicalAddress: "Объект.One",
              sourceProjectPath: "Configuration.yaml",
              identities: { xmlId: "base-marker" },
            },
          ],
        })
      )
    )
    const run = vi.fn(({ outputs: requested, baseConfigurationIndex: baseIndex }) =>
      requested.map((output: (typeof outputs)[number]) => ({
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml: {
          Root: output.role,
          BaseMarker: baseIndex?.entity("Объект.One")?.identities?.xmlId,
        },
        deferred: [],
        rootRule: rule,
      }))
    )
    registerMetadataXmlPrepareCapability({ id: "test-two-documents", run })
    const assignment: FullXmlSyncAssignment = {
      id: "Объект/One/Свойства.yaml",
      sourceProjectPath: "Объект/One/Свойства.yaml",
      sourcePath: "/project/Объект/One/Свойства.yaml",
      expectedContentHash: 0n,
      role: "properties",
      itemType: "TestObject",
      itemName: "One",
      logicalAddress: "Объект.One",
      nodeId: node.id,
      potentialOutputs: outputs,
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: {
        projectPath: assignment.sourceProjectPath,
        filePath: assignment.sourcePath,
        role: "properties",
        owner: { dir: "Объект", name: "One" },
        data: {},
        syntaxDiagnostics: [],
      },
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      baseConfigurationIndex,
      assignments: [],
      topology,
    })

    expect(run).toHaveBeenCalledTimes(1)
    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "Objects/One/metadata.xml",
      "Objects/One/body.xml",
    ])
    expect(prepared.documents.map((document) => document.xml.BaseMarker)).toEqual([
      "base-marker",
      "base-marker",
    ])
  })

  it("uses the registered component root rule for the configuration assignment", () => {
    const topology = compileRegisteredMetadataResourceTopology()
    const assignmentNode = topology.assignments.find((candidate) => candidate.role === "configuration")!
    const outputNode = assignmentNode.xmlDocuments[0]!
    if (outputNode.prepareCapabilityId === undefined) {
      throw new Error("У корневого XML-документа отсутствует prepare capability")
    }
    const assignment: FullXmlSyncAssignment = {
      id: "Конфигурация.yaml",
      sourceProjectPath: "Конфигурация.yaml",
      sourcePath: "/project/Конфигурация.yaml",
      expectedContentHash: 0n,
      role: "configuration",
      itemType: assignmentNode.itemRule.itemType,
      itemName: "Расширение",
      logicalAddress: "Конфигурация",
      nodeId: assignmentNode.id,
      potentialOutputs: [{
        declarationId: outputNode.id,
        targetXmlPath: "Configuration.xml",
        role: outputNode.role,
        required: outputNode.required,
        prepareCapabilityId: outputNode.prepareCapabilityId,
      }],
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: {
        projectPath: assignment.sourceProjectPath,
        filePath: assignment.sourcePath,
        role: "configuration",
        owner: { dir: "", name: "Расширение" },
        data: {
          Имя: "Расширение",
          НазначениеРасширенияКонфигурации: "Customization",
        },
        syntaxDiagnostics: [],
      },
      context: {
        ...mockContextToXML(),
        exportToXML: {
          ...mockContextToXML().exportToXML,
          componentKind: "configurationExtension",
        },
      },
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      topology,
    })

    expect(prepared.documents[0]?.rootRule).toBe(MetadataConfigurationExtensionRules)
  })

  it("prepares a processor form with its selected rule", () => {
    const sourceProjectPath =
      "Обработка/Загрузка/Формы/Основная/Форма.yaml"
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath: `/project/${sourceProjectPath}`,
      expectedContentHash: 0n,
      role: "form",
      itemType: "ClientApplicationForm",
      itemName: "Основная",
      logicalAddress: "Обработка.Загрузка.Форма.Основная",
      owner: {
        itemType: "MetadataDataProcessor",
        name: "Загрузка",
        logicalAddress: "Обработка.Загрузка",
      },
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: {
        projectPath: sourceProjectPath,
        filePath: assignment.sourcePath,
        role: "form",
        owner: { dir: "Обработка", name: "Загрузка" },
        data: {},
        syntaxDiagnostics: [],
      },
      context: mockContextToXML(),
      index: createConfigurationIndexReader(
        snapshotConfigurationIndex(
          encodeConfigurationIndex(sampleSnapshot())
        )
      ),
    })
    const metadataDocument = prepared.documents.find((document) =>
      Object.hasOwn(document.xml, "MetaDataObject")
    )
    const bodyDocument = prepared.documents.find((document) =>
      Object.hasOwn(document.xml, "Form")
    )

    expect(metadataDocument?.rootRule).toBe(
      ClientApplicationFormWithExtendedPresentationRules
    )
    expect(metadataDocument?.xml).toMatchObject({
      MetaDataObject: {
        Form: {
          Properties: {
            IncludeHelpInContents: false,
            ExtendedPresentation: "",
          },
        },
      },
    })
    expect(bodyDocument?.rootRule).toBe(
      ClientApplicationFormWithExtendedPresentationRules
    )
  })

  it("prepares owner XML without writing files", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Формы", "ФормаСписка"), {
      recursive: true,
    })
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Шаблоны", "Макет"), {
      recursive: true,
    })
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Справка"), {
      recursive: true,
    })
    fs.writeFileSync(
      join(projectDir, "Обработка", "ОбработкаВсеСвойства", "Справка", "ru.html"),
      "<html></html>"
    )
    fs.writeFileSync(sourcePath, "Синоним: Синоним\nКомментарий: Комментарий\n")
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
          itemType: "MetadataDataProcessor",
        },
      ],
      itemTypeByYamlDir: { Обработка: "MetadataDataProcessor" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "properties",
      itemType: "MetadataDataProcessor",
      itemName: "ОбработкаВсеСвойства",
      logicalAddress: "Обработка.ОбработкаВсеСвойства",
      owner: undefined,
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }
    const writeFile = vi.spyOn(fs.promises, "writeFile")

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      assignments: [],
    })

    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "DataProcessors/ОбработкаВсеСвойства.xml",
      "DataProcessors/ОбработкаВсеСвойства/Ext/Help.xml",
    ])
    expect(prepared.documents[0]?.xml).toHaveProperty("MetaDataObject")
    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        DataProcessor: {
          ChildObjects: {
            Form: ["ФормаСписка"],
            Template: ["Макет"],
          },
        },
      },
    })
    expect(prepared.documents[1]?.xml).toMatchObject({ Help: { Page: "ru" } })
    expect(prepared.profile.rulesPassCount).toBe(1)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("prepares a filePath metadata item from the owner YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-item-property-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "ДополнительныеИндексы:",
        "  - Имя: Индекс1",
        "    Таблица: Catalog.Товары",
        "    ИндексируемыеПоля:",
        "      - Code",
        "",
      ].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "MetadataCatalog",
        },
      ],
      itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      assignments: [],
    })

    expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
      "Catalogs/Товары.xml",
      "Catalogs/Товары/Ext/AdditionalIndexes.xml",
    ])
    expect(prepared.documents[1]?.xml).toMatchObject({
      AdditionalIndexes: {
        AdditionalIndex: [
          expect.objectContaining({
            Name: "Индекс1",
            Table: "Catalog.Товары",
          }),
        ],
      },
    })
  })

  it("provides the current applied object context to a filePath metadata item", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-item-property-owner-"))
    tempDirs.push(projectDir)
    const registerName = "Обороты"
    const sourceProjectPath = `РегистрНакопления/${registerName}/Свойства.yaml`
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "РегистрНакопления", registerName), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "Агрегаты:",
        "  - Использование: Всегда",
        "    Периодичность: День",
        "    Измерения:",
        "      Склад: Истина",
        "",
      ].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "РегистрНакопления", name: registerName },
          itemType: "MetadataAccumulationRegister",
        },
      ],
      itemTypeByYamlDir: { РегистрНакопления: "MetadataAccumulationRegister" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "properties",
      itemType: "MetadataAccumulationRegister",
      itemName: registerName,
      logicalAddress: `РегистрНакопления.${registerName}`,
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      assignments: [],
    })

    const aggregates = prepared.documents.find((document) => document.targetXmlPath.endsWith("/Ext/Aggregates.xml"))
    expect(aggregates?.xml).toMatchObject({
      AccumulationRegisterAggregates: {
        Aggregate: [
          {
            Dimensions: {
              Dimension: [
                {
                  _ref: `AccumulationRegister.${registerName}.Dimension.Склад`,
                  "#text": true,
                },
              ],
            },
          },
        ],
      },
    })
  })

  it("provides the applied object owner to nested metadata targets", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-assignment-owner-"))
    tempDirs.push(projectDir)
    const sourceProjectPath = "Справочник/Товары/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(
      sourcePath,
      [
        "Реквизиты:",
        "  ИспользоватьХранилище:",
        "    Тип: Булево",
        "    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: ИспользоватьХранилище",
        "",
      ].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "MetadataCatalog",
        },
      ],
      itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      owner: undefined,
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      assignments: [],
    })

    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        Catalog: {
          ChildObjects: {
            Attribute: [
              {
                Properties: {
                  BinaryDataStorageLocationUseField:
                    "Catalog.Товары.Attribute.ИспользоватьХранилище",
                },
              },
            ],
          },
        },
      },
    })
  })

  it("restores the topology owner for an independently prepared nested object", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-nested-assignment-owner-"))
    tempDirs.push(projectDir)
    const sourceProjectPath =
      "ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "ВнешнийИсточникДанных", "Источник", "Кубы", "Куб"), {
      recursive: true,
    })
    fs.writeFileSync(
      sourcePath,
      ["ИмяВИсточникеДанных: Куб", "ОсновнаяФормаЗаписи: ФормаЗаписи", ""].join("\n")
    )
    const yaml = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "form",
          owner: { dir: "ВнешнийИсточникДанных", name: "Источник" },
          itemType: "MetadataExternalDataSourceCube",
        },
      ],
      itemTypeByYamlDir: {
        ВнешнийИсточникДанных: "MetadataExternalDataSource",
      },
    }).yamlFiles[0]!
    const assignment: FullXmlSyncAssignment = {
      id: sourceProjectPath,
      sourceProjectPath,
      sourcePath,
      expectedContentHash: 0n,
      role: "form",
      itemType: "MetadataExternalDataSourceCube",
      itemName: "Куб",
      logicalAddress: "ВнешнийИсточникДанных.Источник.Куб.Куб",
      owner: {
        itemType: "MetadataExternalDataSource",
        name: "Источник",
        logicalAddress: "ВнешнийИсточникДанных.Источник",
      },
      ...fullXmlSyncTestTopologyFields(sourceProjectPath),
    }

    const prepared = prepareFullXmlSyncAssignment({
      assignment,
      preparedYamlFile: yaml,
      context: mockContextToXML(),
      index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      assignments: [
        {
          id: "dimension-table",
          sourceProjectPath:
            "ВнешнийИсточникДанных/Источник/Кубы/Куб/ТаблицыИзмерений/Таблица/Свойства.yaml",
          role: "form",
          itemType: "MetadataExternalDataSourceDimensionTable",
          itemName: "Таблица",
          logicalAddress: `${assignment.logicalAddress}.ТаблицаИзмерений.Таблица`,
          ownerLogicalAddress: assignment.logicalAddress,
        },
      ],
    })

    expect(prepared.documents[0]?.xml).toMatchObject({
      MetaDataObject: {
        Cube: {
          InternalInfo: {
            "xr:GeneratedType": expect.arrayContaining([
              expect.objectContaining({
                _name: "ExternalDataSourceCubeManager.Источник.Куб",
              }),
            ]),
          },
          Properties: {
            DefaultRecordForm: "ExternalDataSource.Источник.Cube.Куб.Form.ФормаЗаписи",
          },
          ChildObjects: {
            DimensionTable: ["Таблица"],
          },
        },
      },
    })
  })
})
