# DynamicList dataParameters DesignTimeValue round-trip

## Context

Short round-trip по `/Users/nikita/git/round-trip-source/acc` показывает, что в
`Catalogs/Организации/Forms/ФормаСписка/Ext/Form.xml` параметр данных
`УведомленияЕГРЮЛ` меняет тип значения:

```diff
- <dcscor:value xsi:type="dcscor:DesignTimeValue">Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ</dcscor:value>
+ <dcscor:value xsi:type="dcscor:Field">...</dcscor:value>
```

Владелец правила - `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`.
Сейчас `DynamicListRules.dataParameters` задаёт общий `defaultItemRule` как
`valueType: "Field"`, поэтому неизвестные параметры экспортируются как поле СКД.

## Goal

Зафиксировать и исправить один уникальный round-trip-дефект: параметр данных
`УведомленияЕГРЮЛ` должен сохранять `dcscor:DesignTimeValue` при XML -> модель -> XML.

Каждая уникальная проблема получает отдельный тест. Этот spec покрывает только
первую проблему из triage-списка.

## Design

Добавить точечный XML round-trip тест для `DynamicList`, в котором
`dcsset:dataParameters` содержит `dcscor:item` с параметром `УведомленияЕГРЮЛ`
и двумя `dcscor:value xsi:type="dcscor:DesignTimeValue"` элементами.

Исправление выполнить через `rules.ts`: добавить для
`DynamicListRules.dataParameters` запись в `parameterRules`, где
`УведомленияЕГРЮЛ` использует `type: "SettingsParameterValue"` и
`valueType: "DesignTimeValue"`.

Не менять общий `defaultItemRule`, потому что он нужен для параметров, которые
действительно являются `dcscor:Field`.

## Data Flow

`SettingsParameterValueCollection` выбирает правило элемента по имени параметра:

1. `parameterRules[parameterName]`
2. `defaultItemRule`

После добавления правила `УведомленияЕГРЮЛ` импорт и экспорт будут использовать
`DcsMetadataValue.valueType = "DesignTimeValue"` для этого параметра, а остальные
параметры продолжат идти через default `Field`.

## Error Handling

Если в будущем появятся другие параметры данных с `DesignTimeValue`, они должны
получить отдельные тесты и отдельные записи `parameterRules`. Автоопределение
типа по XML не входит в этот шаг, чтобы не менять форму модели и поведение
неизвестных параметров.

## Testing

1. Добавить красный точечный тест на round-trip `DynamicList` с параметром
   `УведомленияЕГРЮЛ`.
2. После правки запустить точечный тест `dynamicList`.
3. После зелёного точечного теста запустить `pnpm test` из корня worktree.
