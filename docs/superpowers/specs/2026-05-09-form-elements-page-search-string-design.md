# Form Elements Page And SearchStringAddition Round-Trip Design

## Контекст

Short round-trip XML показал два независимых расхождения в элементах управляемой формы:

- `Page` теряет XML-узел `<ChildItemsWidth>LeftNarrowest</ChildItemsWidth>`.
- `SearchStringAddition` теряет XML-узлы `<AutoMaxWidth>false</AutoMaxWidth>` и `<MaxWidth>20</MaxWidth>`.

Пункт с `FormAttribute Settings` не входит в эту спецификацию: он уже закрыт отдельной веткой `codex/form-attribute-typed-settings` коммитом `590f411a9`.

## Цель

Сохранить свойства `ChildItemsWidth`, `AutoMaxWidth` и `MaxWidth` в XML -> модель -> XML и YAML -> модель -> YAML циклах для соответствующих form-elements без изменения общих правил за пределами нужных элементов.

## Границы

Входит:

- `PageRules.slaveItemsWidth` в `packages/core/metadata/forms/elements/page/rules.ts`.
- `SearchStringAdditionRules` и `SingleSearchStringAdditionRules` через общий набор свойств в `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`.
- XML, TS-модель и YAML-ожидания fixture'ов для `Page` и `SearchStringAddition`.
- Узкие проверки централизованных тестов form-elements для XML и YAML.

Не входит:

- Перенос `slaveItemsWidth` в `formGroupCommonProperties`.
- Общий рефакторинг свойств `SearchStringAddition` и `SearchControlAddition`.
- Новые правила `fromXML` / `toXML` / `fromYAML` / `toYAML`; изменения должны выражаться через `rules.ts`.
- Изменения исходных XML-фикстур из внешнего XML-репозитория.

## Решение 1: Page.ChildItemsWidth

Сейчас `PageRules` уже содержит свойство модели `slaveItemsWidth`, но у него нет XML-маппинга. В `UsualGroupRules` то же свойство уже связано с XML-тегом `ChildItemsWidth`.

Нужно добавить `xml: "ChildItemsWidth"` именно в `PageRules.slaveItemsWidth`.

Не нужно переносить свойство в `formGroupCommonProperties`: этот общий набор используют `Pages`, `CommandBar`, `ButtonGroup`, `Popup`, `ColumnGroup` и другие элементы. Такой перенос расширит XML-поведение сразу на несколько типов и может начать экспортировать `ChildItemsWidth` там, где платформа его не ожидает.

Fixture для `Page` должен явно проверять все направления:

- XML: добавить `<ChildItemsWidth>LeftNarrowest</ChildItemsWidth>` в `packages/core/metadata/forms/elements/page/__fixtures__/full.xml`.
- TS-модель: добавить `slaveItemsWidth: "LeftNarrowest"` в `fullPage`.
- YAML: добавить `ШиринаПодчиненныхЭлементов: "ЛевыйОченьУзкий"` в `fullPagePartialYAML`.

## Решение 2: SearchStringAddition sizes

`SearchControlAddition` уже поддерживает `autoMaxWidth` и `maxWidth`, а `SearchStringAddition` нет. Из-за этого round-trip удаляет `<AutoMaxWidth>false</AutoMaxWidth>` и `<MaxWidth>20</MaxWidth>` из `SearchStringAddition`.

Нужно добавить в `searchStringAddition.commonProperties`:

- `autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" }`
- `maxWidth: { yaml: "МаксимальнаяШирина", type: "number" }`

Это автоматически применится к `SingleSearchStringAdditionRules` и `SearchStringAdditionRules`, потому что оба используют один локальный `commonProperties`.

Не нужно выносить общий набор с `SearchControlAddition`: у `SearchControlAddition` есть дополнительные свойства, например `childItems`, и общий рефакторинг увеличит границы изменения без пользы для текущего дефекта.

Fixture для `SearchStringAddition` должен явно проверять все направления:

- XML: добавить `<AutoMaxWidth>false</AutoMaxWidth>` и `<MaxWidth>20</MaxWidth>` в `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml`.
- XML single: добавить те же узлы в `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml`.
- TS-модель: добавить `autoMaxWidth: false` и `maxWidth: 20` в `fullSingleSearchStringAddition`.
- YAML: добавить `АвтоМаксимальнаяШирина: "Ложь"` и `МаксимальнаяШирина: 20` в `fullSingleSearchStringAdditionYAML`.

## Тестирование

Централизованные тесты form-elements уже читают `ElementFixtures` и проверяют:

- `metadata/forms/elements/__tests__/fromXML.test.ts`
- `metadata/forms/elements/__tests__/toXML.test.ts`
- `metadata/forms/elements/__tests__/fromYAML.test.ts`
- `metadata/forms/elements/__tests__/toYAML.test.ts`

После изменения fixture'ов эти четыре файла должны ловить регрессии без отдельных `it(...)` блоков.

Узкая проверка:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Перед закрытием задачи нужно выполнить проектное требование:

```bash
pnpm test
```

Если worktree свежий, перед полным тестом сначала выполнить:

```bash
pnpm --filter nkdk-language langium:generate
```

## Риски

- Для `Page` важно не поднять `ChildItemsWidth` в общий `formGroupCommonProperties`, иначе поведение изменится у нескольких элементов сразу.
- Для `SearchStringAddition` важно обновить XML, модель и YAML вместе; иначе часть централизованных тестов начнет падать не по целевому поведению, а из-за рассинхронизации fixture'ов.
- Для `fullSingle.xml` важно сохранить согласованность с single-вариантом модели, потому что `SingleSearchStringAdditionRules` использует тот же набор свойств.
