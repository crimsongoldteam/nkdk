# MetadataAttribute Empty Synonym XML

## Контекст

Short round-trip XML нашел одинаковый кластер расхождений в `ExchangePlans`:

```diff
- <Synonym/>
+ <Synonym>
+   <v8:item>
+     <v8:lang>ru</v8:lang>
+     <v8:content/>
+   </v8:item>
+ </Synonym>
```

Расхождение находится в дочернем `Attribute` внутри `MetadataExchangePlan`, но
владельцем правила является общий модуль
`packages/core/metadata/commonObjects/metadataAttribute`.

Текущая цепочка такая:

- `I8nText.fromXML` для `<Synonym/>` возвращает `undefined`;
- `MetadataAttribute.synonym.defaultValue` на XML-импорте подставляет
  `{ items: { ru: "" } }`;
- `I8nText.toXML` выгружает этот объект как пустой русский `v8:item`;
- исходный пустой XML-тег превращается в развернутый локализованный текст.

Общий `I8nText` используется во многих местах, и для части свойств текущая
развернутая выгрузка пустого языка может быть правильной. Поэтому поведение
нельзя менять глобально для всех `I8nText`.

## Решение

Добавить явную XML-опцию на уровне правила `I8nText`, например
`emptyAsRawXML: true`.

При этой опции `I8nText.toXML` должен проверять `isEmptyI8nText(context, data)`:

- если все языки пустые, экспорт возвращает пустой XML-объект для текущего тега,
  чтобы результатом стал `<Synonym/>`;
- если есть непустой язык, экспорт остается прежним и пишет `v8:item`;
- если опция не включена, поведение `I8nText.toXML` не меняется.

Включить новую опцию только для `MetadataAttributeRules.properties.synonym`.
Остальные свойства `I8nText` будут подключаться к этому поведению только после
отдельно подтвержденных round-trip расхождений.

## Reproducer

Для первой итерации нужен один узкий reproducer на diff #1:

- XML-фикстура в `metadataAttribute` с `Attribute`, где `Properties/Synonym`
  представлен как `<Synonym/>`;
- TS-фикстура с ожидаемой моделью, где `synonym` сохранен как пустой
  локализованный текст: `{ items: {} }`;
- `fromXML`-тест проверяет импорт пустого тега;
- `toXML`-тест проверяет, что пустой синоним снова выгружается как
  `<Synonym/>`.

Хотя reproducer строится по diff #1, решение должно закрыть однотипные diff #2,
#3 и #4, потому что они отличаются только исходным XML-файлом и `uuid`
реквизита.

## Границы

В рамках этой спеки:

- меняется только поведение `I8nText.toXML` при явно включенной опции;
- опция включается только для `MetadataAttribute.synonym`;
- существующие XML-фикстуры не переписываются;
- новые правила `fromXML/toXML/fromYAML/toYAML` не добавляются;
- YAML-поведение не меняется;
- `MetadataRegisterField` и другие владельцы `I8nText` не меняются.

## Проверка

Нужны точечные тесты:

- `I8nText.toXML` с новой опцией и пустым значением возвращает пустой XML-узел;
- `I8nText.toXML` без новой опции сохраняет прежнюю развернутую выгрузку;
- `MetadataAttribute` импортирует `<Synonym/>` в ожидаемую пустую модель;
- `MetadataAttribute` экспортирует пустой синоним обратно в `<Synonym/>`;
- непустой `Synonym` у `MetadataAttribute` продолжает выгружаться через
  `v8:item`.

После реализации нужно выборочно повторить short round-trip на каталоге `acc` и
убедиться, что первые четыре diff'а про `ExchangePlans/*/Attribute/Synonym`
исчезли.
