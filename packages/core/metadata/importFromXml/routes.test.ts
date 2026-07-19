import { describe, expect, it } from "vitest"
import { describeRegisteredXmlImportRoutes, matchImportPattern } from "./routes"

describe("XML import routes", () => {
  it("describes import without concrete itemType checks in discovery", () => {
    const routes = describeRegisteredXmlImportRoutes()

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "assignment",
          xmlPattern: "Configuration.xml",
          targetPattern: "Конфигурация.yaml",
        }),
        expect.objectContaining({
          kind: "assignment",
          xmlPattern: "Catalogs/{ownerName}.xml",
          targetPattern: "Справочник/{ownerName}/Свойства.yaml",
        }),
        expect.objectContaining({
          kind: "assignment",
          xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}.xml",
          targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
        }),
        expect.objectContaining({
          kind: "externalFile",
          xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/{relativePath...}",
          assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
        }),
      ])
    )
  })

  it("ignores ConfigDumpInfo.xml from a real configuration dump", () => {
    expect(describeRegisteredXmlImportRoutes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "ignore",
          xmlPattern: "ConfigDumpInfo.xml",
        }),
      ])
    )
  })

  it("recurses through file-item child collections", () => {
    expect(describeRegisteredXmlImportRoutes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "assignment",
          xmlPattern: "ExternalDataSources/{ownerName}/Tables/{itemName}.xml",
          targetPattern: "ВнешнийИсточникДанных/{ownerName}/Таблицы/{itemName}/Свойства.yaml",
        }),
      ])
    )
  })

  it("does not repeat an owner suffix already present in a child route", () => {
    expect(describeRegisteredXmlImportRoutes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "externalFile",
          xmlPattern: "Reports/{ownerName}/Commands/{itemName}/Ext/CommandModule.bsl",
        }),
        expect.objectContaining({
          kind: "externalFile",
          xmlPattern: "ExternalDataSources/{ownerName}/Tables/{itemName}/Commands/{itemName2}/Ext/CommandModule.bsl",
        }),
      ])
    )
  })

  it("matches ordinary and trailing-rest segments with one matcher", () => {
    expect(
      matchImportPattern(
        "Catalogs/{ownerName}/Forms/{itemName}/Ext/{relativePath...}",
        "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl"
      )
    ).toEqual({ ownerName: "Контрагенты", itemName: "ФормаЭлемента", relativePath: "Form/Module.bsl" })
    expect(matchImportPattern("Ext/{relativePath...}", "Ext")).toBeUndefined()
    expect(matchImportPattern("{relativePath...}/Ext", "Form/Ext")).toBeUndefined()
  })
})
