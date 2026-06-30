import { describe, expect, it } from "vitest"

import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  customSettingsFolderClientApplicationForm,
  customSettingsFolderClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  reportFormClientApplicationForm,
  reportFormClientApplicationFormYAML,
} from "./__fixtures__/data"
import { documentFullClientApplicationFormFromYAML } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAMLForImport } from "./__fixtures__/documentFull.yaml"
import { mockContext } from "~/tests/mockContext"
import { ButtonGroup } from "../elements/buttonGroup/types"
import { Table } from "../elements/table/types"
import { importClientApplicationFormFromYAML } from "./fromYAML"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"
import type { ConfigurationContext } from "~/metadata/context/types"

type ClientApplicationFormWithCustomSettingsFolder = ClientApplicationForm & {
  customSettingsFolder?: string
}

const fullClientApplicationFormFromYAML = {
  parameters: fullClientApplicationForm.parameters,
  commands: fullClientApplicationForm.commands,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: false,
    childItems: [],
  },
  commandInterface: fullClientApplicationForm.commandInterface,
  attributes: fullClientApplicationForm.attributes,
  autoSaveDataInSettings: fullClientApplicationForm.autoSaveDataInSettings,
  customizable: fullClientApplicationForm.customizable,
  verticalScroll: fullClientApplicationForm.verticalScroll,
  childItemsVerticalAlign: fullClientApplicationForm.childItemsVerticalAlign,
  verticalSpacing: fullClientApplicationForm.verticalSpacing,
  itemsAndTitlesAlign: fullClientApplicationForm.itemsAndTitlesAlign,
  height: fullClientApplicationForm.height,
  childItemsHorizontalAlign: fullClientApplicationForm.childItemsHorizontalAlign,
  horizontalSpacing: fullClientApplicationForm.horizontalSpacing,
  groupList: fullClientApplicationForm.groupList,
  enterKeyBehavior: fullClientApplicationForm.enterKeyBehavior,
  group: fullClientApplicationForm.group,
  title: fullClientApplicationForm.title,
  closeOnChoice: fullClientApplicationForm.closeOnChoice,
  closeOnOwnerClose: fullClientApplicationForm.closeOnOwnerClose,
  purposeUseKey: fullClientApplicationForm.purposeUseKey,
  windowOptionsKey: fullClientApplicationForm.windowOptionsKey,
  modalMode: fullClientApplicationForm.modalMode,
  modified: fullClientApplicationForm.modified,
  conversationsRepresentation: fullClientApplicationForm.conversationsRepresentation,
  commandBarLocation: fullClientApplicationForm.commandBarLocation,
  commandSet: fullClientApplicationForm.commandSet,
  formWindowOpeningMode: fullClientApplicationForm.formWindowOpeningMode,
  collapseItemsByImportance: fullClientApplicationForm.collapseItemsByImportance,
  saveDataInSettings: fullClientApplicationForm.saveDataInSettings,
  savedInSettingsDataModified: fullClientApplicationForm.savedInSettingsDataModified,
  readOnly: fullClientApplicationForm.readOnly,
  width: fullClientApplicationForm.width,
  childItems: fullClientApplicationForm.childItems,
  choiceAvailable: fullClientApplicationForm.choiceAvailable,
  useForFoldersAndItems: fullClientApplicationForm.useForFoldersAndItems,
  choiceParameters: fullClientApplicationForm.choiceParameters,
  choiceMode: fullClientApplicationForm.choiceMode,
  events: fullClientApplicationForm.events,
  synonym: fullClientApplicationForm.synonym,
  comment: fullClientApplicationForm.comment,
  includeHelpInContents: fullClientApplicationForm.includeHelpInContents,
  usePurposes: fullClientApplicationForm.usePurposes,
  itemType: fullClientApplicationForm.itemType,
} satisfies Omit<ClientApplicationForm, "slaveItemsWidth" | "usedFormServer">

