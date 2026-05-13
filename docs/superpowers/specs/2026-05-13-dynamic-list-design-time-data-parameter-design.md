# DynamicList dataParameters DesignTimeValue round-trip

## Context

Short round-trip по `/Users/nikita/git/round-trip-source/acc` показывает, что в
`Catalogs/Организации/Forms/ФормаСписка/Ext/Form.xml` параметр данных
`УведомленияЕГРЮЛ` меняет тип значения:

```diff
- <dcscor:value xsi:type="dcscor:DesignTimeValue">Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ</dcscor:value>
+ <dcscor:value xsi:type="dcscor:Field">...</dcscor:value>
```

Проблема не в имени `УведомленияЕГРЮЛ`: это имя поля/параметра конкретного
динамического списка, а не устойчивое правило платформы. Сейчас значение
`dcscor:DesignTimeValue` при импорте схлопывается в форму, не сохраняющую
исходный DCS-тип. На экспорте `DynamicListRules.dataParameters.defaultItemRule`
трактует такую строку как `Field`, поэтому XML-тип меняется.

## Goal

Зафиксировать и исправить один уникальный round-trip-дефект: параметр данных
`УведомленияЕГРЮЛ` должен сохранять `dcscor:DesignTimeValue` при XML -> модель -> XML.

Каждая уникальная проблема получает отдельный тест. Этот spec покрывает только
первую проблему из triage-списка.

## Design

Добавить точечный XML round-trip тест для `DynamicList`, в котором
`dcsset:dataParameters` содержит `dcscor:item` с параметром `УведомленияЕГРЮЛ`
и двумя `dcscor:value xsi:type="dcscor:DesignTimeValue"` элементами.

Исправление не должно завязываться на имя `УведомленияЕГРЮЛ`. Нужно сохранить
тип самого DCS-значения при XML-импорте: `dcscor:Field` и
`dcscor:DesignTimeValue` должны различаться в модели до XML-экспорта.
Реализация должна переиспользовать существующий паттерн
`DcsMetadataTypedValue`: типизированная форма `{ type, value }`,
определение `DesignTimeValue` из XML по `xsi:type`, а из YAML/строки - через
`importMetadataValueStringFromYAML`.

Не менять общий `defaultItemRule`, потому что он нужен для параметров, которые
действительно являются `dcscor:Field`.

Не добавлять `parameterRules` по имени `УведомленияЕГРЮЛ`, потому что это имя
поля конфигурации, а не типовое имя параметра.

## Data Flow

Для XML-цикла исходный `xsi:type` является источником истины:

1. `dcscor:value xsi:type="dcscor:DesignTimeValue"` импортируется как
   типизированное DCS-значение `DesignTimeValue`.
2. `dcscor:value xsi:type="dcscor:Field"` импортируется как типизированное
   DCS-значение `Field`.
3. Экспорт смотрит на типизированное значение и возвращает тот же `xsi:type`,
   без угадывания по имени параметра.

Для YAML-цикла дискриминатор явно не хранится. Если YAML содержит строку вроде
`Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ`, импорт восстанавливает
`DesignTimeValue` через `importMetadataValueStringFromYAML`. Если строка
распознаётся как путь поля, она остаётся `Field`. Это осознанная граница:
YAML не становится новым источником истины для XML `xsi:type`.

## Error Handling

Если строка в YAML неоднозначна и не распознаётся картой metadata value,
сохраняется существующее поведение по умолчанию для `dataParameters`. Явный
расширенный YAML-синтаксис вида `{ Тип, Значение }` не входит в этот шаг.

## Testing

1. Добавить красный точечный тест на XML round-trip `DynamicList` с параметром
   `УведомленияЕГРЮЛ`.
2. Добавить точечный тест на YAML-импорт строки `Перечисление...` как
   `DesignTimeValue`, если реализация затронет YAML-эвристику.
3. После правки запустить точечный тест `dynamicList` и тесты изменённого DCS
   value-модуля.
4. После зелёных точечных тестов запустить `pnpm test` из корня worktree.
