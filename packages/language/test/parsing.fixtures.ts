import { ChildItem } from "../src"

export interface ParsingFixture {
  name: string
  input: string
  expected: ChildItem
}

export const parsingFixtures: ParsingFixture[] = [
  // #region Attributes
  {
    name: "form attribute",
    input: `РеквизитОбъекта:`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: ["РеквизитОбъекта"],
      $container: undefined,
    },
  },
  {
    name: "main attribute",
    input: `.РеквизитОбъекта:`,
    expected: {
      $type: "InputField",
      isMainAttribute: true,
      dataPath: ["РеквизитОбъекта"],
      $container: undefined,
    },
  },
  {
    name: "form attribute with dots",
    input: `.Объект.Реквизит:`,
    expected: {
      $type: "InputField",
      isMainAttribute: true,
      dataPath: ["Объект", "Реквизит"],
      $container: undefined,
    },
  },
  {
    name: "form attribute different from data path",
    input: `ИмяЭлементаФормы(Объект.Реквизит):`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: ["Объект", "Реквизит"],
      elementName: "ИмяЭлементаФормы",
      $container: undefined,
    },
  },
  {
    name: "main attribute different from data path",
    input: `.ИмяЭлементаФормы(Объект.Реквизит):`,
    expected: {
      $type: "InputField",
      isMainAttribute: true,
      dataPath: ["Объект", "Реквизит"],
      elementName: "ИмяЭлементаФормы",
      $container: undefined,
    },
  },
  {
    name: "form attribute with empty data path",
    input: `Родитель():`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: [],
      elementName: "Родитель",
      $container: undefined,
    },
  },
  {
    name: "form attribute with array element path",
    input: `Фамилия(Массив[0].Поле):`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: ["Массив[0]", "Поле"],
      elementName: "Фамилия",
      $container: undefined,
    },
  },
  {
    name: "form attribute with raw platform data path",
    input: `ВидЗанятости(1/0:a917a122-f663-4c45-8de0-fd5104007de3):`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: [],
      rawDataPath: "1/0:a917a122-f663-4c45-8de0-fd5104007de3",
      elementName: "ВидЗанятости",
      $container: undefined,
    },
  },
  // #endregion
  // #region LabelDecoration
  {
    name: "label decoration",
    input: `РеквизитФормы`,
    expected: {
      $type: "LabelDecoration",
      isMainAttribute: false,
      elementName: "РеквизитФормы",
      $container: undefined,
    },
  },
  {
    name: "label decoration with title",
    input: `"Заголовок" РеквизитФормы`,
    expected: {
      $type: "LabelDecoration",
      title: '"Заголовок"',
      isMainAttribute: false,
      elementName: "РеквизитФормы",
      $container: undefined,
    },
  },
  {
    name: "label decoration main attribute",
    input: `.РеквизитОбъекта`,
    expected: {
      $type: "LabelDecoration",
      isMainAttribute: true,
      elementName: "РеквизитОбъекта",
      $container: undefined,
    },
  },
  // #endregion

  // #region InputField
  {
    name: "input field",
    input: `Реквизит:`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  {
    name: "input field with title",
    input: `"Подпись": Реквизит`,
    expected: {
      $type: "InputField",
      title: '"Подпись"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  {
    name: "input field with data path",
    input: `.Реквизит.Формы:`,
    expected: {
      $type: "InputField",
      isMainAttribute: true,
      dataPath: ["Реквизит", "Формы"],
      $container: undefined,
    },
  },
  // #endregion

  // #region LabelField
  {
    name: "label field",
    input: `~Надпись:`,
    expected: {
      $type: "LabelField",
      isMainAttribute: false,
      dataPath: ["Надпись"],
      $container: undefined,
    },
  },
  {
    name: "label field with title",
    input: `~"Текст": Реквизит`,
    expected: {
      $type: "LabelField",
      title: '"Текст"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region PictureField
  {
    name: "picture field",
    input: `!Картинка:`,
    expected: {
      $type: "PictureField",
      isMainAttribute: false,
      dataPath: ["Картинка"],
      $container: undefined,
    },
  },
  {
    name: "picture field with title",
    input: `!"Изображение": Реквизит`,
    expected: {
      $type: "PictureField",
      title: '"Изображение"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region PictureDecoration
  {
    name: "picture decoration",
    input: `!Декорация`,
    expected: {
      $type: "PictureDecoration",
      isMainAttribute: false,
      elementName: "Декорация",
      $container: undefined,
    },
  },
  {
    name: "picture decoration with picture",
    input: `![Иконка] Имя`,
    expected: {
      $type: "PictureDecoration",
      picture: "[Иконка]",
      isMainAttribute: false,
      elementName: "Имя",
      $container: undefined,
    },
  },
  {
    name: "picture decoration with image file link",
    input: `![Picture.svg] ДекорацияЯндекс`,
    expected: {
      $type: "PictureDecoration",
      picture: "[Picture.svg]",
      isMainAttribute: false,
      elementName: "ДекорацияЯндекс",
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxField
  {
    name: "checkbox field",
    input: `Флаг[]`,
    expected: {
      $type: "CheckBoxField",
      isMainAttribute: false,
      dataPath: ["Флаг"],
      $container: undefined,
    },
  },
  {
    name: "checkbox field with title",
    input: `"Включить" [] Реквизит`,
    expected: {
      $type: "CheckBoxField",
      title: '"Включить"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxFieldRightTitled
  {
    name: "checkbox right titled",
    input: `[] "Подпись" Флаг`,
    expected: {
      $type: "CheckBoxFieldRightTitled",
      title: '"Подпись"',
      isMainAttribute: false,
      dataPath: ["Флаг"],
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxFieldSwitch
  {
    name: "checkbox switch",
    input: `Переключатель[|]`,
    expected: {
      $type: "CheckBoxFieldSwitch",
      isMainAttribute: false,
      dataPath: ["Переключатель"],
      $container: undefined,
    },
  },
  {
    name: "checkbox switch with title",
    input: `"Режим" [|] Реквизит`,
    expected: {
      $type: "CheckBoxFieldSwitch",
      title: '"Режим"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxFieldSwitchRightTitled
  {
    name: "checkbox switch right titled",
    input: `[|] "Подпись" Реквизит`,
    expected: {
      $type: "CheckBoxFieldSwitchRightTitled",
      title: '"Подпись"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxFieldTumbler
  {
    name: "checkbox tumbler",
    input: `Реквизит<|>`,
    expected: {
      $type: "CheckBoxFieldTumbler",
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  {
    name: "checkbox tumbler with title",
    input: `"Опция" <|> Реквизит`,
    expected: {
      $type: "CheckBoxFieldTumbler",
      title: '"Опция"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region CheckBoxFieldTumblerRightTitled
  {
    name: "checkbox tumbler right titled",
    input: `<|> "Подпись" Реквизит`,
    expected: {
      $type: "CheckBoxFieldTumblerRightTitled",
      title: '"Подпись"',
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region Button
  {
    name: "button",
    input: `<Действие>`,
    expected: {
      $type: "Button",
      isMainAttribute: false,
      elementName: "Действие",
      hyperlink: false,
      $container: undefined,
    },
  },
  {
    name: "button with title",
    input: `<"Сохранить" Команда>`,
    expected: {
      $type: "Button",
      title: '"Сохранить"',
      isMainAttribute: false,
      elementName: "Команда",
      hyperlink: false,
      $container: undefined,
    },
  },
  {
    name: "hyperlink button with title",
    input: `<~"Сохранить" Команда>`,
    expected: {
      $type: "Button",
      title: '"Сохранить"',
      isMainAttribute: false,
      elementName: "Команда",
      hyperlink: true,
      $container: undefined,
    },
  },
  {
    name: "hyperlink button without title",
    input: `<~Действие>`,
    expected: {
      $type: "Button",
      isMainAttribute: false,
      elementName: "Действие",
      hyperlink: true,
      $container: undefined,
    },
  },
  // #endregion

  // #region CommandBar
  {
    name: "command bar empty",
    input: `<> Панель`,
    expected: {
      $type: "CommandBar",
      isMainAttribute: false,
      elementName: "Панель",
      childItems: [],
      $container: undefined,
    },
  },
  {
    name: "command bar with button",
    input: `<"Кнопка" Команда> Панель`,
    expected: {
      $type: "CommandBar",
      isMainAttribute: false,
      elementName: "Панель",
      $container: undefined,
      childItems: [
        {
          $type: "CommandBarButton",
          title: '"Кнопка"',
          isMainAttribute: false,
          elementName: "Команда",
          hyperlink: false,
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "command bar with hyperlink button",
    input: `<~"Ссылка" Команда> Панель`,
    expected: {
      $type: "CommandBar",
      isMainAttribute: false,
      elementName: "Панель",
      $container: undefined,
      childItems: [
        {
          $type: "CommandBarButton",
          title: '"Ссылка"',
          isMainAttribute: false,
          elementName: "Команда",
          hyperlink: true,
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "command bar with group",
    input: `<- "Группа" ИмяГруппы> Панель`,
    expected: {
      $type: "CommandBar",
      isMainAttribute: false,
      elementName: "Панель",
      $container: undefined,
      childItems: [
        {
          $type: "CommandGroup",
          title: '"Группа"',
          isMainAttribute: false,
          elementName: "ИмяГруппы",
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "command bar with popup",
    input: `<+ "Выпадающий" Меню> Панель`,
    expected: {
      $type: "CommandBar",
      isMainAttribute: false,
      elementName: "Панель",
      $container: undefined,
      childItems: [
        {
          $type: "Popup",
          title: '"Выпадающий"',
          isMainAttribute: false,
          elementName: "Меню",
          $container: undefined,
        },
      ],
    },
  },
  // #endregion

  // #region AutoCommandBar (form with auto bar + first child)
  {
    name: "form with auto command bar and child",
    input: `<<>>
Реквизит:`,
    expected: {
      $type: "InputField",
      isMainAttribute: false,
      dataPath: ["Реквизит"],
      $container: undefined,
    },
  },
  // #endregion

  // #region Group
  {
    name: "group one-line horizontal",
    input: `-Группа Поле:`,
    expected: {
      $type: "Group",
      group: "-",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Поле"],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group one-line with title",
    input: `- "ПодписьГруппы" Группа Реквизит:`,
    expected: {
      $type: "Group",
      group: "-",
      title: '"ПодписьГруппы"',
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Реквизит"],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group one-line several fields",
    input: `- Группа А: ; ~Надпись: ; <Действие>`,
    expected: {
      $type: "Group",
      group: "-",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["А"],
          $container: undefined,
        },
        {
          $type: "LabelField",
          isMainAttribute: false,
          dataPath: ["Надпись"],
          $container: undefined,
        },
        {
          $type: "Button",
          isMainAttribute: false,
          elementName: "Действие",
          hyperlink: false,
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "vertical group with search string addition",
    input: `+Группа
  ?ОтображениеСтрокиПоиска СтрокаПоиска`,
    expected: {
      $type: "Group",
      group: "+",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "CommandAdditionField",
          type: "?ОтображениеСтрокиПоиска",
          isMainAttribute: false,
          elementName: "СтрокаПоиска",
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "one-line group with search control addition",
    input: `=Группа ?УправлениеПоиском УправлениеПоиском`,
    expected: {
      $type: "Group",
      group: "=",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "CommandAdditionField",
          type: "?УправлениеПоиском",
          isMainAttribute: false,
          elementName: "УправлениеПоиском",
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group vertical without children",
    input: `+ГруппаДополнительныеРеквизиты`,
    expected: {
      $type: "Group",
      group: "+",
      isMainAttribute: false,
      elementName: "ГруппаДополнительныеРеквизиты",
      $container: undefined,
      childItems: [],
    },
  },
  {
    name: "group with indented block",
    input: `+Вертикальная
  Поле:
  Декорация`,
    expected: {
      $type: "Group",
      group: "+",
      isMainAttribute: false,
      elementName: "Вертикальная",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Поле"],
          $container: undefined,
        },
        {
          $type: "LabelDecoration",
          isMainAttribute: false,
          elementName: "Декорация",
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "collapsible group with nested group",
    input: `+"Дополнительные реквизиты" СворачиваемаяГруппаДополнительныеРеквизиты
  +ГруппаДополнительныеРеквизиты`,
    expected: {
      $type: "Group",
      group: "+",
      title: '"Дополнительные реквизиты"',
      isMainAttribute: false,
      elementName: "СворачиваемаяГруппаДополнительныеРеквизиты",
      $container: undefined,
      childItems: [
        {
          $type: "Group",
          group: "+",
          isMainAttribute: false,
          elementName: "ГруппаДополнительныеРеквизиты",
          childItems: [],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group with picture field in block",
    input: `-Группа
  ?ПолеРисунка ИмяПоля`,
    expected: {
      $type: "Group",
      group: "-",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "OtherField",
          type: "?ПолеРисунка",
          isMainAttribute: false,
          elementName: "ИмяПоля",
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group horizontal with indented block",
    input: `- Блок
  Реквизит:`,
    expected: {
      $type: "Group",
      group: "-",
      isMainAttribute: false,
      elementName: "Блок",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Реквизит"],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group one-line absolute",
    input: `= Группа Реквизит:`,
    expected: {
      $type: "Group",
      group: "=",
      isMainAttribute: false,
      elementName: "Группа",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Реквизит"],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "group one-line absolute with input and checkbox",
    input: `=ГруппаСлужебныеДанные Идентификатор(Объект.Идентификатор): ; [ ] ТребуетсяЗагрузка`,
    expected: {
      $type: "Group",
      group: "=",
      isMainAttribute: false,
      elementName: "ГруппаСлужебныеДанные",
      $container: undefined,
      childItems: [
        {
          $type: "InputField",
          isMainAttribute: false,
          dataPath: ["Объект", "Идентификатор"],
          elementName: "Идентификатор",
          $container: undefined,
        },
        {
          $type: "CheckBoxFieldRightTitled",
          isMainAttribute: false,
          dataPath: ["ТребуетсяЗагрузка"],
          $container: undefined,
        },
      ],
    },
  },
  // #endregion

  // #region Table
  {
    name: "table empty",
    input: `|| ТабличныйДокумент`,
    expected: {
      $type: "Table",
      isMainAttribute: false,
      dataPath: ["ТабличныйДокумент"],
      childItems: [],
      $container: undefined,
    },
  },
  {
    name: "table without columns",
    input: `| РезультирующаяТаблица`,
    expected: {
      $type: "Table",
      isMainAttribute: false,
      dataPath: ["РезультирующаяТаблица"],
      childItems: [],
      $container: undefined,
    },
  },
  {
    name: "table with input field",
    input: `| "Подпись" Реквизит | ТабличныйДокумент`,
    expected: {
      $type: "Table",
      isMainAttribute: false,
      dataPath: ["ТабличныйДокумент"],
      $container: undefined,
      childItems: [
        {
          $type: "TableInputField",
          title: '"Подпись"',
          isMainAttribute: false,
          dataPath: ["Реквизит"],
          $container: undefined,
        },
      ],
    },
  },
  {
    name: "table with horizontal group",
    input: `|-"Группа" Имя | Документ`,
    expected: {
      $type: "Table",
      isMainAttribute: false,
      dataPath: ["Документ"],
      $container: undefined,
      childItems: [
        {
          $type: "TableHorizontalGroup",
          title: '"Группа"',
          isMainAttribute: false,
          elementName: "Имя",
          $container: undefined,
        },
      ],
    },
  },
  // #endregion

  // #region Pages
  {
    name: "pages empty",
    input: `// Страницы`,
    expected: {
      $type: "Pages",
      isMainAttribute: false,
      elementName: "Страницы",
      childItems: [],
      $container: undefined,
    },
  },
  {
    name: "pages",
    // отступы (пробелы) при использовании парсера заменяются на INDENT/DEDENT (*Ё / *ё)
    input: `// Страницы
  / Страница
    Декорация`,
    expected: {
      $type: "Pages",
      isMainAttribute: false,
      elementName: "Страницы",
      $container: undefined,
      childItems: [
        {
          $type: "Page",
          isMainAttribute: false,
          elementName: "Страница",
          $container: undefined,
          childItems: [
            {
              $type: "LabelDecoration",
              isMainAttribute: false,
              elementName: "Декорация",
              $container: undefined,
            },
          ],
        },
      ],
    },
  },
  {
    name: "page with title",
    input: `// Страницы
  /"Дополнительно" ГруппаДополнительныеРеквизиты`,
    expected: {
      $type: "Pages",
      isMainAttribute: false,
      elementName: "Страницы",
      $container: undefined,
      childItems: [
        {
          $type: "Page",
          title: '"Дополнительно"',
          isMainAttribute: false,
          elementName: "ГруппаДополнительныеРеквизиты",
          childItems: [],
          $container: undefined,
        },
      ],
    },
  },
  // #endregion

  // #region OtherField
  {
    name: "other field calendar",
    input: `?ПолеКалендаря ГрафикРаботы`,
    expected: {
      $type: "OtherField",
      type: "?ПолеКалендаря",
      isMainAttribute: false,
      elementName: "ГрафикРаботы",
      $container: undefined,
    },
  },
  {
    name: "other field chart",
    input: `?ПолеДиаграммы ДиаграммаАнализ`,
    expected: {
      $type: "OtherField",
      type: "?ПолеДиаграммы",
      isMainAttribute: false,
      elementName: "ДиаграммаАнализ",
      $container: undefined,
    },
  },
  {
    name: "other field",
    input: `?ПолеПериода Реквизит`,
    expected: {
      $type: "OtherField",
      type: "?ПолеПериода",
      isMainAttribute: false,
      elementName: "Реквизит",
      $container: undefined,
    },
  },
  // #endregion
]
