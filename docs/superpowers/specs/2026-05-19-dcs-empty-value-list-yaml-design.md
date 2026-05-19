# DCS EmptyValueList в YAML

## Контекст

В worktree `codex/round-trip-yaml-errors` полный `round-trip-yaml` доходит дальше предыдущих блокеров, но падает на стадии `import` для каталога `acc`.

Первый текущий блокер:

```text
DcsMetadataTypedValue YAML: EmptyValueList is XML-only
```

Он воспроизводится на формах `Сотрудники`, `ФизическиеЛица` и `ЭлектронныеТрудовыеКнижки_НачалоРаботы`. В исходном XML это пустой DCS typed value:

```xml
<dcsset:right xsi:type="v8:ValueListType">
  <v8:valueType/>
  <v8:lastId xsi:type="xs:decimal">-1</v8:lastId>
</dcsset:right>
```

XML-импорт уже распознаёт такой узел как модель `{ type: "EmptyValueList" }`. Ошибка возникает позже, при экспорте модели в YAML: `EmptyValueList` сейчас намеренно помечен как XML-only.

## Решение

Добавить `EmptyValueList` в YAML-контракт `DcsMetadataTypedValue` как строковый литерал:

```yaml
СписокЗначений
```

Это согласуется с уже существующим YAML-представлением пустого `xr:ValueList` в `metadataValue`.

Поток должен стать таким:

1. XML `v8:ValueListType` без элементов импортируется в модель `{ type: "EmptyValueList" }`.
2. Модель `{ type: "EmptyValueList" }` экспортируется в YAML как `СписокЗначений`.
3. YAML `СписокЗначений` импортируется обратно в модель `{ type: "EmptyValueList" }`.
4. Модель экспортируется в XML как пустой `v8:ValueListType` с `v8:valueType` и `v8:lastId = -1`.

Непустой `v8:ValueListType` остаётся неподдержанным и должен продолжать падать с ошибкой `unsupported non-empty v8:ValueListType`.

## Границы

В рамках этого изменения не добавляем поддержку непустых списков значений.

Не меняем XML-фикстуры. Источником истины остаётся текущий XML.

Не меняем общую модель `metadataValue`, кроме необходимости свериться с её существующим литералом `СписокЗначений`.

## Проверки

Нужно расширить существующие проверки `DcsMetadataTypedValue`:

- `fromXML`: пустой `v8:ValueListType` импортируется в `{ type: "EmptyValueList" }`;
- `toXML`: `{ type: "EmptyValueList" }` экспортируется в ожидаемый пустой `v8:ValueListType`;
- `toYAML`: `{ type: "EmptyValueList" }` экспортируется в `СписокЗначений`;
- `fromYAML`: `СписокЗначений` импортируется в `{ type: "EmptyValueList" }`;
- обычная строка `'СписокЗначений'` в кавычках импортируется как `{ type: "string", value: "СписокЗначений" }`, а не как `EmptyValueList`.

После точечных тестов нужно снова запустить `round-trip-yaml` из worktree и убедиться, что этот блокер ушёл или сменился следующим независимым блокером.
