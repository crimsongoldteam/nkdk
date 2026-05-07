# Round-trip: DcsLocalStringType вместо UserSettingPresentation

Дата: 2026-05-07

Статус: согласовано полное удаление `UserSettingPresentation`; реализация не начата.

## Контекст

Разбор short round-trip XML -> модель -> XML выявил потерю `dcssch:title` в форме:

```xml
<dcssch:title xsi:type="xs:string">Партнер по умолчанию</dcssch:title>
```

Текущие правила `DCSParameter.title`, `DataCompositionSchemaDataSetField.title` и `CalculatedField.title` используют `type: "I8nText"` с `typedXML: true`. Такой импорт ожидает форму:

```xml
<dcssch:title xsi:type="v8:LocalStringType">
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>Партнер по умолчанию</v8:content>
  </v8:item>
</dcssch:title>
```

Если приходит `xs:string`, `I8nText.fromXML` не видит `v8:item`, возвращает `undefined`, и заголовок пропадает.

## Наблюдения

Поиск по XML-источникам показал, что обе формы реальны:

- `dcssch:title xsi:type="xs:string"`: 38 вхождений;
- `dcssch:title xsi:type="v8:LocalStringType"`: 14 640 вхождений.

В проекте уже есть похожий тип `UserSettingPresentation`, который умеет пару `xs:string` / `v8:LocalStringType` и сохраняет строковую форму по reference.

Также в реестре уже есть более нейтральный тип `DcsLocalStringType`, но сейчас он:

- расположен внутри `filterItem/fields/dcsLocalStringType.ts`;
- фактически используется только как inline-тип для filter item;
- умеет только `v8:LocalStringType`;
- не покрывает `xs:string`.

## Выбранное решение

Сделать `DcsLocalStringType` общим DCS-текстовым типом для XML-форм, которые могут быть:

- `xsi:type="xs:string"`;
- `xsi:type="v8:LocalStringType"`.

`UserSettingPresentation` удалить полностью, без alias и обратной совместимости в `PropertyRuleType`.

Причина: старое имя описывает конкретный смысл поля пользовательского представления, а не XML-формат. Логика нужна шире: для пользовательских представлений, DCS-заголовков и других DCS local string полей.

## Целевая семантика

### XML -> модель

`xs:string` импортируется как обычный `I8nText` с default-language:

```ts
{ items: { ru: "Партнер по умолчанию" } }
```

`v8:LocalStringType` импортируется как обычный многоязычный `I8nText`.

### XML reference -> модель

Reference должен сохранить исходную XML-форму:

- если XML был `xs:string`, reference должен дать экспортному коду признак строковой формы;
- если XML был `v8:LocalStringType`, reference должен сохранить обычный `I8nText`.

Текущая логика `UserSettingPresentation` сохраняет `xs:string` как строку. Это приемлемо оставить как внутренний сигнал для `DcsLocalStringType`, потому что публичная модель при обычном импорте остается `I8nText`.

### Модель -> XML

Если reference указывает, что исходная форма была `xs:string`, и в текущей модели один язык, экспортировать:

```xml
<... xsi:type="xs:string">...</...>
```

Если reference отсутствует или исходная форма была `v8:LocalStringType`, экспортировать:

```xml
<... xsi:type="v8:LocalStringType">
  <v8:item>...</v8:item>
</...>
```

Если в текущей модели больше одного языка, всегда экспортировать `v8:LocalStringType`, даже если reference был `xs:string`.

### YAML

YAML остается таким же, как у `I8nText`:

- один язык может быть строкой;
- несколько языков остаются объектом языков.

## Изменения в коде

1. Вынести `DcsLocalStringType` из `filterItem/fields/dcsLocalStringType.ts` в общий модуль, например:

```text
packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/
```

2. Реализовать в нем бывшую XML-логику `UserSettingPresentation`:

- `fromXML`;
- `toXML`;
- `fromYAML`;
- `toYAML`.

3. Подключать `DcsLocalStringType` из `dataCompositionSystem/index.ts`, а не через `filterItem/inlineTypes.ts`.

4. Заменить все правила:

```ts
type: "UserSettingPresentation"
```

на:

```ts
type: "DcsLocalStringType"
```

5. Перевести DCS-заголовки с `I8nText` на `DcsLocalStringType`:

- `DCSParameter.title`;
- `DataCompositionSchemaDataSetField.title`;
- `CalculatedField.title`.

6. Удалить `UserSettingPresentation` из:

- `packages/core/metadata/orchestration/property/registry.ts`;
- `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`;
- `packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/`.

## Тесты

Перенести тесты `userSettingPresentation` на `dcsLocalStringType`:

- импорт `xs:string`;
- импорт `v8:LocalStringType`;
- экспорт одного языка с reference-строкой в `xs:string`;
- экспорт одного языка без reference в `v8:LocalStringType`;
- экспорт нескольких языков всегда в `v8:LocalStringType`.

Добавить покрытие для `dcssch:title xsi:type="xs:string"`:

- `DCSParameter.title`;
- `DataCompositionSchemaDataSetField.title`.

Для `CalculatedField.title` достаточно покрыть тем же типом через общий `DcsLocalStringType`, если прямой фикстуры нет; отдельную фикстуру добавлять только если окажется, что поведение отличается.

## Не входит в эту спеку

- Изменение YAML-формата `I8nText`.
- Поддержка старого `type: "UserSettingPresentation"` как alias.
- Изменение семантики `dcsset:userSettingPresentation` как поля: меняется только общий тип правила, YAML-ключи и модель остаются прежними.
