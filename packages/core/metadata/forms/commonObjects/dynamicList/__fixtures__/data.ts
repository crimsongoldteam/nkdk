import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"

export const queryText = "ВЫБРАТЬ\nСправочник1.Реквизит1 КАК Реквизит1\nИЗ\nСправочник.Справочник1 КАК Справочник1"

export const fullDynamicList = {
  autoFillAvailableFields: false,
  autoSaveUserSettings: false,
  calculatedFields: {
    dataPath: "Поле1",
    expression: "Истина",
    itemType: "CalculatedField",
    orderExpressions: [
      {
        autoOrder: true,
        expression: "Наименование",
        itemType: "CalculatedFieldOrderExpression",
        orderType: "Asc",
      },
      {
        autoOrder: false,
        expression: "Ссылка",
        itemType: "CalculatedFieldOrderExpression",
        orderType: "Desc",
      },
    ],
    presentationExpression: "Наименование",
    title: {
      items: {
        ru: "Поле1",
      },
    },
    useRestriction: {
      field: true,
      group: true,
      itemType: "CalculatedFieldUseRestriction",
    },
    valueType: {
      type: ["string"],
    },
  },
  conditionalAppearance: {
    itemType: "ConditionalAppearance",
    userSettingID: true,
    userSettingPresentation: {
      items: {
        ru: "Представление условного оформления",
      },
    },
    viewMode: "QuickAccess",
    conditionalAppearanceItems: [
      {
        appearance: {
          itemType: "AppearanceFields",
          Текст: {
            parameter: "Текст",
            value: { type: "string", value: "Текстовый параметр" },
          },
        },
        fields: ["Наименование", "ПометкаУдаления"],
        filter: {
          itemType: "Filter",
          items: [
            {
              comparisonType: "Contains",
              itemType: "FilterItemComparison",
              leftValue: {
                type: "Field",
                value: "Наименование",
              },
              rightValue: {
                type: "string",
                value: "Текст",
              },
            },
          ],
        },
        itemType: "ConditionalAppearanceItem",
      },
    ],
  },
  customQuery: false,
  dataParameters: {
    itemType: "SettingsParameterValueCollection",
    parameters: {
      Параметр1: {
        parameter: "Параметр1",
        value: "ПараметрыДанных.Параметр1",
      },
    },
  },
  dynamicDataRead: false,
  filter: {
    itemType: "Filter",
    items: [
      {
        comparisonType: "Contains",
        itemType: "FilterItemComparison",
        leftValue: {
          type: "Field",
          value: "Поле1",
        },
        presentation: {
          items: {
            ru: "Русское",
          },
        },
        rightValue: {
          type: "string",
          value: "Правое значение",
        },
        userSettingID: true,
        userSettingPresentation: {
          items: {
            ru: "Пользовательское представление",
          },
        },
        viewMode: "Normal",
      },
    ],
    userSettingID: true,
    userSettingPresentation: {
      items: {
        ru: "Представление отбора",
      },
    },
  },
  getInvisibleFieldPresentations: false,
  group: {
    groupItems: [
      {
        field: "Наименование",
        itemType: "GroupItemField",
      },
    ],
    itemType: "StructureItemGroup",
  },
  itemType: "DynamicList",
  itemsUserSettingID: true,
  itemsUserSettingPresentation: {
    items: {
      ru: "Представление группировки",
    },
  },
  mainTable: "Catalog.Справочник1",
  order: {
    itemType: "Order",
    items: [
      {
        itemType: "OrderItemField",
        field: "Наименование",
      },
    ],
    userSettingPresentation: {
      items: {
        ru: "Представление порядка",
      },
    },
  },
  parameters: [
    {
      editParameters: {
        itemType: "SettingsParameterValueCollection",
        parameters: {
          Маска: {
            parameter: "Маска",
            value: { type: "string", value: "123" },
          },
          СвязиПараметровВыбора: {
            parameter: "СвязиПараметровВыбора",
            value: [
              {
                dataPath: "Поле1",
                name: "ПараметрВыбора",
                valueChange: "DontChange",
              },
            ],
          },
          ПараметрыВыбора: {
            parameter: "ПараметрыВыбора",
            value: {
              name: "Параметр",
              value: { type: "decimal", value: 123 },
            },
          },
          СвязьПоТипу: {
            parameter: "СвязьПоТипу",
            value: {
              dataPath: "Поле1",
              linkItem: 2,
            },
          },
          ФормаВыбора: {
            parameter: "ФормаВыбора",
            value: { type: "string", value: "ФормаВыбора" },
          },
          ФорматРедактирования: {
            parameter: "ФорматРедактирования",
            value: { type: "string", value: "ЧЦ=15; ЧДЦ=2" },
          },
          БыстрыйВыбор: {
            parameter: "БыстрыйВыбор",
            value: { type: "boolean", value: true },
          },
          ВыборГруппИЭлементов: {
            parameter: "ВыборГруппИЭлементов",
            value: "Items",
          },
        },
      },
      itemType: "DCSParameter",
      name: "Параметр1",
      title: {
        items: {
          ru: "Параметр1",
        },
      },
      use: "Always",
      useRestriction: true,
    },
  ],
} as const satisfies DynamicList

