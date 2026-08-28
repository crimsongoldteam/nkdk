import { serializeYAMLDocument } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import {
  decodePreparedImportRecord,
  encodePreparedImportRecord,
  restorePreparedImportRecord,
  type PreparedImportRecordSourceV1,
} from "./preparedRecord"

describe("PreparedImportRecordV1", () => {
  it("сохраняет YAML и все переносимые сведения второго прохода", () => {
    const source = preparedRecordSource()

    const decoded = decodePreparedImportRecord(encodePreparedImportRecord(source))

    expect(decoded).toMatchObject(source)
    expect(decoded.checksum).toEqual(expect.any(BigInt))
    expect(decoded.yamlText).toContain('Пробелы: "         "')
    expect(decoded.yamlText).toContain("!xml/raw")
    expect(decoded.baseFormCandidate).toEqual(source.baseFormCandidate)
  })

  it("заново разбирает точный YAML и связывает пути с новым деревом", () => {
    const source = preparedRecordSource()

    const restored = restorePreparedImportRecord(encodePreparedImportRecord(source))

    expect(serializeYAMLDocument(restored.yaml, restored.annotations).text).toBe(source.yamlText)
    expect(restored.deferred[0]?.target.object).not.toBe(source)
    expect(restored.deferred[0]?.target.key).toBe("Пробелы")
    expect(restored.baseFormCandidate?.deferred[0]?.target.key).toBe("Элементы")
  })

  it("восстанавливает XML-аннотации подготовленной BaseForm", () => {
    const source = preparedRecordSource()
    const base = source.baseFormCandidate!
    const withAnnotatedBase = {
      ...source,
      baseFormCandidate: {
        ...base,
        yamlText: [
          "Элементы:",
          "  Поле:",
          "    Вид: ПолеВвода",
          "    Подсказка:",
          "      ru: Текст",
          "      en: Text",
        ].join("\n"),
        annotations: {
          version: 1 as const,
          entries: [{
            parentPath: ["Элементы", "Поле", "Подсказка"],
            key: "en",
            annotation: { kind: "invalid" as const, occurrence: 1, target: "value" as const },
          }],
        },
      },
    }

    const restored = restorePreparedImportRecord(encodePreparedImportRecord(withAnnotatedBase))
    const candidate = restored.baseFormCandidate!
    const languages = (
      candidate.yaml as { Элементы: { Поле: { Подсказка: Record<string, string> } } }
    ).Элементы.Поле.Подсказка
    const annotations = (
      candidate as typeof candidate & { annotations?: { at(parent: object, key: string): unknown } }
    ).annotations

    expect(annotations?.at(languages, "en")).toMatchObject({ kind: "invalid", target: "value" })
  })

  it("отклоняет неизвестную версию", () => {
    const bytes = encodePreparedImportRecord(preparedRecordSource()).slice()
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint16(4, 2, false)

    expect(() => decodePreparedImportRecord(bytes)).toThrowError(expect.objectContaining({
      code: "xml_import_prepared_version",
    }))
  })

  it("отклоняет повреждённую полезную нагрузку", () => {
    const bytes = encodePreparedImportRecord(preparedRecordSource()).slice()
    bytes[bytes.length - 1] ^= 1

    expect(() => decodePreparedImportRecord(bytes)).toThrowError(expect.objectContaining({
      code: "xml_import_prepared_checksum",
    }))
  })

  it("отклоняет отсутствующее правило", () => {
    const bytes = encodePreparedImportRecord({ ...preparedRecordSource(), ruleItemType: "FutureType" })

    expect(() => decodePreparedImportRecord(bytes)).toThrowError(expect.objectContaining({
      code: "xml_import_prepared_rule",
    }))
  })

  it("восстанавливает корневое правило расширения из реестра схем", () => {
    const source = { ...preparedRecordSource(), ruleItemType: "MetadataConfigurationExtension" }

    expect(restorePreparedImportRecord(encodePreparedImportRecord(source)).rule.itemType)
      .toBe("MetadataConfigurationExtension")
  })
})

function preparedRecordSource(): PreparedImportRecordSourceV1 {
  return {
    version: 1,
    assignment: {
      id: "catalog:Контрагенты",
      topologyAddress: { nodeId: "catalog", values: { ownerName: "Контрагенты" } },
      role: "properties",
      targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
      itemType: "MetadataCatalog",
      itemName: "Контрагенты",
      logicalAddress: "Catalog.Контрагенты",
      owner: undefined,
      xmlFiles: [{ role: "metadata", sourcePath: "/xml/Catalogs/Контрагенты.xml" }],
      externalFiles: [],
    },
    yamlText: [
      'Пробелы: "         "',
      "!xml/invalid Неверное: good",
      "!xml/invalid/2 Неверное: bad",
      "Неизвестное: !xml/raw",
      "  $значение: known",
      "  $xml:",
      '    "#text": "01"',
    ].join("\n"),
    annotations: {
      version: 1,
      entries: [{
        parentPath: [],
        key: "Неизвестное",
        annotation: {
          kind: "raw",
          occurrence: 1,
          target: "value",
          xml: { "#text": "01" },
          hasSemanticValue: true,
        },
      }],
    },
    proofAudit: {
      sources: [{
        sourcePath: "/xml/Catalogs/Контрагенты.xml",
        role: "metadata",
        roots: [{
          xmlPath: "/MetaDataObject[1]",
          elementName: "MetaDataObject",
          structuralHash: 42n,
          span: { start: 0, end: 10 },
        }],
      }],
      boundaries: [],
      itemAnchors: [],
    },
    deferred: [{ valuePath: ["Пробелы"], rulePath: [{ propertyKey: "attributes" }] }],
    dependentDeferred: [],
    ownerContext: [{ itemType: "MetadataCatalog", name: "Контрагенты", path: "Catalogs/Контрагенты" }],
    dependentOwner: { dir: "Справочник", name: "Контрагенты" },
    baseFormCandidate: {
      baseProjectPath: "Справочник/Контрагенты/Формы/Форма/Форма.yaml",
      targetProjectPath: "Справочник/Контрагенты/Формы/Форма/БазоваяФорма.yaml",
      owner: { dir: "Справочник", name: "Контрагенты" },
      yamlText: "Элементы: {}\n",
      annotations: { version: 1, entries: [] },
      ruleItemType: "ClientApplicationForm",
      deferred: [{ valuePath: ["Элементы"], rulePath: [{ propertyKey: "items" }] }],
      configurationFragment: {
        targetProjectPath: "Справочник/Контрагенты/Формы/Форма/БазоваяФорма.yaml",
        entities: [{ logicalAddress: "Catalog.Контрагенты.Form.Форма" }],
      },
    },
    ruleItemType: "MetadataCatalog",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    logicalAddress: "Catalog.Контрагенты",
  }
}
