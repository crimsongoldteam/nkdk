# Неявные значения AutoInsertNewRow и растяжения элементов формы

## Цель

Исправить XML → YAML → XML для `Table.AutoInsertNewRow` без определения вида
источника по `DataPath`. За канонический договор принимается договор обычной
таблицы: отсутствие XML-тега означает `false`, а отсутствие YAML-ключа —
`true`.

## Принятый договор

`TableRules.autoInsertNewRow` получает два независимых неявных значения:

```ts
autoInsertNewRow: {
  yaml: "АвтоВводНовойСтроки",
  type: "boolean",
  implicitValueYAML: true,
  implicitValueXML: false,
  forbidImplicitValueYAML: true,
}
```

Итоговое преобразование:

| Конфигуратор | YAML | XML |
|---|---|---|
| `Истина` | ключ отсутствует | `<AutoInsertNewRow>true</AutoInsertNewRow>` |
| `Ложь` | `АвтоВводНовойСтроки: Ложь` | тег отсутствует |

Значение не зависит от `DataPath`. Общий индекс метаданных, reference XML и
снимок конфигурации для выбора default не используются.

## XML → YAML

Если `AutoInsertNewRow` отсутствует в XML, `implicitValueXML: false`
восстанавливает `false`. Оно отличается от YAML-default и записывается как
`АвтоВводНовойСтроки: Ложь`.

Явный XML `true` совпадает с `implicitValueYAML: true`, поэтому YAML-ключ не
создаётся.

## YAML → XML

Если YAML-ключ отсутствует, `implicitValueYAML: true` восстанавливает явный
XML-узел со значением `true`.

Явный YAML `Ложь` совпадает с `implicitValueXML: false`, поэтому XML-узел не
создаётся. Синхронизация не читает `DataPath` и не различает виды источников.

## JSON Schema и MCP-валидация

Обычная JSON Schema формы сейчас не исключает `implicitValueYAML`, поэтому
одного значения `implicitValueYAML: true` недостаточно. В нейтральный договор
`PropertyRule` добавляется признак `forbidImplicitValueYAML: true`. При нём
экспорт схемы исключает неявное значение независимо от общего режима экспорта
схемы.

Для `АвтоВводНовойСтроки` схема разрешает только явное `Ложь`; явное `Истина`
считается избыточным. Любое третье значение получает одну обычную схемную
ошибку. Отдельная семантическая проверка и второй проход по `DataPath` не
добавляются.

`nkdk.get_schema` возвращает это ограничение в схеме формы, а
`nkdk.validate_project` применяет ту же схему через общий core-валидатор.
Специальной логики в `packages/mcp` не требуется.

Если синхронизация вызвана без предварительной MCP-валидации, явное YAML
`Истина` преобразуется в тот же XML `true`, что и отсутствующий ключ. Сама
синхронизация не выполняет отдельную проверку избыточности.

## Известное ограничение

В `.agents/restrictions.md` фиксируется намеренное отличие компактного YAML от
default Конфигуратора. Для `DynamicList`, `GanttChart`, таблиц без
`ПутьКДанным` и специальных таблиц `SettingsComposer` фактический default
Конфигуратора равен `Ложь`, но NKDK применяет к `AutoInsertNewRow` единый
YAML-default `Истина`.

Поэтому XML без `AutoInsertNewRow` для таких таблиц импортируется с явным
`АвтоВводНовойСтроки: Ложь`. Это осознанная плата за простой единый договор без
разрешения источника данных.

К специальным таблицам `SettingsComposer` относятся как минимум `Filter`,
`Order`, `Selection`, `ConditionalAppearance`, `UserSettings`, `Settings`,
`DataParameters`, `FixedSettings`, `OutputParameters` и `UserFields`.

## Границы архитектуры

- Общая orchestration знает только нейтральные признаки
  `implicitValueYAML`, `implicitValueXML` и `forbidImplicitValueYAML`.
- Знание о `Table.AutoInsertNewRow` остаётся в `TableRules`.
- Общие metadata-слои не получают условий по `Table`, `DynamicList`,
  `GanttChart`, `SettingsComposer` или именам путей.
- Существующие XML-фикстуры не изменяются.
- Контекстные defaults для других свойств в эту работу не входят.

## Отклонённые варианты

- Разрешение типа источника через локальный индекс формы и общий индекс
  проекта точнее повторяет default Конфигуратора, но требует отдельной
  семантической проверки, обработки специальных таблиц и вложенных путей
  `Items.…CurrentData.…`.
