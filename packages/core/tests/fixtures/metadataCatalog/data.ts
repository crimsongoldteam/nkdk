import { MetadataCatalog } from "~/metadata/appliedObjects/metadataCatalog/types"

export const full: MetadataCatalog = {
  autonumbering: false,
  auxiliaryChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбора",
  auxiliaryFolderChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбораГруппы",
  auxiliaryFolderForm: "Catalog.Контрагенты.Form.ФормаГруппы",
  auxiliaryListForm: "Catalog.Контрагенты.Form.ФормаСписка",
  auxiliaryObjectForm: "Catalog.Контрагенты.Form.ФормаЭлемента",
  basedOn: ["Catalog.ДругойСправочник"],
  characteristics: [
    {
      characteristicTypes: "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты",
      characteristicValues: "Catalog.Контрагенты.TabularSection.ДополнительныеРеквизиты",
      keyField:
        "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты.Attribute.Свойство",
      typesFilterField:
        "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты.Attribute.ИмяПредопределенногоНабора",
      typesFilterValue: {
        type: "string",
        value: "Справочник_Контрагенты",
      },
      objectField: "Catalog.Контрагенты.TabularSection.ДополнительныеРеквизиты.StandardAttribute.Ref",
      typeField: "Catalog.Контрагенты.TabularSection.ДополнительныеРеквизиты.Attribute.Свойство",
      valueField: "Catalog.Контрагенты.TabularSection.ДополнительныеРеквизиты.Attribute.Значение",
    },
  ],
  checkUnique: false,
  choiceDataGetModeOnInputByString: "Background",
  choiceHistoryOnInput: "DontUse",
  choiceMode: "QuickChoice",
  codeAllowedLength: "Fixed",
  codeLength: 10,
  codeSeries: "WithinSubordination",
  codeType: "Number",
  commands: [
    {
      group: "ActionsPanelCreate",
      name: "НовыйЭлемент",
      synonym: {
        items: {
          ru: "Контрагенты",
        },
      },
    },
  ],
  comment: "Комментарий к справочнику",
  createOnInput: "DontUse",
  dataHistory: "Use",
  dataLockControlMode: "Automatic",
  dataLockFields: ["Catalog.Контрагенты.Attribute.РеквизитОбъекта"],
  defaultChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбора",
  defaultFolderChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбораГруппы",
  defaultFolderForm: "Catalog.Контрагенты.Form.ФормаГруппы",
  defaultListForm: "Catalog.Контрагенты.Form.ФормаСписка",
  defaultObjectForm: "Catalog.Контрагенты.Form.ФормаЭлемента",
  defaultPresentation: "AsCode",
  descriptionLength: 30,
  editType: "InList",
  executeAfterWriteDataHistoryVersionProcessing: true,
  explanation: { items: { ru: "Пояснение к справочнику" } },
  extendedListPresentation: { items: { ru: "Расширенное представление списка" } },
  extendedObjectPresentation: { items: { ru: "Расширенное представление объекта" } },
  foldersOnTop: false,
  fullTextSearch: "DontUse",
  fullTextSearchOnInputByString: "Use",
  hierarchical: true,
  hierarchyType: "HierarchyOfItems",
  includeHelpInContents: true,
  inputByString: ["Catalog.Контрагенты.StandardAttribute.Description", "Catalog.Контрагенты.StandardAttribute.Code"],
  levelCount: 3,
  limitLevelCount: true,
  listPresentation: { items: { ru: "Представление списка" } },
  name: "Контрагенты",
  objectPresentation: { items: { ru: "Представление объекта" } },
  owners: ["Catalog.Владелец"],
  predefinedDataUpdate: "DontAutoUpdate",
  quickChoice: true,
  searchStringModeOnInputByString: "AnyPart",
  standardAttributes: [
    {
      name: "Code",
      synonym: { items: { ru: "Поле код" } },
    },
  ],
  subordinationUse: "ToFolders",
  synonym: { items: { ru: "Контрагенты" } },
  tabularSections: [
    {
      attributes: [
        {
          name: "РеквизитТабличнойЧасти",
          synonym: {
            items: {
              ru: "Реквизит табличной части",
            },
          },
          type: {
            type: ["string"],
          },
        },
      ],
      name: "ДополнительныеРеквизиты",
      synonym: {
        items: {
          ru: "Дополнительные реквизиты",
        },
      },
    },
  ],
  updateDataHistoryImmediatelyAfterWrite: true,
  useStandardCommands: false,
  attributes: [
    {
      name: "РеквизитОбъекта",
      synonym: { items: { ru: "Реквизит объекта" } },
      type: {
        type: ["string"],
      },
    },
  ],
}

export const minimal: MetadataCatalog = {
  name: "Контрагенты",
}

export const withAttributesCatalog: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  attributes: [
    {
      name: "РеквизитОбъекта",
      synonym: { items: { ru: "Реквизит объекта" } },
      type: {
        type: ["string"],
      },
    },
  ],
}

export const withCommands: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  commands: [
    {
      group: "ActionsPanelCreate",
      name: "Команда1",
      synonym: {
        items: {
          ru: "Команда 1",
        },
      },
    },
    {
      name: "Команда2",
      synonym: {
        items: {
          ru: "Команда 2",
        },
      },
    } as any,
  ],
}
