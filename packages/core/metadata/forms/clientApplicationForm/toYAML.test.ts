import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  customSettingsFolderClientApplicationForm,
  customSettingsFolderClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  minimalClientApplicationForm,
  minimalClientApplicationFormYAML,
  reportFormClientApplicationForm,
  reportFormClientApplicationFormYAML,
} from "./__fixtures__/data"
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAML } from "./__fixtures__/documentFull.yaml"
import { mockContextToYAML } from "../../../tests/mockContext"
import { exportClientApplicationFormToYAML } from "./toYAML"
import { ClientApplicationForm } from "./types"
import type { ConfigurationContext } from "../../context/types"
import { createImportSharedMetadata } from "../../importFromXml/metadataSnapshot"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../../validation/dataPath/sharedOwnerCache"
import "../../appliedObjects/dataPathCommon/register"
import "../../appliedObjects/metadataCatalog/register"

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("exportClientApplicationFormToYAML", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = exportClientApplicationFormToYAML(mockContext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should export all fields to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, fullClientApplicationForm)

    expect(yaml).toEqual(fullClientApplicationFormYAML)
  })

  it("exports form and command bar elements from one YAML source", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [
          {
            itemType: "Button",
            name: "Записать",
            type: "UsualButton",
            commandName: "Записать",
          },
        ],
      },
      childItems: [
        {
          itemType: "InputField",
          name: "Товар",
          dataPath: "Объект.Товар",
        },
      ],
    }

    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, form)

    expect(yaml).toEqual({
      КоманднаяПанель: {
        Элементы: {
          Записать: {
            Вид: "Кнопка",
            ИмяКоманды: "Записать",
          },
        },
      },
      Элементы: {
        Товар: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Товар",
        },
      },
    })
  })

  it("exports disabled auto command bar autofill to YAML", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
      childItems: [],
    }

    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, form)

    expect(yaml).toEqual({
      КоманднаяПанель: {
        Автозаполнение: "Ложь",
      },
    })
  })

  it("exports catalog full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, catalogFullClientApplicationForm)

    expect(yaml).toEqual(catalogFullClientApplicationFormYAML)
  })

  it("exports document full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, documentFullClientApplicationForm)

    expect(yaml).toEqual(documentFullClientApplicationFormYAML)
  })

  it("keeps dynamic list field data paths in XML spelling", () => {
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        metadataTargetOwners: [{ itemType: "MetadataBusinessProcess", name: "Заявка" }],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Список",
          type: { type: ["DynamicList"] },
          columns: [],
        },
      ],
      childItems: [
        {
          itemType: "LabelField",
          name: "Номер",
          dataPath: "Список.Number",
        },
      ],
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml?.Элементы?.Номер).toMatchObject({
      Вид: "ПолеНадписи",
      ПутьКДанным: "Список.Number",
    })
  })

  it("keeps ValueTable field data paths in internal-to-yaml formatting", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Список",
          type: { type: ["ValueTable"] },
          columns: [{ name: "Код", type: { type: ["string"] } }],
        },
      ],
      childItems: [{ itemType: "InputField", name: "Код", dataPath: "Список.Код" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(contextWithProjectDir(), form)

    expect(yaml?.Элементы?.Код).toMatchObject({ ПутьКДанным: "Список.Код" })
  })

  it("exports object standard member data paths to YAML spelling", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [{ itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Товары"] }, columns: [] }],
      childItems: [{ itemType: "InputField", name: "Код", dataPath: "Объект.Code" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(contextWithProjectDir(), form)

    expect(yaml?.Элементы?.Код).toMatchObject({ ПутьКДанным: "Объект.Код" })
  })

  it("exports data paths through an injected owner cache without a YAML project", () => {
    const codeField = {
      name: "Код",
      targetName: "Code",
      kind: "standardAttribute" as const,
      sourceCollection: "standardAttributes",
      typeInfo: { kinds: ["scalar" as const], nextTypes: [], sourceText: "Catalog.Code" },
    }
    const snapshot = createImportSharedMetadata([
      {
        ref: { kind: "Справочник", name: "Товары" },
        filePath: "Справочник/Товары/Свойства.yaml",
        fieldIndex: {
          fields: new Map([
            ["Code", codeField],
            ["Код", codeField],
          ]),
          standardAttributeAliases: new Map([["Code", "Код"]]),
          diagnostics: [],
        },
      },
    ])
    const ownerMetadataCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
      projectDir: "/project-must-not-be-read",
      snapshot,
    })
    const ownerResult = ownerMetadataCache.get({ kind: "Справочник", name: "Товары" })
    expect(ownerResult.status).toBe("ok")
    if (ownerResult.status !== "ok") throw new Error("Ожидался владелец")
    expect([...ownerResult.owner.fieldIndex.standardAttributeAliases]).toEqual([["Code", "Код"]])
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        ownerMetadataCache,
        metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [{ itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Товары"] }, columns: [] }],
      childItems: [{ itemType: "InputField", name: "Код", dataPath: "Объект.Code" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml?.Элементы?.Код).toMatchObject({ ПутьКДанным: "Объект.Код" })
  })

  it("exports tabular section row number data paths to YAML spelling", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [{ itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Товары"] }, columns: [] }],
      childItems: [{ itemType: "LabelField", name: "НомерСтроки", dataPath: "Объект.Состав.LineNumber" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(contextWithProjectDir(), form)

    expect(yaml?.Элементы?.НомерСтроки).toMatchObject({ ПутьКДанным: "Объект.Состав.НомерСтроки" })
  })

  it("exports report form settings storage as a local form reference", () => {
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        metadataTargetOwners: [
          {
            itemType: "MetadataReport",
            name: "РасшифровкаСтатистики",
            owner: { root: "Report", objectName: "РасшифровкаСтатистики" },
          },
        ],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
      settingsStorage: "Report.РасшифровкаСтатистики.Form.ФормаОтчета",
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml).toEqual({
      ХранилищеНастроек: "ФормаОтчета",
    })
  })

  it("exports report form settings storage as an external report form reference", () => {
    const context: ConfigurationContext = {
      ...mockContextToYAML,
      exportToYAML: {
        ...mockContextToYAML.exportToYAML!,
        metadataTargetOwners: [
          {
            itemType: "MetadataReport",
            name: "РегистрНалоговогоУчетаФедеральногоИнвестиционногоВычета",
            owner: { root: "Report", objectName: "РегистрНалоговогоУчетаФедеральногоИнвестиционногоВычета" },
          },
        ],
      },
    }
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
      settingsStorage: "Report.РегистрыНалоговогоУчета.Form.ФормаОтчета",
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml).toEqual({
      ХранилищеНастроек: "Отчет.РегистрыНалоговогоУчета.Форма.ФормаОтчета",
    })
  })

  it("should export minimal", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, minimalClientApplicationForm)

    expect(yaml).toEqual(minimalClientApplicationFormYAML)
  })

  it("exports CustomSettingsFolder to YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, customSettingsFolderClientApplicationForm)

    expect((yaml as typeof customSettingsFolderClientApplicationFormYAML).ГруппаПользовательскихНастроек).toBe(
      customSettingsFolderClientApplicationFormYAML.ГруппаПользовательскихНастроек
    )
  })

  it("omits report form Auto defaults when exporting YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, reportFormClientApplicationForm)

    expect(yaml).toEqual(reportFormClientApplicationFormYAML)
    expect(yaml).not.toHaveProperty("АвтоОтображениеСостояния")
    expect(yaml).not.toHaveProperty("РежимОтображенияРезультатаОтчета")
    expect(yaml).not.toHaveProperty("ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета")
  })
})

function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(
    join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
    [
      "Имя: Товары",
      "ТабличныеЧасти:",
      "  Состав:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
      "",
    ].join("\n"),
    "utf-8"
  )
  return {
    ...mockContextToYAML,
    exportToYAML: {
      ...mockContextToYAML.exportToYAML!,
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