- Универсальный YAML-default `Ложь` делает обычные таблицы многословными и
  противоречит выбранному договору основной таблицы.
- Отсутствие `implicitValueYAML` сохраняет все явные XML-значения, но не даёт
  компактного представления обычной таблицы.

## Проверки

1. Тест правила подтверждает `implicitValueYAML: true`,
   `implicitValueXML: false` и `forbidImplicitValueYAML: true` для
   `autoInsertNewRow`.
2. Тест XML → YAML проверяет отсутствующий XML-тег → явный YAML `Ложь` и XML
   `true` → отсутствующий YAML-ключ.
3. Тест YAML → XML проверяет отсутствующий YAML-ключ → XML `true` и YAML
   `Ложь` → отсутствующий XML-тег.
4. Тест JSON Schema формы разрешает `Ложь`, запрещает `Истина` и отклоняет
   третье значение без дополнительной семантической диагностики.
5. Тест MCP подтверждает, что `nkdk.validate_project` возвращает схемную
   ошибку для явного `Истина`; отдельная логика MCP не проверяется повторно.
6. Целевые тесты metadata forms и MCP, затем полный `pnpm test`.
7. Повторный round-trip `/Users/nikita/git/round-trip-compact/cf/doc` проверяет
   устранение расхождений `AutoInsertNewRow` и отдельно фиксирует ожидаемый
   рост явных `АвтоВводНовойСтроки: Ложь` у источников с другим default
   Конфигуратора.

## Критерии готовности

- Все четыре преобразования матрицы выполняются без reference XML.
- Схема формы и MCP-валидация запрещают явное YAML `Истина`.
- Синхронизация не строит и не читает индекс ради `AutoInsertNewRow`.
- Ограничение для источников с фактическим default `Ложь` документировано.
- Все тесты проходят.

## Трёхзначное растяжение групп формы

### Проблема

В XDTO-схеме свойства `GroupBase.HorizontalStretch` и
`GroupBase.VerticalStretch` имеют тип `BWAValue`. Он допускает три значения:
`true`, `false` и `auto`; XML-default равен `auto`. Поэтому отсутствие XML-узла
означает автоматическое значение, а не конкретное булево значение.

