# Round-trip: CommandInterface, XML parsing и ButtonGroup

Дата: 2026-05-08

Статус: согласована модель поведения; реализация не начата.

## Контекст

Вторая пачка short round-trip diff'ов (`6-10`) показала три независимые причины расхождений:

- `CommandInterface.CommandBar.Item` дописывает `<DefaultVisible>true</DefaultVisible>` там, где в исходном XML поля нет;
- `ChoiceList` внутри формы меняет текст представления `2.0` на `2`;
- `ButtonGroup` теряет root-атрибут `DisplayImportance="Usual"` / `DisplayImportance="VeryHigh"`.

Работа ведется в planning-worktree:

```text
/Users/nikita/git/nakidka-core/.worktrees/round-trip-command-interface-planning
```

В этом worktree пользователь уже обновил XML-фикстуры:

- `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`;
- `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/full.xml`.

Эти XML-файлы считаются источником истины для будущей реализации. Спецификация фиксирует ожидаемое поведение и не вносит кодовых изменений.

## CommandInterface.defaultVisible

### Наблюдение

Сейчас `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts` импортирует отсутствующий `<DefaultVisible>` как `true`:

```ts
defaultVisible: item.DefaultVisible ?? true
```

После этого `toXML.ts` видит `defaultVisible: true` и выводит `<DefaultVisible>true</DefaultVisible>`. Из-за этого round-trip добавляет тег, которого не было в исходном XML.

Поиск в `/Users/nikita/git/round-trip-source` не нашел реальных случаев `<DefaultVisible>true</DefaultVisible>`. Зато `<DefaultVisible>false</DefaultVisible>` встречается массово.

### Решение

`defaultVisible` для `CommandInterfaceItem` должно быть optional false-only:

- отсутствие `<DefaultVisible>` в XML означает отсутствие `defaultVisible` в модели;
- `<DefaultVisible>false</DefaultVisible>` означает `defaultVisible: false`;
- `defaultVisible: true` не является допустимым состоянием модели;
- отсутствие `Автовидимость` в YAML означает отсутствие `defaultVisible`;
- `Автовидимость: "Ложь"` означает `defaultVisible: false`;
- `Автовидимость: "Истина"` должна быть недопустимой через YAML-схему и типы.

Желаемый тип модели:

```ts
defaultVisible?: false
```

Для YAML-поведения нужен эквивалент правила `defaultValueYAML: true`: дефолтное значение `Истина` не должно выводиться и не должно быть допустимым явным YAML-значением. Так как `CommandInterface` сейчас реализован ручными `types.ts`, `fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts`, реализация должна локально повторить это поведение:

- в TypeScript-типе YAML оставить для `Автовидимость` только `"Ложь"`;
- в JSON Schema оставить для `Автовидимость` только literal `"Ложь"`;
- в `toYAML` не выводить поле, если `defaultVisible` отсутствует;
- в `fromYAML` принимать только `"Ложь"` и отсутствие поля.

Большой перенос `CommandInterface` на общий rule-путь в эту работу не входит.

### Ожидаемый поток

XML -> модель:

- `<DefaultVisible>false</DefaultVisible>` -> `defaultVisible: false`;
- отсутствие `<DefaultVisible>` -> поле `defaultVisible` отсутствует.

Модель -> XML:

- `defaultVisible: false` -> `<DefaultVisible>false</DefaultVisible>`;
- поле отсутствует -> тег не выводится.

YAML -> модель:

- `Автовидимость: "Ложь"` -> `defaultVisible: false`;
- поле отсутствует -> поле модели отсутствует;
- `Автовидимость: "Истина"` -> ошибка валидации YAML.

Модель -> YAML:

- `defaultVisible: false` -> `Автовидимость: "Ложь"`;
- поле отсутствует -> `Автовидимость` не выводится.

### Фикстуры и тесты

Нужно синхронизировать `commandInterface/__fixtures__/full.ts` с обновленным `full.xml`:

- модель должна отражать все элементы из нового XML;
- YAML-фикстура должна выводить `Автовидимость` только для явных `false`;
- элемент без `<DefaultVisible>` в XML должен не иметь `defaultVisible` в модели и `Автовидимость` в YAML.

Проверить существующие тесты:

- `fromXML.test.ts`;
- `toXML.test.ts`;
- `fromYAML.test.ts`;
- `toYAML.test.ts`;
- `toJSONSchema` путь, если для него есть прямой или косвенный тест через схему формы.

## XML numeric parsing и ChoiceList

### Наблюдение

В `Catalogs/ДоговорыКонтрагентов/Forms/ФормаЭлемента/Ext/Form.xml` round-trip меняет:

```diff
-<v8:content>2.0</v8:content>
+<v8:content>2</v8:content>
```

`v8:content` внутри `Presentation` является текстом локализованного представления и должен сохранять исходную строковую форму. Значения вроде `2.0`, `2.50`, `001` нельзя нормализовать как числа.

Сейчас `packages/core/xml/import/importer.ts` использует `parseTagValue: true`, поэтому fast-xml-parser успевает превратить leaf-текст `2.0` в число `2`. Затем `importI8nTextFromXML` делает `String(content)`, но исходная форма уже потеряна.

### Решение

Отключить глобальное числовое распознавание XML leaf-значений в XML importer. XML importer должен сохранять текстовые значения строками, если конечное правило явно не требует другого типа.

