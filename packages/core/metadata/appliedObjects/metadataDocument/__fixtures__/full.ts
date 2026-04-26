import { MetadataDocument, MetadataDocumentYAML } from "../types"

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

// FIXME: ключ "undefined" в `СтандартныеРеквизиты` — баг текущего YAML-экспорта
// (имя StandardAttribute теряется при ключевании коллекции). Снапшот фиксирует
// реальный вывод; после фикса правила фикстура должна быть обновлена в том же PR.
export const fullYAML: MetadataDocumentYAML = {
  Автонумерация: "Ложь",
  ВводитсяНаОсновании: ["Справочник.СправочникСВладельцем"],
  ВводПоСтроке: [
    "Документ.ДокументВсеСвойства.СтандартныйРеквизит.Number",
    "Документ.ДокументВсеСвойства.Реквизит.ИндексированноеПоле",
  ],
  ВключатьСправкуВСодержание: "Истина",
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: "Истина",
  Движения: [
    "РегистрСведений.РегистрСведенийПодчиненРегистратору",
    "AccumulationRegister.РегистрНакопления1",
    "AccountingRegister.РегистрБухгалтерии1",
    "CalculationRegister.РегистрРасчета1",
  ],
  ЗаписьДвиженийПриПроведении: "ЗаписыватьВыбранные",
  ИсторияВыбораПриВводе: "НеИспользовать",
  ИсторияДанных: "Использовать",
  Команды: {
    Команда1: "ПанельНавигацииВажное",
  } as MetadataDocumentYAML["Команды"],
  Комментарий: "Комментарий",
  ОбновлятьИсториюДанныхСразуПослеЗаписи: "Истина",
  ОперативноеПроведение: "Разрешить",
  ОсновнаяФормаДляВыбора: "Document.ДокументВсеСвойства.Form.ФормаВыбора",
  ОсновнаяФормаОбъекта: "Document.ДокументВсеСвойства.Form.ФормаДокумента",
  ОсновнаяФормаСписка: "Document.ДокументВсеСвойства.Form.ФормаСписка",
  ПолнотекстовыйПоиск: "НеИспользовать",
  ПолнотекстовыйПоискПриВводеПоСтроке: "Использовать",
  ПоляБлокировкиДанных: [
    "Документ.ДокументВсеСвойства.СтандартныйРеквизит.Number",
    "Документ.ДокументВсеСвойства.СтандартныйРеквизит.Date",
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
      ЗначениеЗаполнения: '""',
      Тип: "Строка(10)",
    },
    ИндексированноеПоле: {
      ЗначениеЗаполнения: '""',
      Индексирование: "Индексировать",
      Тип: "Строка(10)",
    },
  } as MetadataDocumentYAML["Реквизиты"],
  Синоним: "Синоним",
  СозданиеПриВводе: "НеИспользовать",
  СпособПоискаСтрокиПриВводеПоСтроке: "ЛюбаяЧасть",
  СтандартныеРеквизиты: {
    undefined: {
      Синоним: "СинонимНомер",
    },
  } as MetadataDocumentYAML["СтандартныеРеквизиты"],
  ТабличныеЧасти: {
    ТабличнаяЧасть: {
      ДлинаНомераСтроки: 9,
      Реквизиты: {
        РеквизитТабличнойЧасти: "Строка(10)",
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