export const fullDynamicListYAML = {
  АвтоЗаполнениеДоступныхПолей: "Ложь",
  АвтоматическоеСохранениеПользовательскихНастроек: "Ложь",
  ВычисляемыеПоля: {
    ПутьКДанным: "Поле1",
    Выражение: "Истина",
    Заголовок: "Поле1",
    ОграничениеИспользования: {
      Поле: "Истина",
      Группировка: "Истина",
    },
    ВыражениеПредставления: "Наименование",
    ВыраженияУпорядочивания: [
      {
        Выражение: "Наименование",
        ТипУпорядочивания: "Возр",
        Автоупорядочивание: "Истина",
      },
      {
        Выражение: "Ссылка",
        ТипУпорядочивания: "Убыв",
        Автоупорядочивание: "Ложь",
      },
    ],
    ТипЗначения: "Строка",
  },
  УсловноеОформление: {
    Элементы: [
      {
        Поля: ["Наименование", "ПометкаУдаления"],
        Отбор: {
          Элементы: [
            {
              ЛевоеЗначение: ".Наименование",
              ВидСравнения: "Содержит",
              ПравоеЗначение: "'Текст'",
            },
          ],
        },
        Оформление: {
          Текст: '"Текстовый параметр"',
        },
      },
    ],
    РежимОтображения: "БыстрыйДоступ",
    ИспользоватьПользовательскуюНастройку: "Истина",
    ПредставлениеПользовательскойНастройки: { items: { ru: "Представление условного оформления" } },
  },
  ПроизвольныйЗапрос: "Ложь",
  ПараметрыДанных: {
    Параметр1: "ПараметрыДанных.Параметр1",
  },
  ДинамическоеСчитываниеДанных: "Ложь",
  Отбор: {
    Элементы: [
      {
        ЛевоеЗначение: ".Поле1",
        ВидСравнения: "Содержит",
        ПравоеЗначение: "'Правое значение'",
        Представление: { items: { ru: "Русское" } },
        РежимОтображения: "Обычный",
        ИспользоватьПользовательскуюНастройку: "Истина",
        ПредставлениеПользовательскойНастройки: { items: { ru: "Пользовательское представление" } },
      },
    ],
    ИспользоватьПользовательскуюНастройку: "Истина",
    ПредставлениеПользовательскойНастройки: { items: { ru: "Представление отбора" } },
  },
  ПолучениеПредставленийДляНевидимыхПолей: "Ложь",
  Группировка: ["Наименование"],
  ОсновнаяТаблица: "Catalog.Справочник1",
  Порядок: {
    Элементы: [{ Поле: "Наименование" }],
    ПредставлениеПользовательскойНастройки: { items: { ru: "Представление порядка" } },
  },
  Параметры: {
    Параметр1: {
      Заголовок: "Параметр1",
      Значение: null,
      ОграничениеИспользования: "Истина",
      ПараметрыРедактирования: {
        Маска: '"123"',
        СвязиПараметровВыбора: "ПараметрВыбора(Поле1, НеИзменять)",
        ПараметрыВыбора: { Параметр: 123 },
        СвязьПоТипу: "Поле1(2)",
        ФормаВыбора: '"ФормаВыбора"',
        ФорматРедактирования: '"ЧЦ=15; ЧДЦ=2"',
        БыстрыйВыбор: "Истина",
        ВыборГруппИЭлементов: "Элементы",
      },
      Использование: "Всегда",
    },
  },
  ИдентификаторПользовательскойНастройкиСтруктуры: "Истина",
  ПредставлениеПользовательскойНастройкиСтруктуры: { items: { ru: "Представление группировки" } },
} as unknown as DynamicListYAML

export const minimalDynamicList = {
  itemType: "DynamicList",
  customQuery: false,
  dynamicDataRead: true,
  filter: {
    itemType: "Filter",
    viewMode: "Normal",
    userSettingID: true,
  },
  order: {
    itemType: "Order",
    viewMode: "Normal",
    userSettingID: true,
  },
  conditionalAppearance: {
    itemType: "ConditionalAppearance",
    viewMode: "Normal",
    userSettingID: true,
  },
  itemsViewMode: "Normal",
  itemsUserSettingID: true,
} as const satisfies DynamicList

export const customQueryDynamicList = {
  АвтоЗаполнениеДоступныхПолей: "Истина",
  АвтоматическоеСохранениеПользовательскихНастроек: "Истина",
  ДинамическоеСчитываниеДанных: "Истина",
  ОсновнаяТаблица: "Catalog.Справочник1",
  Отбор: {
    Элементы: [
      {
        ЛевоеЗначение: ".Поле1",
        ВидСравнения: "Содержит",
        ПравоеЗначение: "'Правое значение'",
      },
    ],
  },
  ПолучениеПредставленийДляНевидимыхПолей: "Истина",
  ПроизвольныйЗапрос: "Ложь",
  ТекстЗапроса: queryText,
  // УсловноеОформление:  ,
  Группировка: ["Наименование"],
} as unknown as DynamicListYAML
