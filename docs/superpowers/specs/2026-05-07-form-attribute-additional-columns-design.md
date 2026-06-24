# FormAttribute: смешанные Column и AdditionalColumns

## Контекст

Short round-trip нашёл форму, где один реквизит формы содержит в XML оба вида дочерних узлов внутри одного контейнера:

```xml
<Columns>
  <Column name="Отступ" id="1">...</Column>
  <AdditionalColumns table="ГрафикНачислений"/>
</Columns>
```

Сейчас модель `FormAttributeColumns` описана как `FormAttributeColumn[] | FormAttributeAdditionalColumns[]`. Из-за этого импорт выбирает одну ветку: если есть `AdditionalColumns`, обычные `Column` теряются. Экспорт, YAML и построение графа тоже выбирают поведение по первому элементу массива.

Похожая задача уже решена для реквизитов формы и условного оформления: XML-контейнер `Attributes` общий, но в модели разные смыслы разведены по полям `attributes` и `attributesConditionalAppearance`.

## Решение

Развести обычные и дополнительные колонки на уровне модели `FormAttribute`:

```ts
columns: FormAttributeColumn[]
additionalColumns?: FormAttributeAdditionalColumns[]
```

`columns` означает только прямые XML-узлы `<Column>` внутри `<Columns>`.

`additionalColumns` означает только группы `<AdditionalColumns table="...">`.

Старый тип `FormAttributeColumns = FormAttributeColumn[] | FormAttributeAdditionalColumns[]` больше не должен быть центральной моделью смешанного контейнера. Его можно удалить или сузить до вспомогательного алиаса, если это нужно для регистрации типов.

## XML

Импорт XML:

- `<Columns><Column .../></Columns>` заполняет `columns`;
- `<Columns><AdditionalColumns .../></Columns>` заполняет `additionalColumns`;
- если внутри одного `<Columns>` есть оба вида узлов, импорт сохраняет оба;
- если `<Columns>` отсутствует, `columns` остаётся пустым массивом.

Экспорт XML:

- если `columns` непустой, под `<Columns>` пишутся прямые `<Column>`;
- если `additionalColumns` непустой, под тем же `<Columns>` пишутся `<AdditionalColumns>`;
- если оба набора пустые, `<Columns>` не пишется;
- порядок внутри `<Columns>`: сначала `Column`, затем `AdditionalColumns`.

Реализация может использовать два отдельных правила свойств с общим `xmlParents: ["Columns"]`, если оркестрация корректно сохранит нумерацию `id`. Если нет, оставить специализированный XML-импорт/экспорт, но уже для двух разных полей.

## YAML

YAML становится явным:

```yaml
Реквизиты:
  Объект:
    Колонки:
      Отступ:
        Тип: Строка
    ДополнительныеКолонки:
      "Объект.ГрафикНачислений":
        КолонкаТЧ:
          Тип: Строка
```

Старый формат, где дополнительные колонки угадывались внутри `Колонки`, не поддерживается. На экспорт дополнительные колонки всегда пишутся в `ДополнительныеКолонки`.

## Граф

Построение графа обрабатывает два поля независимо:

- `columns` создаёт узлы колонок формы с ребром `FORM_COLUMN`;
- `additionalColumns` создаёт прокси-узел `AdditionalColumnsProxy`, ребро `TABLE_EXTENSION`, ссылку `TABLE` на табличную часть и дочерние узлы с ребром `ADDITIONAL_COLUMN`;
- если у реквизита есть оба поля, строятся оба поддерева.

Логика выбора ветки по первому элементу массива удаляется.

## Тесты И Фикстуры

Нужно добавить XML-фикстуры для смешанного случая:

- XML-фикстура с одним реквизитом, где в `<Columns>` есть и `<Column>`, и `<AdditionalColumns>`;
- TS-фикстура ожидаемой модели с `columns` и `additionalColumns`.

Нужно покрыть:

- XML import смешанного случая;
- XML export смешанного случая;
- YAML import с новым ключом `ДополнительныеКолонки`;
- YAML export с новым ключом `ДополнительныеКолонки`;
- graph-тест, где один реквизит создаёт и `FORM_COLUMN`, и `TABLE_EXTENSION`/`ADDITIONAL_COLUMN`.

## Вне Границ

Эта работа не чинит unrelated round-trip diffs по `CommandInterface`, `Chart Settings` или `DataSetFieldNestedDataSet`.

Эта работа не добавляет поддержку старого YAML-представления дополнительных колонок внутри `Колонки`.

Эта работа не меняет общие правила fromXML/toXML/fromYAML/toYAML вне `FormAttribute`, если это не требуется для двух отдельных полей.
