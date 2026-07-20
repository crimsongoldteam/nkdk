import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { discoverXmlImport } from "./discovery"
import { describeRegisteredXmlImportRoutes } from "./routes"
import type { XmlImportRoute } from "./types"

const xmlDir = "/xml-dump"
const source = { kind: "itemRule", itemType: "test" } as const

const testRoutes = [
  {
    kind: "assignment",
    xmlPattern: "Configuration.xml",
    targetPattern: "Конфигурация.yaml",
    role: "configuration",
    itemType: "MetadataConfiguration",
    source,
  },
  {
    kind: "assignment",
    xmlPattern: "Catalogs/{ownerName}.xml",
    targetPattern: "Справочник/{ownerName}/Свойства.yaml",
    role: "properties",
    itemType: "MetadataCatalog",
    source,
  },
  {
    kind: "assignment",
    xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}.xml",
    targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    role: "fileItem",
    itemType: "ClientApplicationForm",
    source,
  },
  {
    kind: "externalFile",
    xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/Form/Module.bsl",
    targetPattern: "Справочник/{ownerName}/Формы/{itemName}/Модуль.bsl",
    assignmentTargetPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
    source,
  },
] as const satisfies readonly XmlImportRoute[]

function fakeFs(paths: readonly string[]) {
  return {
    listFiles: async () => paths,
    readFile: vi.fn(),
  }
}