Числовое приведение должно жить на уровне конечных правил:

- `type: "number"` -> `importNumberFromXML`;
- `MetadataValue` с `xs:decimal` / `xs:integer` / `xs:double` / `xs:float`;
- специализированные импортёры, где уже есть явное `Number(...)`, например `font`, `border`, `picture`, `typeLink`;
- другие точечные правила, если тесты покажут зависимость от прежнего поведения parser'а.

Такой подход сохраняет текстовую форму для `I8nText`, `FormattedI8nText`, `Presentation` и похожих текстовых узлов, не ломая доменную модель числовых свойств.

### Проверка влияния

Эта правка шире одного `ChoiceList`, поэтому реализация должна идти с двумя уровнями проверки:

1. Узкие тесты XML/import и числовых правил:
   - `commonObjects/i8nText`;
   - `commonObjects/metadataValue`;
   - `commonObjects/number`;
   - `commonObjects/choiceList`;
   - формы, где есть `ChoiceList` с `Presentation`.
2. Полный `pnpm test` из корня после узкой проверки.

Если после отключения `parseTagValue` появятся падения, их нужно чинить не возвратом глобального парсинга, а явным приведением в конечном правиле, которому действительно нужен `number` или `boolean`.

### Тестовый сценарий

Добавить или обновить фикстуру, которая проверяет:

- XML содержит `<v8:content>2.0</v8:content>`;
- модель хранит `presentation.items.ru === "2.0"`;
- обратный XML снова содержит `<v8:content>2.0</v8:content>`.

## ButtonGroup.DisplayImportance

### Наблюдение

Round-trip теряет root-атрибут:

```diff
-<ButtonGroup name="ФормаГруппаИмпорт" id="1818" DisplayImportance="Usual">
+<ButtonGroup name="ФормаГруппаИмпорт" id="1818">
```

У соседних form-элементов `DisplayImportance` уже описан через root-атрибут `_DisplayImportance`, YAML `ВажностьПриОтображении`, системное перечисление `DisplayImportance` и `defaultValueYAML: "Auto"`. В `ButtonGroupRules` такого свойства нет.

Пользователь обновил `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/full.xml`; новая XML-фикстура считается источником истины целиком.

### Решение

Добавить в `ButtonGroupRules` свойство:

```ts
displayImportance: {
  yaml: "ВажностьПриОтображении",
  xml: "_DisplayImportance",
  type: "SystemEnumeration",
  typeSE: "DisplayImportance",
  defaultValueYAML: "Auto",
}
```

Правила `ButtonGroup` не урезаются. Свойства, которые были в правилах до обновления XML-фикстуры, остаются поддержанными. Нужно только добавить недостающее поле и синхронизировать TS/YAML/enterprise-фикстуры с новой XML-фикстурой.

### Изменения фикстур

Новая `buttonGroup/__fixtures__/full.xml` отличается от старой не только `DisplayImportance`.

Появилось:

- root-атрибут `DisplayImportance="VeryHigh"`;
- у вложенной кнопки появились `<Type>CommandBarButton</Type>` и `<CommandName>Form.Command.Команда1</CommandName>`.

Пропало из новой XML-фикстуры:

- `<Shortcut>S</Shortcut>`;
- содержимое `ExtendedTooltip/Title`.

Также изменились значения `id`, `Title`, `TitleFont`, `TitleTextColor`, `ToolTipRepresentation`, `Width`, `Height`, `VerticalStretch`, `GroupVerticalAlign`, имена и id вложенных элементов.

Нужно обновить:

- `fullButtonGroup`;
- `fullButtonGroupPartialYAML`;
- `fullButtonGroupTypedYAML`;
- `fullButtonGroupEnterprise`;
- при необходимости ожидания NKDK/enterprise-тестов, если они завязаны на прежние значения.

Минимальные фикстуры менять не нужно, если они не завязаны на новое свойство.

## Общая стратегия реализации

Реализацию лучше делать тремя независимыми вертикальными шагами в одном PR:

1. `CommandInterface.defaultVisible`: типы, XML/YAML import/export, схема, фикстуры и тесты.
2. XML importer numeric parsing: отключение глобального числового разбора, точечные приведения, тест с `v8:content>2.0`.
3. `ButtonGroup.DisplayImportance`: правило, синхронизация фикстур, тесты элемента.

Порядок важен: сначала самая локальная проблема `CommandInterface`, затем более широкая правка XML importer, затем фикстуры `ButtonGroup`. Так проще отличать новые падения от уже известных.

## Риски

- Отключение глобального `parseTagValue` может проявить места, где правила неявно ждали `number` или `boolean` от XML-парсера.
- `CommandInterface` реализован ручными commonObject-функциями, поэтому `defaultValueYAML: true` не применится автоматически без локального кода или небольшого перевода на rule-механику.
- Обновленная `ButtonGroup` XML-фикстура меняет много значений сразу; падения тестов могут быть связаны не с `DisplayImportance`, а с несинхронизированными TS/YAML/enterprise-ожиданиями.

## Не входит в эту спеку

- Создание round-trip reproducer'ов через skill `round-trip-xml`.
- Изменение правил других form-элементов, кроме явных последствий отключения глобального numeric parsing.
- Удаление существующих свойств `ButtonGroupRules`, которых нет в новой XML-фикстуре.
- Исправление unrelated diff'ов из других triage-пачек.
