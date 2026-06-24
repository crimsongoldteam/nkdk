# Дизайн: сохранять quoted string как `xs:string` в DCS typed value

## Контекст

В полном round-trip `XML -> YAML -> XML` для формы
`Catalogs/СканированныеДокументыДляПередачиВЭлектронномВиде/Forms/ФормаЭлементаНовая/Ext/Form.xml`
найдено расхождение:

```diff
- <dcsset:right xsi:type="xs:string">.PDF</dcsset:right>
+ <dcsset:right xsi:type="xr:DesignTimeRef">'.PDF'</dcsset:right>
```

Такая же замена происходит для `.pdf`.

YAML уже содержит явный строковый литерал:

```yaml
ПравоеЗначение: "'.PDF'"
```

Пользовательское решение: в `DcsMetadataTypedValue` строка YAML,
обёрнутая одинарными кавычками, всегда означает XML `xs:string`, даже если
внутри выглядит как design-time значение.

## Причина

`packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`
сейчас проверяет `DesignTimeValue` раньше обычной строки. Поэтому значение
`"'.PDF'"` распознаётся как design-time значение и при экспорте становится
`xr:DesignTimeRef`, хотя `toYAML.ts` специально использует одинарные кавычки
как маркер строки.

## Решение

Изменить порядок определения типа в `detectTypeFromYAML`: проверка
`value.startsWith("'") && value.endsWith("'")` должна выполняться до
`DcsMetadataTypedValueRegistry.DesignTimeValue.detect`.

Ожидаемая модель:

```ts
{
  type: "string",
  value: ".PDF"
}
```

`toXML.ts` после этого восстановит:

```xml
<dcsset:right xsi:type="xs:string">.PDF</dcsset:right>
```

## Границы

- Не менять формат YAML.
- Не менять XML-фикстуры.
- Не менять общий механизм reference metadata.
- Не менять `DesignTimeValue.detect`, если достаточно локального изменения
  порядка в `fromYAML.ts`.

## Проверка

- Добавить точечный тест `fromYAML` для `"'.PDF'"`, ожидающий
  `{ type: "string", value: ".PDF" }`.
- Убедиться, что существующее поведение для неquoted metadata reference
  остаётся прежним: без source value это `DesignTimeValue`, с source `ref` это
  `ref`.
- Запустить точечные тесты `dscMetadataTypedValue`.
- После исправления проверить выбранный diff через `round-trip-yaml` single
  или triage для второго расхождения.
