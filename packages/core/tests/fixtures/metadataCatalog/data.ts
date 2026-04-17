import { MetadataCatalog, MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"

//#region MetadataCatalog

export const full = {
  attributes: [
    {
      indexing: "Index",
      itemType: "MetadataAttribute",
      name: "РеквизитСправочника",
      synonym: {
        items: {
          ru: "Реквизит справочника",
        },
      },
      type: {
        dateQualifiers: {
          dateFractions: "Date",
        },
        type: ["dateTime"],
      },
    },
    {
      indexing: "Index",
      itemType: "MetadataAttribute",
      name: "СтроковыйРеквизитСИндексом",
      synonym: {
        items: {
          ru: "Строковый реквизит с индексом",
        },
      },
      type: {
        stringQualifiers: {
          allowedLength: "Variable",
          length: 10,
        },
        type: ["string"],
      },
    },
  ],
  autonumbering: false,
  basedOn: ["ChartOfAccounts.ПланСчетов1"],
  characteristics: [
    {
      itemType: "CharacteristicsDescription",
      characteristicTypes: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
      characteristicValues: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
      keyField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
      objectField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
      typeField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    },
  ],
  checkUnique: false,
  choiceDataGetModeOnInputByString: "Background",
  choiceHistoryOnInput: "DontUse",
  codeLength: 11,
  codeSeries: "WithinSubordination",
  codeType: "Number",
  commands: [
    {
      group: "NavigationPanelOrdinary",
      itemType: "MetadataCommand",
      name: "Команда1",
      synonym: {
        items: {
          ru: "synonym",
        },
      },
    },
  ],
  comment: "Комментарий",
  createOnInput: "DontUse",
  dataHistory: "Use",
  dataLockFields: [
    "Catalog.СправочникПолный.StandardAttribute.Description",
    "Catalog.СправочникПолный.StandardAttribute.Code",
  ],
  defaultChoiceForm: "Catalog.СправочникПолный.Form.ФормаВыбора",
  defaultFolderChoiceForm: "Catalog.СправочникПолный.Form.ФормаВыбораГруппы",
  defaultFolderForm: "Catalog.СправочникПолный.Form.ФормаГруппы",
  defaultListForm: "Catalog.СправочникПолный.Form.ФормаСписка",
  defaultObjectForm: "Catalog.СправочникПолный.Form.ФормаЭлемента",
  defaultPresentation: "AsCode",
  descriptionLength: 30,
  executeAfterWriteDataHistoryVersionProcessing: true,
  explanation: { items: { ru: "Пояснение" } },
  extendedListPresentation: { items: { ru: "Расширенное представление списка" } },
  extendedObjectPresentation: { items: { ru: "Расширенное представление" } },
  foldersOnTop: false,
  fullTextSearch: "DontUse",
  fullTextSearchOnInputByString: "Use",
  hierarchical: true,
  includeHelpInContents: true,
  inputByString: [
    "Catalog.СправочникПолный.StandardAttribute.Description",
    "Catalog.СправочникПолный.StandardAttribute.Code",
    "Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом",
  ],
  itemType: "MetadataCatalog",
  limitLevelCount: true,
  listPresentation: { items: { ru: "Представление списка" } },
  name: "СправочникПолный",
  objectPresentation: { items: { ru: "Представление объекта" } },
  owners: ["Catalog.СправочникВладелец"],
  predefinedDataUpdate: "AutoUpdate",
  quickChoice: true,
  searchStringModeOnInputByString: "AnyPart",
  standardAttributes: [
    {
      choiceParameterLinks: [
        {
          dataPath: "Catalog.СправочникПолный.StandardAttribute.Owner",
          name: "Отбор.Владелец",
          valueChange: "Clear",
        },
      ],
      fillFromFillingValue: true,
      fillValue: {
        type: "ref",
        value: "Catalog.СправочникПолный.EmptyRef",
      },
      itemType: "StandardAttributeDescription",
      name: "Parent",
    },
    {
      choiceForm: "Catalog.СправочникВладелец.Form.ФормаВыбора",
      choiceHistoryOnInput: "DontUse",
      choiceParameterLinks: [
        {
          dataPath: "Catalog.СправочникПолный.StandardAttribute.Description",
          name: "Отбор.Наименование",
          valueChange: "DontChange",
        },
      ],
      choiceParameters: [
        {
          name: "Отбор.Ссылка",
          value: {
            type: "ref",
            value: "Catalog.СправочникПолный.EmptyRef",
          },
        },
      ],
      comment: "Комментарий",
      createOnInput: "DontUse",
      dataHistory: "DontUse",
      fillValue: {
        type: "ref",
        value: "447e2bd8-fa43-442e-91db-b17634e036d9.c26f06ab-fb3e-46a7-a391-fdccd77b4231",
      },
      fullTextSearch: "DontUse",
      itemType: "StandardAttributeDescription",
      name: "Owner",
      quickChoice: "Use",
      synonym: {
        items: {
          ru: "Синоним",
        },
      },
      toolTip: {
        items: {
          ru: "Подсказка",
        },
      },
    },
    {
      fillChecking: "ShowError",
      itemType: "StandardAttributeDescription",
      name: "Description",
    },
  ],
  synonym: { items: { ru: "Синоним" } },
  tabularSections: [
    {
      attributes: [
        {
          itemType: "MetadataAttribute",
          name: "РеквизитТабличнойЧасти",
          synonym: {
            items: {
              ru: "Реквизит табличной части",
            },
          },
          type: {
            stringQualifiers: {
              allowedLength: "Variable",
              length: 10,
            },
            type: ["string"],
          },
        },
      ],
      itemType: "MetadataTabularSection",
      lineNumberLength: 9,
      name: "ТабличнаяЧасть",
      synonym: {
        items: {
          ru: "Табличная часть",
        },
      },
    },
  ],
  updateDataHistoryImmediatelyAfterWrite: true,
} satisfies MetadataCatalog

export const minimal: MetadataCatalog = {
  inputByString: [
    "Catalog.ПоУмолчанию.StandardAttribute.Description",
    "Catalog.ПоУмолчанию.StandardAttribute.Code",
  ],
  itemType: "MetadataCatalog",
  name: "ПоУмолчанию",
  synonym: {
    items: {
      ru: "По умолчанию",
    },
  },
}

export const withAttributesCatalog: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  attributes: [
    {
      itemType: "MetadataAttribute",
      name: "РеквизитОбъекта",
      synonym: { items: { ru: "Реквизит объекта" } },
      type: {
        type: ["string"],
      },
    },
  ],
  itemType: "MetadataCatalog",
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
  itemType: "MetadataCatalog",
}

