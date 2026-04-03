import type {
  ConditionalAppearance,
  ConditionalAppearanceYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import type { Filter, FilterYAML } from "~/metadata/commonObjects/dataCompositionSystem/filter/types"
import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"

const queryText = "ВЫБРАТЬ\nСправочник1.Реквизит1 КАК Реквизит1\nИЗ\nСправочник.Справочник1 КАК Справочник1"

export const customQueryDynamicListFromXML = {} as unknown as DynamicList

export const fullDynamicListFromXML = {
  itemType: "DynamicList",
  autoFillAvailableFields: false,
  autoSaveUserSettings: false,
  calculatedFields: {
    itemType: "CalculatedField",
    dataPath: "Поле1",
    expression: "Истина",
    title: { items: { ru: "Поле1" } },
    useRestriction: {
      itemType: "CalculatedFieldUseRestriction",
      field: true,
      group: true,
    },
    presentationExpression: "Наименование",
    orderExpressions: [
      {
        itemType: "CalculatedFieldOrderExpression",
        expression: "Наименование",
        orderType: "Asc",
        autoOrder: true,
      },
      {
        itemType: "CalculatedFieldOrderExpression",
        expression: "Ссылка",
        orderType: "Desc",
        autoOrder: false,
      },
    ],
    valueType: { type: ["string"] },
  },
  conditionalAppearance: [
    {
      itemType: "ConditionalAppearanceItem",
      fields: ["Наименование", "ПометкаУдаления"],
      filter: {
        itemType: "Filter",
        items: [
          {
            itemType: "FilterItemComparison",
            leftValue: { type: "Field", value: "Наименование" },
            comparisonType: "Contains",
            rightValue: { type: "string", value: "Текст" },
          },
        ],
      },
      appearance: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          value: { type: "string", value: "6678" },
        },
      },
    },
  ],
  filter: {
    itemType: "Filter",
    items: [
      {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "Поле1" },
        comparisonType: "Contains",
        presentation: { type: "string", value: "Русское" },
        rightValue: { type: "string", value: "Правое значение" },
        userSettingID: true,
        userSettingPresentation: { type: "string", value: "Пользовательское представление" },
        viewMode: "Normal",
      },
    ],
    userSettingID: true,
    userSettingPresentation: { items: { ru: "Представление отбора" } },
  },
  getInvisibleFieldPresentations: false,
  group: {
    itemType: "StructureItemGroup",
    groupItems: [
      {
        itemType: "GroupItemField",
        field: "Наименование",
      },
    ],
  },
  mainTable: "Catalog.Справочник1",
} as unknown as DynamicList

const filterForExport = {
  itemType: "Filter",
  items: [
    {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Поле1" },
      comparisonType: "Contains",
      presentation: { items: { ru: "Русское" } },
      rightValue: { type: "string", value: "Правое значение" },
      userSettingID: "5ddf70ce-9583-4b18-9219-d9b0366bb7a7",
      userSettingPresentation: { items: { ru: "Пользовательское представление" } },
      viewMode: "Normal",
    },
  ],
  userSettingID: "72519cf3-0e66-4ad8-9758-aba06d2bb00c",
  userSettingPresentation: { items: { ru: "Представление отбора" } },
} satisfies Filter

const conditionalAppearanceForExport = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: ["Наименование", "ПометкаУдаления"],
    filter: {
      itemType: "Filter",
      items: [
        {
          itemType: "FilterItemComparison",
          leftValue: { type: "Field", value: "Наименование" },
          comparisonType: "Contains",
          rightValue: { type: "string", value: "Текст" },
        },
      ],
    },
    appearance: {
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: { items: { ru: "6678" } },
      },
    },
  },
] satisfies ConditionalAppearance

const calculatedFieldYAML = {
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
} as const

const filterYAML = {
  Элементы: [
    {
      ЛевоеЗначение: ".Поле1",
      ВидСравнения: "Содержит",
      ПравоеЗначение: "'Правое значение'",
      Представление: "Русское",
      ПредставлениеПользовательскойНастройки: "Пользовательское представление",
      РежимОтображения: "Обычный",
      ИспользоватьПользовательскуюНастройку: "5ddf70ce-9583-4b18-9219-d9b0366bb7a7",
    },
  ],
  ИспользоватьПользовательскуюНастройку: "72519cf3-0e66-4ad8-9758-aba06d2bb00c",
  ПредставлениеПользовательскойНастройки: "Представление отбора",
} as const satisfies FilterYAML

const conditionalAppearanceYAML = [
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
] as const satisfies ConditionalAppearanceYAML

/** Полная модель для YAML/XML экспорта (согласована с full.xml и round-trip YAML). */
export const fullDynamicList = {
  itemType: "DynamicList",
  autoFillAvailableFields: false,
  autoSaveUserSettings: false,
  calculatedFields: fullDynamicListFromXML.calculatedFields,
  customQuery: true,
  dynamicDataRead: false,
  getInvisibleFieldPresentations: false,
  queryText,
  mainTable: "Catalog.Справочник1",
  filter: filterForExport,
  conditionalAppearance: conditionalAppearanceForExport,
  group: fullDynamicListFromXML.group,
} as unknown as DynamicList

export const fullDynamicListYAML = {
  АвтоЗаполнениеДоступныхПолей: "Ложь",
  АвтоматическоеСохранениеПользовательскихНастроек: "Ложь",
  ВычисляемыеПоля: calculatedFieldYAML,
  ДинамическоеСчитываниеДанных: "Ложь",
  ОсновнаяТаблица: "Catalog.Справочник1",
  Отбор: filterYAML,
  ПолучениеПредставленийДляНевидимыхПолей: "Ложь",
  ПроизвольныйЗапрос: "Истина",
  ТекстЗапроса: queryText,
  УсловноеОформление: conditionalAppearanceYAML,
  Группировка: ["Наименование"],
} as unknown as DynamicListYAML

export const minimalDynamicList = {
  itemType: "DynamicList",
  customQuery: false,
  dynamicDataRead: true,
  filter: {
    itemType: "Filter",
    viewMode: "Normal",
    userSettingID: "dfcece9d-5077-440b-b6b3-45a5cb4538eb",
  } satisfies Filter,
} as unknown as DynamicList

// export const customQueryDynamicList = {
//   АвтоЗаполнениеДоступныхПолей: "Истина",
//   АвтоматическоеСохранениеПользовательскихНастроек: "Истина",
//   ДинамическоеСчитываниеДанных: "Истина",
//   ОсновнаяТаблица: "Catalog.Справочник1",
//   Отбор: filterYAML,
//   ПолучениеПредставленийДляНевидимыхПолей: "Истина",
//   ПроизвольныйЗапрос: "Ложь",
//   ТекстЗапроса: queryText,
//   УсловноеОформление: conditionalAppearanceYAML,
//   Группировка: ["Наименование"],
// } as unknown as DynamicListYAML
