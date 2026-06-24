import { MetadataDocument, MetadataDocumentYAML } from "../types"
import { explicitYAMLString } from "~/yaml/explicitString"

export const full: MetadataDocument = {
  actionsWritingOnPost: "WriteSelected",
  attributes: [
    {
      fillValue: {
        type: "string",
        value: "",
      },
      itemType: "MetadataAttribute",
      name: "СтроковыйРеквизит",
      synonym: {
        items: {
          ru: "Строковый реквизит",
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
    {
      fillValue: {
        type: "string",
        value: "",
      },
      indexing: "Index",
      itemType: "MetadataAttribute",
      name: "ИндексированноеПоле",
      synonym: {
        items: {
          ru: "Индексированное поле",
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
  basedOn: ["Catalog.СправочникСВладельцем"],
  characteristics: [
    {
      characteristicTypes: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
      characteristicValues: "Catalog.СправочникПолный",
      dataPathField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      itemType: "CharacteristicsDescription",
      keyField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      objectField: "Catalog.СправочникПолный.Attribute.Реквизит1",
      typeField: "Catalog.СправочникПолный.Attribute.Реквизит1",
    },
  ],
  choiceDataGetModeOnInputByString: "Background",
  choiceHistoryOnInput: "DontUse",
  comment: "Комментарий",
  commands: [
    {
      group: "NavigationPanelImportant",
      itemType: "MetadataCommand",
      name: "Команда1",
    },
  ],
  createOnInput: "DontUse",
  dataHistory: "Use",
  dataLockFields: [
    "Document.ДокументВсеСвойства.StandardAttribute.Number",
    "Document.ДокументВсеСвойства.StandardAttribute.Date",
  ],
  defaultChoiceForm: "Document.ДокументВсеСвойства.Form.ФормаВыбора",
  defaultListForm: "Document.ДокументВсеСвойства.Form.ФормаСписка",
  defaultObjectForm: "Document.ДокументВсеСвойства.Form.ФормаДокумента",
  executeAfterWriteDataHistoryVersionProcessing: true,
  explanation: {
    items: {
      ru: "Пояснение\n",
    },
  },
  extendedListPresentation: {
    items: {
      ru: "Расширенное представление списка",
    },
  },
  extendedObjectPresentation: {
    items: {
      ru: "Расширенное предствление объекта",
    },
  },
  fullTextSearch: "DontUse",
  fullTextSearchOnInputByString: "Use",
  includeHelpInContents: true,
  inputByString: [
    "Document.ДокументВсеСвойства.StandardAttribute.Number",
    "Document.ДокументВсеСвойства.Attribute.ИндексированноеПоле",
  ],
  itemType: "MetadataDocument",
  listPresentation: {
    items: {
      ru: "Представление списка",
    },
  },
  name: "ДокументВсеСвойства",
  numberType: "Number",
  objectPresentation: {
    items: {
      ru: "Представление объекта",
    },
  },
  posting: "Allow",
  privilegedPostingMode: true,
  privilegedUnpostingMode: true,
  realTimePosting: "Allow",
  registerRecords: [
    "InformationRegister.РегистрСведенийПодчиненРегистратору",
    "AccumulationRegister.РегистрНакопления1",
    "AccountingRegister.РегистрБухгалтерии1",
    "CalculationRegister.РегистрРасчета1",
  ],
  registerRecordsDeletion: "AutoDeleteOnUnpost",
  searchStringModeOnInputByString: "AnyPart",
  standardAttributes: [
    {
      fillChecking: "ShowError",
      itemType: "StandardAttributeDescription",
      name: "Date",
    },
    {
      itemType: "StandardAttributeDescription",
      name: "Number",
      synonym: {
        items: {
          ru: "СинонимНомер",
        },
      },
    },
  ],
  synonym: {
    items: {
      ru: "Синоним",
    },
  },
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
}

export const fullYAML: MetadataDocumentYAML = {
  Автонумерация: "Ложь",
  ВводитсяНаОсновании: ["Справочник.СправочникСВладельцем"],
  ВводПоСтроке: [
    "СтандартныйРеквизит.Номер",
    "Реквизит.ИндексированноеПоле",
  ],
  ВключатьСправкуВСодержание: "Истина",
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: "Истина",
  Движения: [
    "РегистрСведений.РегистрСведенийПодчиненРегистратору",
    "РегистрНакопления.РегистрНакопления1",
    "РегистрБухгалтерии.РегистрБухгалтерии1",
    "РегистрРасчета.РегистрРасчета1",
  ],
  ЗаписьДвиженийПриПроведении: "ЗаписыватьВыбранные",
  ИсторияВыбораПриВводе: "НеИспользовать",
  ИсторияДанных: "Использовать",
  Команды: {
    Команда1: {
      Группа: "ПанельНавигацииВажное",
    },
  } as MetadataDocumentYAML["Команды"],
  Комментарий: "Комментарий",
  ОбновлятьИсториюДанныхСразуПослеЗаписи: "Истина",
  ОперативноеПроведение: "Разрешить",
  ОсновнаяФормаДляВыбора: "ФормаВыбора",
  ОсновнаяФормаОбъекта: "ФормаДокумента",
  ОсновнаяФормаСписка: "ФормаСписка",
  ПолнотекстовыйПоиск: "НеИспользовать",
  ПолнотекстовыйПоискПриВводеПоСтроке: "Использовать",
  ПоляБлокировкиДанных: [
    "СтандартныйРеквизит.Номер",
    "СтандартныйРеквизит.Дата",
  ],
  Пояснение: "Пояснение\n",
  ПредставлениеОбъекта: "Представление объекта",
  ПредставлениеСписка: "Представление списка",
  ПривилегированныйРежимПриОтменеПроведения: "Истина",
  ПривилегированныйРежимПриПроведении: "Истина",
  Проведение: "Разрешить",
  РасширенноеПредставлениеОбъекта: "Расширенное предствление объекта",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  РежимПолученияДанныхВыбораПриВводеПоСтроке: "Фоновый",
  Реквизиты: {
    СтроковыйРеквизит: {
      ЗначениеЗаполнения: explicitYAMLString(""),
      Тип: "Строка(10)",
    },
    ИндексированноеПоле: {
      ЗначениеЗаполнения: explicitYAMLString(""),
      Индексирование: "Индексировать",
      Тип: "Строка(10)",
    },
  } as MetadataDocumentYAML["Реквизиты"],
  Синоним: "Синоним",
  СозданиеПриВводе: "НеИспользовать",
  СпособПоискаСтрокиПриВводеПоСтроке: "ЛюбаяЧасть",
  СтандартныеРеквизиты: {
    Дата: {
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    },
    Номер: {
      Синоним: "СинонимНомер",
    },
  } as MetadataDocumentYAML["СтандартныеРеквизиты"],
  ТабличныеЧасти: {
    ТабличнаяЧасть: {
      ДлинаНомераСтроки: 9,
      Реквизиты: {
        РеквизитТабличнойЧасти: { Тип: "Строка(10)" },
      },
    },
  } as MetadataDocumentYAML["ТабличныеЧасти"],
  ТипНомера: "Число",
  УдалениеДвижений: "УдалятьАвтоматическиПриОтменеПроведения",
  Характеристики: [
    {
      ВидыХарактеристик: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
      ЗначенияХарактеристик: "Catalog.СправочникПолный",
      ПолеВида: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеКлюча: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      ПолеОбъекта: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеПутиКДанным: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    },
  ] as unknown as MetadataDocumentYAML["Характеристики"],
}