const catalogFullClientApplicationFormFromYAML = {
  itemType: catalogFullClientApplicationForm.itemType,
  synonym: catalogFullClientApplicationForm.synonym,
  comment: catalogFullClientApplicationForm.comment,
  includeHelpInContents: catalogFullClientApplicationForm.includeHelpInContents,
  usePurposes: catalogFullClientApplicationForm.usePurposes,
  title: catalogFullClientApplicationForm.title,
  width: catalogFullClientApplicationForm.width,
  height: catalogFullClientApplicationForm.height,
  formWindowOpeningMode: catalogFullClientApplicationForm.formWindowOpeningMode,
  autoSaveDataInSettings: catalogFullClientApplicationForm.autoSaveDataInSettings,
  saveDataInSettings: catalogFullClientApplicationForm.saveDataInSettings,
  saveWindowSettings: catalogFullClientApplicationForm.saveWindowSettings,
  settingsStorage: catalogFullClientApplicationForm.settingsStorage,
  autoTitle: catalogFullClientApplicationForm.autoTitle,
  autoURL: catalogFullClientApplicationForm.autoURL,
  group: catalogFullClientApplicationForm.group,
  groupList: catalogFullClientApplicationForm.groupList,
  itemsAndTitlesAlign: catalogFullClientApplicationForm.itemsAndTitlesAlign,
  horizontalSpacing: catalogFullClientApplicationForm.horizontalSpacing,
  verticalSpacing: catalogFullClientApplicationForm.verticalSpacing,
  childItemsHorizontalAlign: catalogFullClientApplicationForm.childItemsHorizontalAlign,
  childItemsVerticalAlign: catalogFullClientApplicationForm.childItemsVerticalAlign,
  autoFillCheck: catalogFullClientApplicationForm.autoFillCheck,
  customizable: catalogFullClientApplicationForm.customizable,
  enabled: catalogFullClientApplicationForm.enabled,
  enterKeyBehavior: catalogFullClientApplicationForm.enterKeyBehavior,
  commandBarLocation: catalogFullClientApplicationForm.commandBarLocation,
  verticalScroll: catalogFullClientApplicationForm.verticalScroll,
  scalingMode: catalogFullClientApplicationForm.scalingMode,
  scale: catalogFullClientApplicationForm.scale,
  conversationsRepresentation: catalogFullClientApplicationForm.conversationsRepresentation,
  mobileDeviceCommandBarContent: catalogFullClientApplicationForm.mobileDeviceCommandBarContent,
  commandSet: catalogFullClientApplicationForm.commandSet,
  showTitle: catalogFullClientApplicationForm.showTitle,
  showCloseButton: catalogFullClientApplicationForm.showCloseButton,
  collapseItemsByImportance: catalogFullClientApplicationForm.collapseItemsByImportance,
  useForFoldersAndItems: catalogFullClientApplicationForm.useForFoldersAndItems,
  autoCommandBar: catalogFullClientApplicationForm.autoCommandBar,
  childItems: catalogFullClientApplicationForm.childItems,
  attributes: catalogFullClientApplicationForm.attributes,
  attributesConditionalAppearance: catalogFullClientApplicationForm.attributesConditionalAppearance,
  commands: catalogFullClientApplicationForm.commands,
  events: catalogFullClientApplicationForm.events,
} satisfies ClientApplicationForm

const documentFullClientApplicationFormExpectedFromYAML = {
  itemType: documentFullClientApplicationFormFromYAML.itemType,
  synonym: documentFullClientApplicationFormFromYAML.synonym,
  comment: documentFullClientApplicationFormFromYAML.comment,
  includeHelpInContents: documentFullClientApplicationFormFromYAML.includeHelpInContents,
  usePurposes: documentFullClientApplicationFormFromYAML.usePurposes,
  title: documentFullClientApplicationFormFromYAML.title,
  width: documentFullClientApplicationFormFromYAML.width,
  height: documentFullClientApplicationFormFromYAML.height,
  formWindowOpeningMode: documentFullClientApplicationFormFromYAML.formWindowOpeningMode,
  autoSaveDataInSettings: documentFullClientApplicationFormFromYAML.autoSaveDataInSettings,
  saveDataInSettings: documentFullClientApplicationFormFromYAML.saveDataInSettings,
  saveWindowSettings: documentFullClientApplicationFormFromYAML.saveWindowSettings,
  settingsStorage: documentFullClientApplicationFormFromYAML.settingsStorage,
  autoTitle: documentFullClientApplicationFormFromYAML.autoTitle,
  autoURL: documentFullClientApplicationFormFromYAML.autoURL,
  group: documentFullClientApplicationFormFromYAML.group,
  groupList: documentFullClientApplicationFormFromYAML.groupList,
  itemsAndTitlesAlign: documentFullClientApplicationFormFromYAML.itemsAndTitlesAlign,
  horizontalSpacing: documentFullClientApplicationFormFromYAML.horizontalSpacing,
  verticalSpacing: documentFullClientApplicationFormFromYAML.verticalSpacing,
  childItemsHorizontalAlign: documentFullClientApplicationFormFromYAML.childItemsHorizontalAlign,
  childItemsVerticalAlign: documentFullClientApplicationFormFromYAML.childItemsVerticalAlign,
  autoFillCheck: documentFullClientApplicationFormFromYAML.autoFillCheck,
  customizable: documentFullClientApplicationFormFromYAML.customizable,
  enabled: documentFullClientApplicationFormFromYAML.enabled,
  enterKeyBehavior: documentFullClientApplicationFormFromYAML.enterKeyBehavior,
  commandBarLocation: documentFullClientApplicationFormFromYAML.commandBarLocation,
  verticalScroll: documentFullClientApplicationFormFromYAML.verticalScroll,
  scalingMode: documentFullClientApplicationFormFromYAML.scalingMode,
  scale: documentFullClientApplicationFormFromYAML.scale,
  conversationsRepresentation: documentFullClientApplicationFormFromYAML.conversationsRepresentation,
  mobileDeviceCommandBarContent: documentFullClientApplicationFormFromYAML.mobileDeviceCommandBarContent,
  commandSet: documentFullClientApplicationFormFromYAML.commandSet,
  showTitle: documentFullClientApplicationFormFromYAML.showTitle,
  showCloseButton: documentFullClientApplicationFormFromYAML.showCloseButton,
  collapseItemsByImportance: documentFullClientApplicationFormFromYAML.collapseItemsByImportance,
  autoTime: documentFullClientApplicationFormFromYAML.autoTime,
  usePostingMode: documentFullClientApplicationFormFromYAML.usePostingMode,
  repostOnWrite: documentFullClientApplicationFormFromYAML.repostOnWrite,
  events: documentFullClientApplicationFormFromYAML.events,
  childItems: documentFullClientApplicationFormFromYAML.childItems,
  attributes: documentFullClientApplicationFormFromYAML.attributes,
  attributesConditionalAppearance: documentFullClientApplicationFormFromYAML.attributesConditionalAppearance,
  commands: documentFullClientApplicationFormFromYAML.commands,
  autoCommandBar: documentFullClientApplicationFormFromYAML.autoCommandBar,
} satisfies ClientApplicationForm

