# DCS Typed Value Empty ValueList Reference Preserve

## Контекст

Full round-trip падает на DCS-фильтрах формы с ошибкой:

```text
DcsMetadataTypedValue XML: unsupported _xsi:type v8:ValueListType
```

Реальный XML-фрагмент:

```xml
<dcsset:right xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">-1</v8:lastId>
</dcsset:right>
```

Это правая часть DCS-условия `InList`: пустой список значений.

## Источник истины

В `/Users/nikita/git/1c_res/core.xsdxdto_root.res` `ValueListType` описан как структура:

- `valueType: TypeDescription`;
- `availableValues?: ValueListType`;
- `lastId?: long`;
- `item[]?: ValueListItemType`.

`lastId` означает последний выданный идентификатор строки коллекции. Для пустого списка платформа пишет `-1`.

## Цель

Разблокировать импорт и XML round-trip для пустого `v8:ValueListType` в `DcsMetadataTypedValue`, не вводя полноценную доменную модель списка значений.

## Решение

Поддержать только пустой `ValueListType` как reference-preserve форму.

Если при XML-импорте `DcsMetadataTypedValue` встречает:

```xml
<... xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">-1</v8:lastId>
</...>
```

то импорт не должен падать. Для обычной модели это значение можно представить минимальным служебным вариантом `EmptyValueList` или аналогичным внутренним типом, достаточным для обратного XML-экспорта.

При наличии reference-данных экспорт должен восстановить исходный XML-фрагмент пустого списка значений без нормализации в другую форму.

## Границы поддержки

На первом шаге поддерживается только пустой список значений:

- `xsi:type="v8:ValueListType"`;
- пустой `v8:valueType`;
- `v8:lastId` со значением `-1`;
- без `v8:item`;
- без `v8:availableValues`.

Если позже встретятся непустые `ValueListType`, их нужно разбирать отдельной задачей по XSD-модели.

## YAML

YAML-контракт не расширяется.

Пустой `ValueListType` нужен сейчас для XML round-trip DCS-фильтров. Человекочитаемое YAML-представление списка значений откладывается до появления требования редактировать такие значения в YAML.

## Фикстуры и тесты

Нужно добавить XML-фикстуру в `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__`:

- `emptyValueList.xml` или запись в существующий набор фикстур;
- модель представляет пустой список значений внутренним типом;
- `fromXML` импортирует без ошибки;
- `toXML` возвращает `xsi:type="v8:ValueListType"`, пустой `v8:valueType` и `v8:lastId = -1`.

Если тесты `filterItem` уже покрывают DCS right value, можно добавить интеграционный случай `FilterItemComparison InList` с пустым `ValueListType`, чтобы зафиксировать реальный контекст ошибки.

## Не входит

- Не моделировать полный `ValueListType` с элементами.
- Не добавлять YAML-представление для списка значений.
- Не менять общую модель `TypeDescription`.
- Не чинить соседние неподдержанные типы DCS: `xs:dateTime`, `xr:ValueList`, `dcsset:DataCompositionComparisonType`.
