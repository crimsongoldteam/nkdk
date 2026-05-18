# DCS AvailableFields item XML order

## Контекст

Второе расхождение из `acc` находится в форме:

`DataProcessors/СверкаДанныхУчетаНДС/Forms/Форма/Ext/Form.xml`

Исходный XML содержит выбранное поле с `use` перед `field`:

```xml
<dcsset:item>
  <dcsset:use>false</dcsset:use>
  <dcsset:field>ВходящиеРеестрыДатаФормирования</dcsset:field>
</dcsset:item>
```

После short round-trip текущий экспорт меняет порядок:

```xml
<dcsset:item>
  <dcsset:field>ВходящиеРеестрыДатаФормирования</dcsset:field>
  <dcsset:use>false</dcsset:use>
</dcsset:item>
```

`AvailableFields` уже умеет хранить объектную форму элемента с `field`, `use`, `title`,
`lwsTitle` и `viewMode`. Проблема осталась только в порядке XML-узлов.

## Цель

Сделать XML-экспорт объектного `AvailableFieldItem` совместимым с исходным XML 1C:
`dcsset:use` должен идти перед `dcsset:field`.

Границы задачи:

- меняется только порядок XML-узлов в `AvailableFields`;
- строковая форма элемента остается короткой и экспортируется только как `dcsset:field`;
- существующая XML-фикстура `selected-item.xml` должна быть исправлена, потому что сейчас она
  закрепляет неправильный порядок;
- другие DCS-элементы и правила не меняются.

## Дизайн

В `availableFields/toXML.ts` объектную форму элемента экспортировать в порядке:

1. `dcsset:use`, если поле задано;
2. `dcsset:field`;
3. `dcsset:title`, если поле задано;
4. `dcsset:lwsTitle`, если поле задано;
5. `dcsset:viewMode`, если поле задано.

Такой порядок согласуется с соседними DCS-элементами, где `use` является первым узлом
(`OrderItemField`, `GroupItemField`, `FilterItemComparison`), и с реальным XML из `acc`.

## Данные и поток

1. `fromXML` читает `dcsset:item` и сохраняет `{ field, use: false }`.
2. Модель не меняется.
3. `toXML` получает объектный `AvailableFieldItem` и строит XML-объект с `use` перед `field`.
4. Сравнение round-trip больше не видит перестановку узлов.

## Тестирование

Обновить `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/selected-item.xml`:
в обоих объектных элементах `dcsset:use` должен идти перед `dcsset:field`.

Проверки:

- `toXML` для `selectedItemAvailableFields` совпадает с обновленной фикстурой;
- `fromXML` для той же фикстуры остается зеленым;
- после реализации запустить узкие тесты `availableFields`;
- перед закрытием всей серии задач запустить полный `pnpm test` из корня.

## Не входит

- Не менять существующие XML-фикстуры из внешнего XML-репозитория.
- Не добавлять новые правила fromXML/toXML/fromYAML/toYAML.
- Не решать здесь `ent:*` и `Picture/xr:LoadTransparent` расхождения.