const reportFormClientApplicationFormFromYAML = {
  itemType: reportFormClientApplicationForm.itemType,
  synonym: reportFormClientApplicationForm.synonym,
  comment: reportFormClientApplicationForm.comment,
  includeHelpInContents: reportFormClientApplicationForm.includeHelpInContents,
  autoCommandBar: reportFormClientApplicationForm.autoCommandBar,
  childItems: reportFormClientApplicationForm.childItems,
  attributes: reportFormClientApplicationForm.attributes,
  commands: reportFormClientApplicationForm.commands,
  reportResult: reportFormClientApplicationForm.reportResult,
  detailsData: reportFormClientApplicationForm.detailsData,
  reportFormType: reportFormClientApplicationForm.reportFormType,
  variantAppearance: reportFormClientApplicationForm.variantAppearance,
  customSettingsFolder: reportFormClientApplicationForm.customSettingsFolder,
} satisfies Omit<
  typeof reportFormClientApplicationForm,
  "autoShowState" | "reportResultViewMode" | "viewModeApplicationOnSetReportResult"
>

const reportOwnerContext: ConfigurationContext = {
  ...mockContext,
  importFromYAML: {
    metadataTargetOwners: [{ itemType: "MetadataReport", name: "РасшифровкаСтатистики" }],
  },
}

