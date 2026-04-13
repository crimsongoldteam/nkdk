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
    itemType: "DataParameters",
    parameters: [
      {
        parameter: "Параметр1",
        value: "ПараметрыДанных.Параметр1",
      },
    ],
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
        orderType: "Asc",
      },
    ],
    userSettingPresentation: {
      items: {
        ru: "Представление порядка",
      },
    },
  },
} as const as DynamicList

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
  ДинамическоеСчитываниеДанных: "Ложь",
  ОсновнаяТаблица: "Catalog.Справочник1",
  Отбор: {
    Элементы: [
      {
        ЛевоеЗначение: ".Поле1",
        ВидСравнения: "Содержит",
        ПравоеЗначение: "'Правое значение'",
        Представление: "Русское",
        ПредставлениеПользовательскойНастройки: "Пользовательское представление",
        РежимОтображения: "Обычный",
        ИспользоватьПользовательскуюНастройку: "Истина",
      },
    ],
    ИспользоватьПользовательскуюНастройку: "Истина",
    ПредставлениеПользовательскойНастройки: "Представление отбора",
  },
  ПолучениеПредставленийДляНевидимыхПолей: "Ложь",
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
          Текст: "6678",
        },
      },
    ],
  },
  Группировка: ["Наименование"],
} as const satisfies DynamicListYAML

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
