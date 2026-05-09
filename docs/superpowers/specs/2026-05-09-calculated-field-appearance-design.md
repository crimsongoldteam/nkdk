# CalculatedField appearance design

Дата: 2026-05-09

## Контекст

После исправления коллекции `CalculatedFields` short round-trip по XML-дампу `trade` больше не
теряет сами узлы `<CalculatedField>`, но в файле
`Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml` остаётся одно расхождение: у второго
вычисляемого поля пропадает вложенное оформление.

Исходный XML содержит:

```xml
<dcssch:appearance>
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>ЦветТекста</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value>
  </dcscor:item>
</dcssch:appearance>
```

Текущий `CalculatedFieldRules` описывает `dataPath`, `expression`, `title`, `useRestriction`,
`presentationExpression`, `orderExpressions` и `valueType`, но не описывает
`dcssch:appearance`. Поэтому import игнорирует узел, а export не может восстановить его.

Рядом уже существует тип `AppearanceFields`, который используется в
`ConditionalAppearanceItemRules.appearance` и умеет параметры оформления через
`SettingsParameterValue`, включая `ЦветТекста` с `valueType: "Color"`.

## Решение

Добавить в `CalculatedFieldRules` обычное декларативное свойство:

```ts
appearance: {
  type: "AppearanceFields",
  xml: "dcssch:appearance",
  yaml: "Оформление",
  order: 4,
}
```

Существующие поля после `title` нужно сдвинуть по `order`, чтобы XML-порядок остался естественным:
`dataPath`, `expression`, `title`, `appearance`, `useRestriction`, `presentationExpression`,
`orderExpressions`, `valueType`.

Модель `CalculatedField` получит свойство `appearance`, выводимое типами автоматически через
`MetadataTypeByRule`. Отдельная логика в `DynamicList` не нужна: `DynamicList` хранит массив
`CalculatedField`, а каждый `CalculatedField` сам отвечает за своё оформление.

## YAML

YAML должен использовать уже существующий формат `AppearanceFields`:

```yaml
Оформление:
  ЦветТекста: "#1C55AE"
```

Точный вид значения должен соответствовать текущему `AppearanceFields`/`SettingsParameterValue`
экспорту. Нового ad hoc-формата для цвета вводить не нужно.

## Тесты

Нужны два уровня проверки:

1. `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField`
   - фикстура `appearance.xml` с `dcssch:appearance` и `ЦветТекста`;
   - TS/YAML-фикстура с `appearance`;
   - `fromXML`, `toXML`, `fromYAML`, `toYAML` тесты.

2. `packages/core/metadata/forms/commonObjects/dynamicList`
   - обновить `multipleCalculatedFields.xml`: у второго `CalculatedField` добавить
     `dcssch:appearance`;
   - обновить `multipleCalculatedFieldsDynamicList` и YAML-проверку;
   - проверить, что `DynamicList` round-trip сохраняет оба `CalculatedField` и оформление второго.

## Не входит в границы

- Не менять модель `DynamicList` сверх уже добавленного массива `CalculatedFields`.
- Не добавлять raw XML pass-through для `appearance`.
- Не расширять список параметров `AppearanceFields`; `ЦветТекста` уже описан.
- Не чинить оставшиеся расхождения с английскими служебными именами.

## Критерий готовности

- Round-trip для `Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml` больше не теряет
  `<dcssch:appearance>`.
- Focused тесты `CalculatedField` и `DynamicList` зелёные.
- `pnpm test` и `pnpm --filter @nakidka/core run type-check` зелёные перед завершением работы.