Это отличается от `Table.HorizontalStretch` и большинства полей формы: у них
свойство имеет тип `xs:boolean` с XML-default `true`. Источник договора —
[`model.xdtomngbase_root.res`](https://github.com/nikitazherebtsov/1c_res/blob/79cde5b70a15bb54c674ed56e76aa4471772d035/model.xdtomngbase_root.res#L530-L548).

Текущие `formGroupCommonProperties` ошибочно считают YAML-default
`HorizontalStretch` равным `false`, а `VerticalStretch` — `true`. В результате
round-trip `cf/doc` удаляет 583 явных `<HorizontalStretch>false</HorizontalStretch>`
и 212 явных `<VerticalStretch>true</VerticalStretch>`. Явное булево состояние
заменяется состоянием `auto`.

В `v0.0.3` те же defaults уже были записаны в rules.ts, но старая синхронизация
восстанавливала отсутствующие YAML-свойства из `sourceValue` и reference XML.
Поэтому расхождение обычно не проявлялось, хотя YAML не содержал достаточно
данных для самостоятельного восстановления XML.

### Принятый договор

Автоматическое состояние представляется отсутствием модельного значения и
отсутствием YAML-ключа. Явное YAML-значение `Авто` не добавляется.

| Состояние | Модель | YAML | XML |
|---|---|---|---|
| Автоматическое | `undefined` | ключ отсутствует | узел отсутствует |
| Ложь | `false` | `Ложь` | `<HorizontalStretch>false</HorizontalStretch>` |
| Истина | `true` | `Истина` | `<HorizontalStretch>true</HorizontalStretch>` |

Та же матрица применяется к `VerticalStretch` с соответствующим именем XML-узла.
Явный XML `auto` импортируется как `undefined` и при экспорте без reference
канонизируется в отсутствующий узел.

### Расширение booleanRule

Новый property-тип не добавляется. Только `BooleanRuleParams` получает явный
признак `implicitAuto: true`:

```ts
horizontalStretch: booleanRule({
  yaml: "РастягиватьПоГоризонтали",
  implicitAuto: true,
})
```

`implicitAuto` означает:

- отсутствие YAML-ключа задаёт автоматическое состояние `undefined`;
- XML `auto` и отсутствующий XML-узел импортируются как `undefined`;
- `true` и `false` не считаются YAML-default и всегда записываются явно;
- отсутствующий YAML-ключ не восстанавливает `true` или `false` из reference XML;
- при экспорте `undefined` XML-узел не создаётся;
- JSON Schema остаётся обычной булевой схемой и не разрешает явное `Авто`.

Внутри `booleanRule` этот признак создаёт нейтральный договор с явно
присутствующим `implicitValueYAML: undefined`. Общая оркестрация различает
отсутствующее поле правила и собственное поле со значением `undefined` через
`hasOwnProperty`. Во втором случае `undefined` считается намеренным результатом
и не заменяется значением из reference XML.

В параметрах вызова `booleanRule` признак `implicitAuto` несовместим с
`implicitValueYAML` и `noImplicitValueYAML`: для одного boolean-свойства
выбирается ровно один договор отсутствующего YAML-ключа.
`StringboolXML` расширяется значением `"auto"`; существующее преобразование
boolean закрепляется тестом как `"auto"` → `undefined`.

### Область применения

Оба свойства `formGroupCommonProperties` переводятся на `booleanRule` с
`implicitAuto: true`. Договор наследуют:

- `UsualGroup`;
- `CommandBar`;
- `ColumnGroup`;
- `ButtonGroup`;
- `Page`;
- `Pages`;
- `Popup`.

Локальные переопределения `horizontalStretch`, которые задают
`implicitValueYAML` или одновременно наследуют его с `noImplicitValueYAML`,
удаляются. `Table` и поля формы не изменяются: их XML-схема содержит обычный
`xs:boolean`, поэтому для них сохраняются существующие правила.

Общая orchestration не получает условий по `itemType` или именам элементов
формы. Знание о трёхзначном XML-значении находится в `booleanRule`, а решение о
его использовании — в rules.ts семейства `formGroup`.

### JSON Schema и MCP-валидация

Для свойства с `implicitAuto: true` YAML-ключ остаётся необязательным. Если ключ
присутствует, JSON Schema разрешает только `Истина` и `Ложь`. `Авто` и любое
третье значение отклоняются одной обычной схемной ошибкой.

`nkdk.get_schema` возвращает этот договор как часть схемы формы, а
`nkdk.validate_project` применяет ту же схему через общий core-валидатор.
Специальная проверка в `packages/mcp` не добавляется.

### Проверки

1. Тест `booleanRule` подтверждает, что `implicitAuto` создаёт собственное
   `implicitValueYAML: undefined` и несовместим с другими YAML-default режимами.
2. Существующий тест XML → модель для boolean расширяется случаем `auto` →
   `undefined`.
3. Проверка XML → YAML покрывает отсутствующий узел, явный `auto`, `false` и
   `true`.
4. Проверка YAML → XML покрывает отсутствующий ключ, `Ложь` и `Истина` без
   reference XML.
5. Проверка синхронизации с reference XML подтверждает, что отсутствующий
   YAML-ключ не восстанавливает явный XML `true` или `false`.
6. Контрактный тест правил подтверждает `implicitAuto: true` для обоих свойств
   всех семи элементов и отсутствие локальных противоречивых defaults.
7. Проверка JSON Schema формы разрешает отсутствие ключа, `Истина` и `Ложь`,
   но отклоняет `Авто` и третье значение. MCP использует тот же договор без
   повторения проверки в отдельной логике.
8. Существующие XML-фикстуры не изменяются.
9. После целевых тестов выполняются `pnpm type-check`, `pnpm test` и mutation
   testing изменённых production-диапазонов.
10. Повторный round-trip `/Users/nikita/git/round-trip-compact/cf/doc`
    подтверждает отсутствие удалений 583 `HorizontalStretch=false` и 212
    `VerticalStretch=true`.

### Критерии готовности

- YAML самостоятельно различает автоматическое, ложное и истинное состояния
  без чтения исходного XML.
- Явные XML `true` и `false` сохраняются в YAML и восстанавливаются обратно.
- Удаление ключа из YAML переводит свойство в автоматическое состояние и не
  восстанавливает прежнее значение из reference XML.
- JSON Schema и MCP-валидация не разрешают явное YAML `Авто`.
- `Table` и обычные поля формы сохраняют прежние boolean-defaults.
- Все тесты проходят.