describe("importClientApplicationFormFromYAML", () => {
  it("imports report form settings storage from a local form reference", () => {
    expect(
      importClientApplicationFormFromYAML(reportOwnerContext, {
        ХранилищеНастроек: "ФормаОтчета",
      })
    ).toMatchObject({
      settingsStorage: "Report.РасшифровкаСтатистики.Form.ФормаОтчета",
    })
  })

  it("imports complete form from one YAML source without source", () => {
    const data: ClientApplicationFormYAML = {
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
    }

    const result = importClientApplicationFormFromYAML(mockContext, data)

    expect(result).toEqual({
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
    })
  })

  it("imports disabled auto command bar autofill without source", () => {
    const data: ClientApplicationFormYAML = {
      КоманднаяПанель: {
        Автозаполнение: "Ложь",
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, data)

    expect(result.autoCommandBar).toEqual({
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [],
    })
  })

  it("should import all fields from YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, fullClientApplicationFormYAML, {
      commands: [],
      childItems: [{ name: "ПолеВвода1", itemType: "InputField" }],
      itemType: "ClientApplicationForm",
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
    })

    expect(result).toEqual(fullClientApplicationFormFromYAML)
  })

  it("imports catalog full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, catalogFullClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      synonym: { items: {} },
      comment: "",
      includeHelpInContents: false,
      commands: [],
      childItems: [
        {
          itemType: "Button",
          name: "ФормаКоманда1",
          type: "UsualButton",
          commandName: "Form.Command.Команда1",
        },
      ],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [
          {
            itemType: "CommandBarButton",
            name: "ФормаКоманда2",
            type: "CommandBarButton",
            commandName: "Form.Command.Команда1",
          },
        ],
      },
    })

    expect(result).toEqual(catalogFullClientApplicationFormFromYAML)
  })

  it("imports document full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, documentFullClientApplicationFormYAMLForImport, {
      itemType: "ClientApplicationForm",
      synonym: { items: {} },
      comment: "",
      includeHelpInContents: false,
      commands: [],
      childItems: [
        {
          itemType: "InputField",
          name: "Номер",
          contextMenu: {
            itemType: "ContextMenu",
            name: "НомерКонтекстноеМеню",
            childItems: [],
          },
          extendedTooltip: {
            itemType: "ExtendedTooltip",
          },
        },
        {
          itemType: "Button",
          name: "Команда1",
          extendedTooltip: {
            itemType: "ExtendedTooltip",
          },
        },
      ],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [],
      },
    })

    expect(result).toEqual(documentFullClientApplicationFormExpectedFromYAML)
  })

  it("should import from form command bar", () => {
    // const button: Button = {
    //   name: "Кнопка1",
    //   itemType: "Button",
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: "ButtonGroup",
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      КоманднаяПанель: {
        Элементы: {
          ГруппаКнопок1: {
            Вид: "ГруппаКнопок",
            Доступность: "Ложь",
            Элементы: {
              Кнопка1: {
                Вид: "Кнопка",
                ИмяКоманды: "Команда1",
              },
            },
          },
        },
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, enterpriseData, {
      commands: [],
      childItems: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [buttonGroup],
      },
      itemType: "ClientApplicationForm",
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [
          {
            name: "ГруппаКнопок1",
            itemType: "ButtonGroup",
            enabled: false,
            childItems: [
              {
                name: "Кнопка1",
                itemType: "Button",
                type: "UsualButton",
                commandName: "Команда1",
              },
            ],
          },
        ],
      },
      itemType: "ClientApplicationForm",
    }

    expect(result).toEqual(expectedResult)
  })

  it("should import from table command bar", () => {
    // const button: Button = {
    //   name: "Кнопка1",
    //   itemType: "Button",
    // }

    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: "ButtonGroup",
      childItems: [],
    }

    const table: Table = {
      name: "Таблица1",
      itemType: "Table",
      multipleChoice: false,
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [buttonGroup],
      },
      childItems: [],
    }

    const enterpriseData: ClientApplicationFormYAML = {
      Элементы: {
        Таблица1: {
          Вид: "ТаблицаФормы",
          МножественныйВыбор: "Ложь",
          КоманднаяПанель: {
            Элементы: {
              ГруппаКнопок1: {
                Вид: "ГруппаКнопок",
                Доступность: "Ложь",
                Элементы: {
                  Кнопка1: {
                    Вид: "Кнопка",
                    ИмяКоманды: "Команда1",
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, enterpriseData, {
      childItems: [table],
      itemType: "ClientApplicationForm",
      commands: [],
    })

    const expectedResult: ClientApplicationForm = {
      commands: [],
      childItems: [
        {
          name: "Таблица1",
          itemType: "Table",
          multipleChoice: false,
          autoCommandBar: {
            itemType: "AutoCommandBar",
            autofill: true,
            childItems: [
              {
                name: "ГруппаКнопок1",
                itemType: "ButtonGroup",
                enabled: false,
                childItems: [
                  {
                    name: "Кнопка1",
                    itemType: "Button",
                    type: "UsualButton",
                    commandName: "Команда1",
                  },
                ],
              },
            ],
          },
          childItems: [],
        },
      ],
      itemType: "ClientApplicationForm",
    }

    expect(result).toEqual(expectedResult)
  })

  it("imports CustomSettingsFolder from YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, customSettingsFolderClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [],
    })

    expect((result as ClientApplicationFormWithCustomSettingsFolder).customSettingsFolder).toBe(
      customSettingsFolderClientApplicationForm.customSettingsFolder
    )
  })

  it("does not apply report form Auto defaults when importing YAML", () => {
    expect(reportFormClientApplicationFormYAML).not.toHaveProperty("АвтоОтображениеСостояния")
    expect(reportFormClientApplicationFormYAML).not.toHaveProperty("РежимОтображенияРезультатаОтчета")
    expect(reportFormClientApplicationFormYAML).not.toHaveProperty(
      "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета"
    )

    const result = importClientApplicationFormFromYAML(
      mockContext,
      reportFormClientApplicationFormYAML,
      reportFormClientApplicationFormFromYAML
    )

    expect(result).toEqual(reportFormClientApplicationFormFromYAML)
  })
})
