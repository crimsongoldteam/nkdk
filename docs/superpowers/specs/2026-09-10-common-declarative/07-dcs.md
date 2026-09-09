# DataCompositionSystem: вложенные common

Каталог `dataCompositionSystem` содержит 132 исходных TS-файла без тестов/фикстур. Он учитывается как один верхний каталог, но ниже перечислены все вложенные части с исходниками. Разные реестры DcsMetadataValue и DcsMetadataTypedValue не следует сливать только по похожему имени: у них различаются варианты и YAML-синтаксис.

| Подкаталог | Договор и требуемое выражение | Что обязательно проверить |
|---|---|---|
| `appearanceFields` | Именованный набор SettingsParameterValue, поле выбирает собственную схему. Строковые варианты: plain, Field, multilingual, formatted, null, отсутствие, служебные поля. Record, keyed dispatch и union. | Одно строковое значение, Тип/Значение, неизвестные ключи, nil/auto color, служебные поля; normalizeStringParameter разложить на декларативные варианты. |
| `availableFields` | Список поля-scalar либо record с use/title/lwsTitle/viewMode; сокращение только без дополнительных данных. | Потеря аннотации при переходе scalar/record, пустое вхождение, несколько локализованных заголовков. |
| `availableValues` | Коллекция value + presentation с DCS-значением и DcsLocalStringType. | Typed значение, !xml/string представление, отсутствие/пустой item. |
| `calculatedField` | Record dataPath, expression, title, availableValues, appearance, restrictions, presentation/order expressions, valueType. | XML-маршруты, вложенные collections и QName; выражение хранится текстом, не считать его вычисление задачей языка правил. |
| `calculatedFieldOrderExpression` | Коллекция expression/orderType/autoOrder; текущий ручной цикл передаёт адрес каждого элемента. | Индексы диагностик и аннотаций, пустой список, xmlOrder. |
| `calculatedFieldUseRestriction` | Record boolean-признаков field/condition/group/order. | Defaults и присутствие каждой ветви. |
| `calculatedFields` | Тип и оболочка коллекции CalculatedField. | Регистрация use, кардинальность, отсутствие. |
| `conditionalAppearance` | Record item collection, viewMode, userSettingID/presentation. | Пустое оформление и идентификатор пользовательской настройки. |
| `conditionalAppearanceItem` | Record selection/filter/appearance/presentation и контекстов использования в группах/итогах/заголовках. | Совместимость вложенных вариантов, explicit false, default true, адрес проверки. |
| `dataCompositionSchemaDataSetField` | Choice Field/Folder/NestedDataSet по kind, условная доступность свойств и общий record. | Явный kind против подразумеваемого; допустимость field/dataPath и вложенных параметров; unknown kind. |
| `dcsLocalStringType` | LocalStringType/I8nText либо xs:string, выбираемый существующим !xml/string. | Сохранение точного разрешения тега, основной/несколько языков, пустота. |
| `dcsMetadataValue` | Композиция DCS/common значений: Color, Field, Parameter, DesignTimeValue, Primitive, TypeLink, ChoiceParameterLinks, SystemEnumeration, Font. registry.ts в этой ревизии пуст; поведение находится в from/to-файлах. | Полная таблица XML type ↔ semantic variant ↔ YAML schema, ветви Field/DesignTimeValue/Primitive/Font и иные зарегистрированные типы. |
| `dcsParameter` | Имя, title, valueType/value, restriction/expression, flags, editParameters. | Тип и значение с зависимостями, доступность списка, использование, nested values. |
| `dscMetadataTypedValue` | Отдельный choice: Order, Field с точкой, DesignTimeValue/ref, number, boolean, date, quoted text, StandardBeginningDate, пустой ValueList; массив с {} как nil. | Приоритеты распознавания, кавычки как данные этого договора против YAML lexical style, запрет непустого ValueList в пустом варианте; реестр нельзя оставить набором функций. |
| `filter` | Record availableFields, recursive items и пользовательские настройки. | Различие пустого фильтра и отсутствия, nested groups, use. |
| `filterItem` | Comparison/Group, left/right typed values, comparisonType, presentation, application; короткие записи из inlineTypes/typedValues. | Разметка варианта, неразрешимый выбор строки/поля/ссылки, рекурсия, группа с children и родителем. |
| `filterItem/fields` | dcsBoolean/dcsField — специальные XML/YAML профили примитивов в фильтре. | Допустимая boolean-лексика и привязка Field; представить профилями общих конструкций, не отдельными преобразователями. |
| `order` | Record коллекции order items и пользовательских настроек. | Порядок и явные настройки. |
| `orderItemFields` | Field/Auto-подобные варианты упорядочивания; полная и краткая формы, use/orderType/viewMode. | Неоднозначные shorthand, порядок элементов, typed root. |
| `parameterValue` | Parameter + value(0/1/many) + use + рекурсивные items; settings добавляют presentation/viewMode/ID. Массив ChoiceParameterLinks является одним значением, а не списком значений. | Кардинальность на правильном уровне; scalar/map/marker формы, Font-ключи против имени параметра, auto color, nil и размещение dcscor:value перед settings. |
| `settingsParameterValueCollection` | Keyed parameter collection; per-key rule/defaultItemRule, иначе неизвестный параметр не проходит публичную схему. Пустая {} имеет отдельный экспорт. | Неизвестный параметр, default rule, повтор имени, explicit empty, вложенная XML-оболочка; молчаливый пропуск в старом parser не становится целевым правилом сохранения. |
| `structureItemGroup` | Поля группировки + вложенная структура, выбор полного/сокращённого представления. | Совместное владение XML dcsset:item и восстановление вложенности. |
| `structureItemGroup/collection` | Диспетчеризация GroupItemAuto/GroupItemField и обработка коротких форм. | Единый порядок, корректный variant и обратимость сокращения. |
| `structureItemGroup/items/groupItemAuto` | Auto-элемент с use и коротким YAML-detect. | Auto/disabled/полная форма, перенос аннотаций. |
| `structureItemGroup/items/groupItemField` | Поле, groupType, periodAdditionType, границы периода и use. | Краткий/полный вид, даты, defaults и период. |
| `.` | index.ts объединяет экспорты перечисленных частей. | Это composition, не самостоятельный тип значения. |

## Выводы из DCS

1. Нужен конечный выбор схемы по ключу параметра и по дискриминатору; нельзя получить его автоматически из «любого JSON».
2. Collection<T> и T, которое само является collection, различаются по объявленному типу. Проверка Array.isArray не является договором.
3. Явный порядок выбора вариантов допустим только как часть декларации; компилятор обнаруживает коллизии известных областей. Для неразрешимых статически пересечений требуется явная политика и проверочный пример, а не молчаливый first-match.
4. Короткие формы описываются как представление конкретного полного значения, чтобы обе стороны использовали один договор. Отдельные normalize/detect функции common исключаются.
5. Текущие DCS-проекции требуют подробного развёрнутого примера ParameterValue перед замораживанием грамматики. Список нужных конструкций не доказывает, что этот пример уже написан.
