# Round-trip: DCSParameter.value и xsi:nil

Дата: 2026-05-07

Статус: выбран подход по reference; реализация не начата.

## Контекст

Разбор short round-trip XML -> модель -> XML выявил потерю:

```xml
<dcssch:value xsi:nil="true"/>
```

у параметров СКД, особенно когда рядом есть:

```xml
<dcssch:valueListAllowed>true</dcssch:valueListAllowed>
```

Текущее правило в `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts` подавляет экспорт `value`, если `value === undefined` и `valueListAllowed === true`. Из-за этого явный nil исчезает при round-trip.

## Наблюдения по данным

Поиск по реальным XML в `/Users/nikita/git/round-trip-source` и `/Users/nikita/git/roundTripElements` показал, что правило нельзя вывести из `valueListAllowed`:

- `valueListAllowed=true` + `<dcssch:value xsi:nil="true"/>`: 291 случай;
- `valueListAllowed=true` + отсутствие `<dcssch:value>`: 293 случая;
- без `valueListAllowed=true` + `<dcssch:value xsi:nil="true"/>`: 2 329 случаев.

Дополнительная проверка по `valueType` тоже не дала надежной закономерности:

- все 291 случая `valueListAllowed=true` + nil имеют `dcssch:valueType`;
- среди 293 случаев `valueListAllowed=true` без `dcssch:value` есть как параметры без `valueType`, так и параметры с `valueType`.

Значит, `valueListAllowed`, `valueType` и их сочетания не являются источником истины для решения, нужно ли сохранять пустой `dcssch:value`.

## Выбранный подход

Сохранять nil по reference, как это уже делается для XML-only полей в других местах проекта.

Семантика:

- если текущая модель содержит собственный ключ `value`, экспортировать его;
- если текущая модель не содержит `value`, но reference содержит собственный ключ `value`, экспортировать nil;
- если ключа `value` нет ни в текущей модели, ни в reference, не экспортировать `dcssch:value`.

Ключевое различие:

- `<dcssch:value xsi:nil="true"/>` при reference-импорте должен давать объект, у которого есть собственный ключ `value` со значением `undefined` или `null`;
- отсутствие `<dcssch:value>` должно давать объект без собственного ключа `value`.

Так XML-референс становится источником знания о том, был ли nil в исходнике.

## Связь с существующей механикой

В `packages/core/metadata/orchestration/property/fromXML.ts` уже есть нужная база: при `context.fromXML.forReference === true` импорт записывает свойство в результат даже тогда, когда импортированное значение равно `undefined`, если XML-ключ присутствовал.

В `packages/core/metadata/orchestration/property/helpers.ts` уже есть `preserveFromReferenceXML`: оно экспортирует поле, если reference содержит собственный ключ с тем же именем. Это поведение проверено тестами для XML-only полей формы.

Для `DCSParameter.value` нужно использовать тот же принцип, но поле не является XML-only:

- оно должно экспортироваться по собственному значению модели;
- оно должно сохраняться по reference, когда в модели значения нет;
- оно не должно создаваться из одной только эвристики `valueListAllowed`.

## Предлагаемые изменения реализации

1. Для `DCSParameterRules.properties.value` убрать текущую эвристику:

```ts
toXML: (item) => !(item?.value === undefined && item?.valueListAllowed === true)
```

2. Добавить для `value` reference-preserve поведение:

```ts
preserveFromReferenceXML: true
```

3. Аккуратно расширить `shouldProcessProperty` для `preserveFromReferenceXML`, потому что `DCSParameter.value` отличается от XML-only полей:

- если текущий metadataItem содержит собственный ключ свойства, поле должно экспортироваться;
- иначе поле экспортируется только если referenceMetadata содержит собственный ключ свойства;
- без текущего ключа и без reference-ключа поле не экспортируется.

Это сохраняет прежнее поведение XML-only полей: у них `fromYAML: false`, `toYAML: false`, `fromXML: false`, и собственный ключ в обычной модели не появляется без явного участия кода.

4. Сохранить в `MetadataDcsMetadataValue` текущее значение `undefined` как сигнал для экспорта nil, потому что `exportNilValue: true` уже приводит `undefined` к:

```xml
<dcssch:value xsi:nil="true"/>
```

## YAML-семантика

YAML должен различать два случая:

```yaml
Параметр:
  Значение:
```

означает явный nil, то есть собственный ключ `value`.

```yaml
Параметр:
  ДоступенСписокЗначений: Истина
```

означает, что `value` в YAML не задан. При XML-экспорте такое поле берется из reference, если reference его содержит; иначе `dcssch:value` не создается.

В текущем generic fromYAML уже есть особый путь для `MetadataDcsMetadataValue`: YAML `null` возвращается как `null`, а не подменяется source-значением. В реализации нужно проверить, что это дает собственный ключ `value` и далее корректно экспортируется как nil.

## Тесты

Нужны тесты на три слоя поведения.

1. `DCSParameter` XML round-trip:

- параметр с `valueListAllowed=true` и исходным `<dcssch:value xsi:nil="true"/>` сохраняет nil;
- параметр с `valueListAllowed=true` и без `<dcssch:value>` не получает nil на экспорте.

2. Reference export:

- если модель не содержит `value`, а reference содержит собственный ключ `value`, XML содержит `xsi:nil`;
- если ни модель, ни reference не содержат `value`, XML не содержит `dcssch:value`;
- если модель содержит явный `value`, оно важнее reference.

3. YAML:

- `Значение:` импортируется как явный nil;
- отсутствие `Значение` не создает nil без reference;
- экспорт явного nil в YAML оставляет `Значение:`.

## Не входит в эту спеку

- Введение общего `{ type: "nil" }` для всех metadata values.
- Изменение XML-фикстур СКД как источника истины.
- Попытка восстановить nil по эвристике из `valueListAllowed`, `valueType` или имени параметра.
