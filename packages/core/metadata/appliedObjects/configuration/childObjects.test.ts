import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import {
  buildConfigurationChildObjects,
  readConfigurationChildObjectsFromXML,
  STANDARD_CHILD_OBJECT_TYPE_ORDER,
} from "./childObjects"
import { CONFIGURATION_XML_FILE } from "./rootIO"

const writeProperties = (yamlRoot: string, typeDir: string, name: string): void => {
  const dir = join(yamlRoot, typeDir, name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(join(dir, "Свойства.yaml"), "", "utf-8")
}

describe("Configuration ChildObjects", () => {
  let tmpDir: string
  let yamlDir: string
  let xmlDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configuration-child-"))
    yamlDir = join(tmpDir, "yaml")
    xmlDir = join(tmpDir, "xml")
    fs.mkdirSync(xmlDir)
    fs.copyFileSync(getXMLFixturePath("configuration/full.xml"), join(xmlDir, CONFIGURATION_XML_FILE))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("берёт порядок существующих объектов из reference и добавляет новые в конец типа по имени", () => {
    const referenceChildObjects = readConfigurationChildObjectsFromXML(xmlDir)
    writeProperties(yamlDir, "Справочник", "НовыйЯ")
    writeProperties(yamlDir, "Справочник", "НовыйА")
    writeProperties(yamlDir, "Справочник", "ПримерСправочник")
    writeProperties(yamlDir, "Справочник", "ПодчиненныйСправочник")

    const childObjects = buildConfigurationChildObjects({ yamlDir, referenceChildObjects })

    expect(childObjects.Catalog).toEqual(["ПримерСправочник", "ПодчиненныйСправочник", "НовыйА", "НовыйЯ"])
  })

  it("использует стандартный порядок типов и только YAML-каталоги с файлами свойств", () => {
    writeProperties(yamlDir, "Документ", "Документ1")
    writeProperties(yamlDir, "Обработка", "Обработка1")
    writeProperties(yamlDir, "Справочник", "Справочник1")
    writeProperties(yamlDir, "Язык", "Русский")
    fs.mkdirSync(join(yamlDir, "Роль", "БезСвойств"), { recursive: true })

    const childObjects = buildConfigurationChildObjects({ yamlDir })

    expect(Object.keys(childObjects)).toEqual(["Language", "Catalog", "Document", "DataProcessor"])
    expect(childObjects).toEqual({
      Language: "Русский",
      Catalog: "Справочник1",
      Document: "Документ1",
      DataProcessor: "Обработка1",
    })
  })

  it("содержит unsupported-типы в стандартном порядке для будущей поддержки", () => {
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER).toEqual(
      expect.arrayContaining(["CommonModule", "XDTOPackage", "ExternalDataSource", "WebSocketClient"])
    )
  })

  it("ставит WebSocketClient между WSReference и EventSubscription", () => {
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WSReference")).toBeLessThan(
      STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient")
    )
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient")).toBeLessThan(
      STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("EventSubscription")
    )
  })
})
