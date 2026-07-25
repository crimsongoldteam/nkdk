import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { XmlSyncManifest } from "../configuration/migrations/xmlManifest"
import { MetadataBusinessProcessRules } from "../metadataBusinessProcess/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import "../metadataCommonForm/types"
import { MetadataTaskRules } from "../metadataTask/rules"
import {
  syncAppliedObjectToXML,
} from "../../orchestration/appliedObject/syncToXML"
import { importFromYAML } from "../../../yaml/import"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"
import { prepareFullXmlSyncAssignment } from "../../fullSyncToXml/prepareAssignment"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { sampleIndex } from "../../configurationIndex/testData"
import type { FullXmlSyncAssignment } from "../../fullSyncToXml/types"

const normalizeText = (value: string) => value.replace(/\r\n/g, "\n")

describe("единая синхронизация внешних файлов applied objects", () => {
  it("читает запрос динамического списка встроенной общей формы из каталога объекта", () => {
    const root = fs.mkdtempSync(join(os.tmpdir(), "common-form-query-"))
    try {
      const yamlPath = join(root, "Свойства.yaml")
      const queryDir = join(root, "ДинамическийСписок")
      fs.mkdirSync(queryDir)
      fs.writeFileSync(join(queryDir, "Список.query"), "ВЫБРАТЬ 1 КАК Значение")
      const yaml = importFromYAML(`
Форма:
  Реквизиты:
    Список:
      Тип: ДинамическийСписок
      ДинамическийСписок:
        ПроизвольныйЗапрос: Истина
`)

      const topology = compileRegisteredMetadataResourceTopology()
      const node = topology.assignments.find(
        (candidate) =>
          candidate.itemRule.itemType === "MetadataCommonForm" &&
          candidate.projectPattern === "ОбщаяФорма/{ownerName}/Свойства.yaml" &&
          candidate.xmlDocuments.some((document) => document.source.propertyName === "form")
      )!
      const assignment: FullXmlSyncAssignment = {
        id: "ОбщаяФорма/Таблица/Свойства.yaml",
        sourceProjectPath: "ОбщаяФорма/Таблица/Свойства.yaml",
        sourcePath: yamlPath,
        role: "properties",
        itemType: "MetadataCommonForm",
        itemName: "Таблица",
        logicalAddress: "ОбщаяФорма.Таблица",
        nodeId: node.id,
        potentialOutputs: node.xmlDocuments.map((document) => ({
          declarationId: document.id,
          targetXmlPath: document.xmlPattern.replace("{ownerName}", "Таблица"),
          role: document.role,
          required: document.required,
          prepareCapabilityId: document.prepareCapabilityId!,
          ...(document.source.propertyName === undefined ? {} : { propertyName: document.source.propertyName }),
        })),
      }
      const prepared = prepareFullXmlSyncAssignment({
        assignment,
        topology,
        context: mockContextToXML(),
        preparedYamlFile: {
          projectPath: assignment.sourceProjectPath,
          filePath: yamlPath,
          role: "properties",
          owner: { dir: "ОбщаяФорма", name: "Таблица" },
          data: yaml,
          syntaxDiagnostics: [],
        },
        index: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      })

      expect(JSON.stringify(prepared.documents)).toContain("ВЫБРАТЬ 1 КАК Значение")
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it("восстанавливает модули и карту маршрута бизнес-процесса", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataBusinessProcessRules,
      name: "БизнесПроцессВсеСвойства",
      importMetaUrl: import.meta.resolve("../metadataBusinessProcess/rules.ts"),
      externalObjectDir: true,
      expectedFiles: [
        "БизнесПроцессВсеСвойства/Ext/ObjectModule.bsl",
        "БизнесПроцессВсеСвойства/Ext/ManagerModule.bsl",
        "БизнесПроцессВсеСвойства/Ext/Flowchart.xml",
      ],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeText(result), path).toBe(normalizeText(expected))
    }
  })

  it("восстанавливает модули задачи из YAML", async () => {
    const root = fs.mkdtempSync(join(os.tmpdir(), "task-external-sync-"))
    try {
      const inputDir = join(root, "yaml")
      const referenceDir = join(root, "reference")
      const outputDir = join(root, "xml")
      const name = "ЗадачаВсеСвойства"
      fs.mkdirSync(join(inputDir, name), { recursive: true })
      fs.mkdirSync(referenceDir, { recursive: true })
      fs.writeFileSync(join(inputDir, name, "Свойства.yaml"), "")
      fs.writeFileSync(join(inputDir, name, "МодульОбъекта.bsl"), "Процедура ПередЗаписью()\nКонецПроцедуры\n")
      fs.writeFileSync(join(inputDir, name, "МодульМенеджера.bsl"), "Функция Код()\n\tВозврат 7;\nКонецФункции\n")
      fs.copyFileSync(
        new URL("../metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства.xml", import.meta.url),
        join(referenceDir, `${name}.xml`)
      )

      await syncAppliedObjectToXML({
        rule: MetadataTaskRules,
        context: mockContextToXML(),
        inputDir,
        name,
        outputDir,
        referenceDir,
        externalOutputDir: join(outputDir, name),
        externalReferenceDir: join(referenceDir, name),
      })

      expect(fs.readFileSync(join(outputDir, name, "Ext", "ObjectModule.bsl"), "utf8")).toContain("ПередЗаписью")
      expect(fs.readFileSync(join(outputDir, name, "Ext", "ManagerModule.bsl"), "utf8")).toContain("Возврат 7")
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it("восстанавливает XML, модуль и двоичные файлы общей формы", async () => {
    const root = fs.mkdtempSync(join(os.tmpdir(), "common-form-external-sync-"))
    try {
      const fixtureRoot = join(
        dirname(fileURLToPath(import.meta.resolve("../metadataCommonForm/rules.ts"))),
        "__fixtures__",
        "sync"
      )
      const inputDir = join(root, "yaml")
      const referenceDir = join(root, "reference")
      const outputDir = join(root, "xml")
      const name = "КонстантаВсеСвойства"
      fs.cpSync(join(fixtureRoot, "yaml"), inputDir, { recursive: true })
      fs.cpSync(join(fixtureRoot, "xml"), referenceDir, { recursive: true })
      fs.writeFileSync(join(inputDir, name, "Модуль.bsl"), "Процедура ПриСозданииНаСервере()\nКонецПроцедуры\n")
      fs.writeFileSync(join(inputDir, name, "Form.bin"), Buffer.from([0, 1, 2, 255]))
      const headerPicture = join(inputDir, name, "КартинкиШапки", "ГруппаСШапкой.png")
      fs.mkdirSync(dirname(headerPicture), { recursive: true })
      fs.writeFileSync(headerPicture, Buffer.from([7, 8, 9]))
      const manifest = new XmlSyncManifest(outputDir)

      await syncAppliedObjectToXML({
        rule: MetadataCommonFormRules,
        context: mockContextToXML(),
        inputDir,
        name,
        outputDir,
        referenceDir,
        externalOutputDir: join(outputDir, name),
        externalReferenceDir: join(referenceDir, name),
        xmlManifest: manifest,
      })

      expect(fs.existsSync(join(outputDir, `${name}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, name, "Ext", "Form.xml"))).toBe(true)
      expect(fs.readFileSync(join(outputDir, name, "Ext", "Form", "Module.bsl"), "utf8")).toContain(
        "ПриСозданииНаСервере"
      )
      expect([...fs.readFileSync(join(outputDir, name, "Ext", "Form.bin"))]).toEqual([0, 1, 2, 255])
      expect([
        ...fs.readFileSync(join(outputDir, name, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.png")),
      ]).toEqual([7, 8, 9])
      expect(manifest.expectedFiles()).toContain(`${name}/Ext/Form.bin`)
      expect(manifest.expectedFiles()).toContain(`${name}/Ext/Form/Items/ГруппаСШапкой/HeaderPicture.png`)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
