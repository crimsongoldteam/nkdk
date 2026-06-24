# DCS ent system enumeration round-trip

## Контекст

Первое расхождение из `acc` находится в форме:

`DataProcessors/ПомощникРасчетаНалогаУСН/Forms/РасшифровкаУменьшенияНалогаИнтеграцияСБанком/Ext/Form.xml`

Исходный XML содержит:

```xml
<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
```

После short round-trip значение экспортируется как:

```xml
<dcscor:value xsi:type="dcscor:Field">Receipt</dcscor:value>
```

Импорт уже распознает `ent:*` через `inferEntSystemEnumerationType`, но возвращает только строковое значение. Из-за этого модель теряет `typeSE`, а экспорт под правилом `valueType: "Primitive"` не может восстановить исходный `xsi:type`.

## Цель

Сохранить тип неявно распознанной DCS system enumeration в модели и восстановить исходный `ent:AccumulationRecordType` при экспорте.

Границы задачи:

- исправляется только DCS MetadataDcsMetadataValue;
- первая цель - `ent:AccumulationRecordType`, но решение должно работать для любых поддержанных `ent:*`, которые уже распознаются через `inferEntSystemEnumerationType`;
- расхождения по порядку `dcsset:use` и `Picture/xr:LoadTransparent` остаются отдельными задачами.

## Дизайн

Добавить в `MetadataDcsMetadataSingleValue` отдельную форму для неявной system enumeration:

```ts
{
  type: "SystemEnumeration"
  typeSE: keyof SystemEnumerationTypeMap
  value: string
}
```

При импорте `ent:*` без явного `valueType: "SystemEnumeration"` возвращать эту форму вместо голой строки. При экспорте сначала распознавать эту форму и передавать ее в существующий `exportSystemEnumerationToDcsXML`.

Правила с явным `valueType: "SystemEnumeration"` остаются без изменений: они по-прежнему принимают строковое значение и используют `rule.typeSE`.

## Данные и поток

1. `fromXML` читает `dcscor:value`.
2. Если `xsi:type` начинается с `ent:` и найден соответствующий тип в `SystemEnumerations`, модель получает `{ type: "SystemEnumeration", typeSE, value }`.
3. `toXML` видит эту форму независимо от `rule.valueType` и экспортирует `dcscor:value` через `exportSystemEnumerationToDcsXML`.
4. XML получает тот же `xsi:type`, например `ent:AccumulationRecordType`.

## Ошибки и ограничения

Если `ent:*` не найден в `SystemEnumerations`, текущее поведение остается прежним: импорт завершится ошибкой `unsupported xsi:type`. Это лучше тихой потери типа.

Эвристика по значениям вроде `Receipt`/`Expense` не используется, потому что строка без `xsi:type` не должна превращаться в system enumeration.

## Тестирование

Добавить точечную фикстуру в `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__` для `ent:AccumulationRecordType`.

Проверки:

- `fromXML` импортирует XML в новую typed-форму;
- `toXML` экспортирует эту форму обратно в `xsi:type="ent:AccumulationRecordType"`;
- существующие фикстуры DCS MetadataDcsMetadataValue остаются зелеными.

После реализации запустить узкие тесты `dcsMetadataValue`, а перед закрытием всей серии задач - полный `pnpm test` из корня.