//#endregion

//#region MetadataCatalogYAML

export const minimalYAML: MetadataCatalogYAML = {
  ВводПоСтроке: [
    "Справочник.ПоУмолчанию.СтандартныйРеквизит.Наименование",
    "Справочник.ПоУмолчанию.СтандартныйРеквизит.Код",
  ],
  Синоним: "По умолчанию",
}

export const fullYAML: MetadataCatalogYAML = {
  Автонумерация: "Ложь",
  БыстрыйВыбор: "Истина",
  ВводПоСтроке: [
    "Справочник.СправочникПолный.СтандартныйРеквизит.Наименование",
    "Справочник.СправочникПолный.СтандартныйРеквизит.Код",
    "Справочник.СправочникПолный.Реквизит.СтроковыйРеквизитСИндексом",
  ],
  ВводитсяНаОсновании: ["ПланСчетов.ПланСчетов1"],
  ВключатьСправкуВСодержание: "Истина",
  Владельцы: ["Справочник.СправочникВладелец"],
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: "Истина",
  ГруппыСверху: "Ложь",
  ДлинаКода: 11,
  ДлинаНаименования: 30,
  Иерархический: "Истина",
  ИсторияВыбораПриВводе: "НеИспользовать",
  ИсторияДанных: "Использовать",
  Команды: {
    Команда1: {
      Группа: "ПанельНавигацииОбычное",
      Синоним: "synonym",
    },
  },
  Комментарий: "Комментарий",
  КонтрольУникальности: "Ложь",
  ОбновлениеПредопределенныхДанных: "ОбновлятьАвтоматически",
  ОбновлятьИсториюДанныхСразуПослеЗаписи: "Истина",
  ОграничиватьКоличествоУровней: "Истина",
  ОсновнаяФормаГруппы: "Catalog.СправочникПолный.Form.ФормаГруппы",
  ОсновнаяФормаДляВыбора: "Catalog.СправочникПолный.Form.ФормаВыбора",
  ОсновнаяФормаДляВыбораГруппы: "Catalog.СправочникПолный.Form.ФормаВыбораГруппы",
  ОсновнаяФормаОбъекта: "Catalog.СправочникПолный.Form.ФормаЭлемента",
  ОсновнаяФормаСписка: "Catalog.СправочникПолный.Form.ФормаСписка",
  ОсновноеПредставление: "ВВидеКода",
  ПолнотекстовыйПоиск: "НеИспользовать",
  ПолнотекстовыйПоискПриВводеПоСтроке: "Использовать",
  ПоляБлокировкиДанных: [
    "Справочник.СправочникПолный.СтандартныйРеквизит.Наименование",
    "Справочник.СправочникПолный.СтандартныйРеквизит.Код",
  ],
  Пояснение: "Пояснение",
  ПредставлениеОбъекта: "Представление объекта",
  ПредставлениеСписка: "Представление списка",
  РасширенноеПредставлениеОбъекта: "Расширенное представление",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  РежимПолученияДанныхВыбораПриВводеПоСтроке: "Фоновый",
  Реквизиты: {
    РеквизитСправочника: {
      Индексирование: "Индексировать",
      Тип: "Дата",
    },
    СтроковыйРеквизитСИндексом: {
      Индексирование: "Индексировать",
      Синоним: "Строковый реквизит с индексом",
      Тип: "Строка(10)",
    },
  },
  СерииКодов: "ВПределахПодчинения",
  Синоним: "Синоним",
  СозданиеПриВводе: "НеИспользовать",
  СпособПоискаСтрокиПриВводеПоСтроке: "ЛюбаяЧасть",
  СтандартныеРеквизиты: {
    Родитель: {
      ЗаполнятьИзДанныхЗаполнения: "Истина",
      ЗначениеЗаполнения: "Справочник.СправочникПолный.ПустаяСсылка",
      СвязиПараметровВыбора: "Отбор.Владелец(Справочник.СправочникПолный.СтандартныйРеквизит.Владелец)",
    },
    Владелец: {
      БыстрыйВыбор: "Использовать",
      ЗначениеЗаполнения: "447e2bd8-fa43-442e-91db-b17634e036d9.c26f06ab-fb3e-46a7-a391-fdccd77b4231",
      ИсторияВыбораПриВводе: "НеИспользовать",
      ИсторияДанных: "НеИспользовать",
      Комментарий: "Комментарий",
      ПараметрыВыбора: {
        "Отбор.Ссылка": "Справочник.СправочникПолный.ПустаяСсылка",
      },
      Подсказка: "Подсказка",
      ПолнотекстовыйПоиск: "НеИспользовать",
      СвязиПараметровВыбора:
        "Отбор.Наименование(Справочник.СправочникПолный.СтандартныйРеквизит.Наименование, НеИзменять)",
      Синоним: "Синоним",
      СозданиеПриВводе: "НеИспользовать",
      ФормаВыбора: "Catalog.СправочникВладелец.Form.ФормаВыбора",
    },
    Наименование: {
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    },
  },
  ТабличныеЧасти: {
    ТабличнаяЧасть: {
      ДлинаНомераСтроки: 9,
      Реквизиты: {
        РеквизитТабличнойЧасти: "Строка(10)",
      },
    },
  },
  ТипКода: "Число",
  Характеристики: [
    {
      ВидыХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
      ЗначенияХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
      ПолеВида: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
      ПолеКлюча: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
      ПолеОбъекта: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
    },
  ],
}

//#endregion
