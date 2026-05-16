# Round-Trip ColumnGroup HeaderFormat

## Контекст

Short round-trip для `acc/Documents/БольничныйЛист/Forms/ФормаПодробнееОРасчете/Ext/Form.xml` теряет содержимое `HeaderFormat` у групп колонок:

```xml
<HeaderFormat>
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>ЧГ=</v8:content>
  </v8:item>
</HeaderFormat>
```

После XML -> модель -> XML узел остается пустым. В текущих правилах `ColumnGroupRules.headerFormat` описан как строка, поэтому вложенный `v8:item` не попадает в модель.

## Источники истины

- `model.xdtomngbase_root.res` описывает `HeaderFormat` как `d4p1:LocalStringType`.
- `hlp` для расширения формы группы колонок называет свойство `ФорматШапки`.
- Соседние свойства формата в элементах формы уже используют `I8nText`, например `InputField.format`.

## Решение

`ColumnGroupRules.headerFormat` должен быть локализованным текстом:

```ts
headerFormat: { yaml: "ФорматШапки", type: "I8nText" }
```

XML round-trip:

- импортирует `<HeaderFormat><v8:item>...</v8:item></HeaderFormat>` в модель как `headerFormat: { items: { ru: "ЧГ=" } }`;
- экспортирует модель обратно в `HeaderFormat` с тем же локализованным содержимым;
- не добавляет `xsi:type`, потому что в исходном XML тип задан структурой свойства формы, а не атрибутом узла.

YAML:

```yaml
ФорматШапки: "ЧГ="
```

Для нескольких языков используется существующая форма `I8nText`.

## Границы

Это свойство относится только к `ColumnGroup` и не меняет контракт остальных форм-групп. Пустой или отсутствующий `HeaderFormat` продолжает означать отсутствие формата шапки.

## Проверка

Нужен тест round-trip для `ColumnGroup.HeaderFormat` с `v8:item ru / ЧГ=`, а также проверка YAML-короткой формы `ФорматШапки: "ЧГ="`.
