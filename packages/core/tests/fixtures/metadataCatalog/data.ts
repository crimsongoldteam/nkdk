import { MetadataCatalog } from "~/metadata/appliedObjects/metadataCatalog/types"

export const full: MetadataCatalog = {
  additionalIndexes: [
    {
      indexedFields: ["Catalog.Контрагенты.Attribute.РеквизитОбъекта"],
      name: "Индекс1",
    },
  ],
  autonumbering: true,
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
  checkUnique: true,
  choiceDataGetModeOnInputByString: "Directly",
  choiceHistoryOnInput: "Auto",
  choiceMode: "BothWays",
  codeAllowedLength: "Variable",
  codeLength: 9,
  codeSeries: "WholeCatalog",
  codeType: "String",
  comment: "Комментарий к справочнику",
  createOnInput: "Use",
  dataHistory: "DontUse",
  dataLockControlMode: "Managed",
  dataLockFields: ["Catalog.Контрагенты.Attribute.РеквизитОбъекта"],
  defaultChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбора",
  defaultFolderChoiceForm: "Catalog.Контрагенты.Form.ФормаВыбораГруппы",
  defaultFolderForm: "Catalog.Контрагенты.Form.ФормаГруппы",
  defaultListForm: "Catalog.Контрагенты.Form.ФормаСписка",
  defaultObjectForm: "Catalog.Контрагенты.Form.ФормаЭлемента",
  defaultPresentation: "AsDescription",
  descriptionLength: 25,
  editType: "InDialog",
  executeAfterWriteDataHistoryVersionProcessing: false,
  explanation: { items: { ru: "Пояснение к справочнику" } },
  extendedListPresentation: { items: { ru: "Расширенное представление списка" } },
  extendedObjectPresentation: { items: { ru: "Расширенное представление объекта" } },
  foldersOnTop: true,
  fullTextSearch: "Use",
  fullTextSearchOnInputByString: "DontUse",
  hierarchical: false,
  hierarchyType: "HierarchyFoldersAndItems",
  includeHelpInContents: false,
  inputByString: ["Catalog.Контрагенты.StandardAttribute.Description", "Catalog.Контрагенты.StandardAttribute.Code"],
  levelCount: 2,
  limitLevelCount: false,
  listPresentation: { items: { ru: "Представление списка" } },
  name: "Контрагенты",
  objectBelonging: "Independent",
  objectPresentation: { items: { ru: "Представление объекта" } },
  owners: ["Catalog.Владелец"],
  predefined: [
    {
      name: "ПредопределенныйЭлемент",
      code: "Код1",
      description: "Описание предопределенного элемента",
      isFolder: false,
    },
  ],
  predefinedDataUpdate: "Auto",
  quickChoice: false,
  searchStringModeOnInputByString: "Begin",
  standardAttributes: [
    {
      name: "PredefinedDataName",
      choiceHistoryOnInput: "Auto",
      createOnInput: "Auto",
      dataHistory: "Use",
      extendedEdit: false,
      fillChecking: "DontCheck",
      fillFromFillingValue: false,
      fullTextSearch: "Use",
      markNegatives: false,
      multiLine: false,
      passwordMode: false,
      quickChoice: "Auto",
    },
  ],
  subordinationUse: "ToItems",
  synonym: { items: { ru: "Контрагенты" } },
  updateDataHistoryImmediatelyAfterWrite: false,
  useStandardCommands: true,
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
