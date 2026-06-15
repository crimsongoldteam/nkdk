import { MetadataDataProcessor, MetadataDataProcessorYAML } from "../types"

export const full: MetadataDataProcessor = {
  itemType: "MetadataDataProcessor",
  name: "ОбработкаВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  defaultForm: "DataProcessor.ОбработкаВсеСвойства.Form.Форма",
  extendedPresentation: { items: { ru: "Расширенное представление" } },
  explanation: { items: { ru: "Пояснение\n" } },
  attributes: [
    {
      itemType: "MetadataAttribute",
      name: "РеквизитВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      type: { type: ["CatalogRef.СправочникПолный"] },
      passwordMode: true,
      format: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
      editFormat: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
      toolTip: { items: { ru: "Подсказка" } },
      markNegatives: true,
      mask: "Маска",
      multiLine: true,
      extendedEdit: true,
      minValue: 4,
      maxValue: 96,
      fillChecking: "ShowError",
      choiceParameterLinks: [
        {
          name: "Отбор.ЭтоГруппа",
          dataPath: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитБулево",
          valueChange: "Clear",
        },
      ],
      choiceParameters: [
        {
          name: "Отбор.Наименование",
          value: { type: "boolean", value: false },
        },
      ],
      createOnInput: "DontUse",
      choiceForm: "Catalog.СправочникПолный.Form.ФормаВыбора",
      linkByType: {
        dataPath: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитБулево",
        linkItem: 1,
      },
      choiceHistoryOnInput: "DontUse",
    },
    {
      itemType: "MetadataAttribute",
      name: "РеквизитБулево",
      synonym: { items: { ru: "Реквизит булево" } },
      type: { type: ["boolean"] },
    },
  ],
  tabularSections: [
    {
      itemType: "MetadataTabularSection",
      name: "ТабличнаяЧастьВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      toolTip: { items: { ru: "Подсказка" } },
      fillChecking: "ShowError",
      standardAttributes: [
        {
          itemType: "StandardAttributeDescription",
          name: "LineNumber",
          synonym: { items: { ru: "Синоним номер строки" } },
        },
      ],
      attributes: [
        {
          itemType: "MetadataAttribute",
          name: "РеквизитТаблицыВсеСвойства",
          synonym: { items: { ru: "Синоним" } },
          comment: "Комментарий",
          type: {
            type: ["string"],
            stringQualifiers: {
              length: 10,
              allowedLength: "Variable",
            },
          },
          passwordMode: true,
          format: { items: { ru: "ЧЦ=" } },
          editFormat: { items: { ru: "ЧГ=" } },
          toolTip: { items: { ru: "Подсказка" } },
          markNegatives: true,
          mask: "Маска",
          multiLine: true,
          extendedEdit: true,
          minValue: 8,
          maxValue: 12,
          fillFromFillingValue: true,
          fillValue: { type: "string", value: "Строка" },
          fillChecking: "ShowError",
          choiceParameterLinks: [
            {
              name: "Отбор.Ссылка",
              dataPath: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитВсеСвойства",
              valueChange: "Clear",
            },
          ],
          choiceParameters: [
            {
              name: "Отбор.ЭтоГруппа",
              value: { type: "ref", value: "Catalog.ПараметрыВыбора.EmptyRef" },
            },
          ],
          quickChoice: "Use",
          createOnInput: "DontUse",
          choiceForm: "Catalog.СправочникПолный.Form.ФормаВыбора",
          linkByType: {
            dataPath: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитБулево",
            linkItem: 0,
          },
          choiceHistoryOnInput: "DontUse",
        },
      ],
    },
  ],
  commands: [
    {
      itemType: "MetadataCommand",
      name: "Команда1",
      group: "FormNavigationPanelGoTo",
    },
  ],
}

export const fullYAML: MetadataDataProcessorYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ОсновнаяФорма: "Форма",
  РасширенноеПредставление: "Расширенное представление",
  Пояснение: "Пояснение\n",
  Реквизиты: {
    РеквизитВсеСвойства: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Тип: "Справочник.СправочникПолный",
      РежимПароля: "Истина",
      Формат: "ЧЦ=15; ЧДЦ=2",
      ФорматРедактирования: "ЧЦ=15; ЧДЦ=2",
      Подсказка: "Подсказка",
      ВыделятьОтрицательные: "Истина",
      Маска: "Маска",
      МногострочныйРежим: "Истина",
      РасширенноеРедактирование: "Истина",
      МинимальноеЗначение: 4,
      МаксимальноеЗначение: 96,
      ПроверкаЗаполнения: "ВыдаватьОшибку",
      СвязиПараметровВыбора: [
        {
          Имя: "Отбор.ЭтоГруппа",
          ПутьКДанным: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитБулево",
        },
      ],
      ПараметрыВыбора: {
        "Отбор.Наименование": "Ложь",
      },
      СозданиеПриВводе: "НеИспользовать",
      ФормаВыбора: "Catalog.СправочникПолный.Form.ФормаВыбора",
      СвязьПоТипу: "Обработка.ОбработкаВсеСвойства.Реквизит.РеквизитБулево(1)",
      ИсторияВыбораПриВводе: "НеИспользовать",
    },
    РеквизитБулево: { Тип: "Булево" },
  },
  ТабличныеЧасти: {
    ТабличнаяЧастьВсеСвойства: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Подсказка: "Подсказка",
      ПроверкаЗаполнения: "ВыдаватьОшибку",
      СтандартныеРеквизиты: {
        НомерСтроки: {
          Синоним: "Синоним номер строки",
        },
      },
      Реквизиты: {
        РеквизитТаблицыВсеСвойства: {
          Синоним: "Синоним",
          Комментарий: "Комментарий",
          Тип: "Строка(10)",
          РежимПароля: "Истина",
          Формат: "ЧЦ=",
          ФорматРедактирования: "ЧГ=",
          Подсказка: "Подсказка",
          ВыделятьОтрицательные: "Истина",
          Маска: "Маска",
          МногострочныйРежим: "Истина",
          РасширенноеРедактирование: "Истина",
          МинимальноеЗначение: 8,
          МаксимальноеЗначение: 12,
          ПроверкаЗаполнения: "ВыдаватьОшибку",
          СвязиПараметровВыбора: [
            {
              Имя: "Отбор.Ссылка",
              ПутьКДанным: "DataProcessor.ОбработкаВсеСвойства.Attribute.РеквизитВсеСвойства",
            },
          ],
          ПараметрыВыбора: {
            "Отбор.ЭтоГруппа": "Справочник.ПараметрыВыбора.ПустаяСсылка",
          },
          БыстрыйВыбор: "Использовать",
          СозданиеПриВводе: "НеИспользовать",
          ФормаВыбора: "Catalog.СправочникПолный.Form.ФормаВыбора",
          СвязьПоТипу: "Обработка.ОбработкаВсеСвойства.Реквизит.РеквизитБулево",
          ИсторияВыбораПриВводе: "НеИспользовать",
          ЗаполнятьИзДанныхЗаполнения: "Истина",
          ЗначениеЗаполнения: "\"Строка\"",
        },
      },
    },
  },
  Команды: {
    Команда1: { Группа: "ПанельНавигацииФормыПерейти" },
  },
}