describe("XML import discovery", () => {
  it("builds one assignment per YAML and never reads XML contents", async () => {
    const fixturePaths = [
      "Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      "Catalogs/Контрагенты/Forms/ФормаЭлемента.xml",
      "Catalogs/Контрагенты.xml",
      "Configuration.xml",
    ]
    const fs = fakeFs(fixturePaths)

    const result = await discoverXmlImport({ xmlDir, routes: testRoutes, fs })

    expect(fs.readFile).not.toHaveBeenCalled()
    expect(result.assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Конфигурация.yaml",
      "Справочник/Контрагенты/Свойства.yaml",
      "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(result.assignments.at(-1)?.externalFiles).toEqual([
      {
        sourcePath: join(xmlDir, fixturePaths[0]),
        targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Модуль.bsl",
      },
    ])
    expect(result.assignments.at(-1)?.xmlFiles).toEqual([expect.objectContaining({ role: "metadata" })])
    expect(result.assignments.at(-1)?.owner).toMatchObject({
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    })
  })

  it("classifies the real managed-form body and maps its module to the project root", async () => {
    const formRoot = "Catalogs/Контрагенты/Forms/ФормаЭлемента"
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs([
        "Catalogs/Контрагенты.xml",
        `${formRoot}.xml`,
        `${formRoot}/Ext/Form.xml`,
        `${formRoot}/Ext/Form/Module.bsl`,
      ]),
    })

    const form = result.assignments.find(
      (assignment) => assignment.targetProjectPath === "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml"
    )
    expect(form?.xmlFiles).toEqual(
      expect.arrayContaining([
        { role: "metadata", sourcePath: join(xmlDir, `${formRoot}.xml`) },
        { role: "body", sourcePath: join(xmlDir, `${formRoot}/Ext/Form.xml`) },
      ])
    )
    expect(form?.externalFiles).toContainEqual({
      sourcePath: join(xmlDir, `${formRoot}/Ext/Form/Module.bsl`),
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Модуль.bsl",
    })
  })

  it("uses the body role for a real CommonForm Ext/Form.xml", async () => {
    const commonFormRoot = "CommonForms/КонстантаВсеСвойства"
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs([`${commonFormRoot}.xml`, `${commonFormRoot}/Ext/Form.xml`]),
    })

    expect(result.assignments[0].xmlFiles).toEqual([
      { role: "metadata", sourcePath: join(xmlDir, `${commonFormRoot}.xml`) },
      { role: "body", sourcePath: join(xmlDir, `${commonFormRoot}/Ext/Form.xml`) },
    ])
  })

  it("classifies a real child-form Ext/Help.xml as a property XML input", async () => {
    const formRoot = "DataProcessors/ОбработкаВсеСвойства/Forms/Форма"
    const helpXml = `${formRoot}/Ext/Help.xml`
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs(["DataProcessors/ОбработкаВсеСвойства.xml", `${formRoot}.xml`, helpXml]),
    })

    const form = result.assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма/Форма.yaml"))
    expect(form?.xmlFiles).toContainEqual({ role: "property", sourcePath: join(xmlDir, helpXml) })
    expect(form?.externalFiles).not.toContainEqual(expect.objectContaining({ sourcePath: join(xmlDir, helpXml) }))
  })

  it("maps a real child-form Ext/Help/ru.html to Справка/ru.html", async () => {
    const formRoot = "DataProcessors/ОбработкаВсеСвойства/Forms/Форма"
    const helpHtml = `${formRoot}/Ext/Help/ru.html`
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs(["DataProcessors/ОбработкаВсеСвойства.xml", `${formRoot}.xml`, `${formRoot}/Ext/Help.xml`, helpHtml]),
    })

    const form = result.assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма/Форма.yaml"))
    expect(form?.externalFiles).toContainEqual({
      sourcePath: join(xmlDir, helpHtml),
      targetProjectPath: "Обработка/ОбработкаВсеСвойства/Формы/Форма/Справка/ru.html",
    })
  })

  it("maps a real form item Picture.png to its ExternalFormItemFile target", async () => {
    const formRoot = "DataProcessors/ОбработкаВсеСвойства/Forms/Форма"
    const picture = `${formRoot}/Ext/Form/Items/Декорация2/Picture.png`
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs(["DataProcessors/ОбработкаВсеСвойства.xml", `${formRoot}.xml`, picture]),
    })

    const form = result.assignments.find((assignment) => assignment.targetProjectPath.endsWith("/Форма/Форма.yaml"))
    expect(form?.externalFiles).toContainEqual({
      sourcePath: join(xmlDir, picture),
      targetProjectPath: "Обработка/ОбработкаВсеСвойства/Формы/Форма/Картинки/Декорация2.png",
    })
  })

  it("discovers child subsystems recursively at arbitrary dump depth", async () => {
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs([
        "Subsystems/Продажи.xml",
        "Subsystems/Продажи/Subsystems/Опт.xml",
        "Subsystems/Продажи/Subsystems/Опт/Subsystems/Регион.xml",
        "Subsystems/Продажи/Subsystems/Опт/Subsystems/Регион/Ext/Help.xml",
        "Subsystems/Продажи/Subsystems/Опт/Subsystems/Регион/Subsystems/Склад.xml",
      ]),
    })

    expect(result.assignments.map((assignment) => assignment.targetProjectPath)).toEqual([
      "Подсистема/Продажи/Подсистемы/Опт/Подсистемы/Регион/Подсистемы/Склад/Свойства.yaml",
      "Подсистема/Продажи/Подсистемы/Опт/Подсистемы/Регион/Свойства.yaml",
      "Подсистема/Продажи/Подсистемы/Опт/Свойства.yaml",
      "Подсистема/Продажи/Свойства.yaml",
    ])
    expect(result.assignments[1].xmlFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "metadata" }),
        expect.objectContaining({ role: "property" }),
      ])
    )
  })

  it("attaches a real child template XML and its payloads to the owner assignment", async () => {
    const templateRoot = "BusinessProcesses/БизнесПроцессВсеСвойства/Templates/Макет"
    const result = await discoverXmlImport({
      xmlDir,
      routes: describeRegisteredXmlImportRoutes(),
      fs: fakeFs([
        "BusinessProcesses/БизнесПроцессВсеСвойства.xml",
        `${templateRoot}.xml`,
        `${templateRoot}/Ext/Template.txt`,
        `${templateRoot}/Ext/Template.bin`,
      ]),
    })

    const owner = result.assignments.find(
      (assignment) => assignment.targetProjectPath === "БизнесПроцесс/БизнесПроцессВсеСвойства/Свойства.yaml"
    )
    expect(result.assignments).not.toContainEqual(
      expect.objectContaining({ targetProjectPath: expect.stringMatching(/\/Макеты\/Макет\/Template\.xml$/) })
    )
    expect(owner?.externalFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePath: join(xmlDir, `${templateRoot}.xml`),
          targetProjectPath: "БизнесПроцесс/БизнесПроцессВсеСвойства/Макеты/Макет/Template.xml",
        }),
        expect.objectContaining({
          sourcePath: join(xmlDir, `${templateRoot}/Ext/Template.txt`),
          targetProjectPath: "БизнесПроцесс/БизнесПроцессВсеСвойства/Макеты/Макет/Template.txt",
        }),
        expect.objectContaining({
          sourcePath: join(xmlDir, `${templateRoot}/Ext/Template.txt`),
          targetProjectPath: "БизнесПроцесс/БизнесПроцессВсеСвойства/Макеты/Макет/Ext/Template.txt",
        }),
        expect.objectContaining({
          sourcePath: join(xmlDir, `${templateRoot}/Ext/Template.bin`),
          targetProjectPath: "БизнесПроцесс/БизнесПроцессВсеСвойства/Макеты/Макет/Template.bin",
        }),
        expect.objectContaining({
          sourcePath: join(xmlDir, `${templateRoot}/Ext/Template.bin`),
          targetProjectPath: "БизнесПроцесс/БизнесПроцессВсеСвойства/Макеты/Макет/Ext/Template.bin",
        }),
      ])
    )
  })

  it("groups several XML inputs into the same assignment", async () => {
    const routes = [
      testRoutes[1],
      {
        ...testRoutes[1],
        xmlPattern: "Catalogs/{ownerName}/Ext/Predefined.xml",
        source: { kind: "property", propertyName: "predefined", propertyType: "Predefined" } as const,
      },
    ] satisfies readonly XmlImportRoute[]

    const result = await discoverXmlImport({
      xmlDir,
      routes,
      fs: fakeFs(["Catalogs/Контрагенты.xml", "Catalogs/Контрагенты/Ext/Predefined.xml"]),
    })

    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0].xmlFiles).toEqual([
      expect.objectContaining({ role: "metadata" }),
      expect.objectContaining({ role: "property" }),
    ])
  })

  it("ignores files that are not described by import routes", async () => {
    const fs = fakeFs(["z.bin", "Unknown.bin"])

    await expect(discoverXmlImport({ xmlDir, routes: testRoutes, fs })).resolves.toEqual({ assignments: [] })
    expect(fs.readFile).not.toHaveBeenCalled()
  })

  it("rejects incompatible matches for one source path", async () => {
    const conflictingRoutes = [
      testRoutes[1],
      { ...testRoutes[1], targetPattern: "Другой/{ownerName}/Свойства.yaml" },
    ] satisfies readonly XmlImportRoute[]

    await expect(
      discoverXmlImport({
        xmlDir,
        routes: conflictingRoutes,
        fs: fakeFs(["Catalogs/Контрагенты.xml"]),
      })
    ).rejects.toMatchObject({ code: "xml_import_route_conflict", paths: ["Catalogs/Контрагенты.xml"] })
  })

  it("rejects assignment matches with conflicting input roles", async () => {
    const conflictingRoutes = [
      { ...testRoutes[1], inputRole: "body" },
      { ...testRoutes[1], inputRole: "property" },
    ] satisfies readonly XmlImportRoute[]

    await expect(
      discoverXmlImport({
        xmlDir,
        routes: conflictingRoutes,
        fs: fakeFs(["Catalogs/Контрагенты.xml"]),
      })
    ).rejects.toMatchObject({ code: "xml_import_route_conflict", paths: ["Catalogs/Контрагенты.xml"] })
  })

  it("rejects an external file whose assignment is absent", async () => {
    await expect(
      discoverXmlImport({
        xmlDir,
        routes: [testRoutes[3]],
        fs: fakeFs(["Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form/Module.bsl"]),
      })
    ).rejects.toMatchObject({ code: "xml_import_assignment_missing" })
  })
})
