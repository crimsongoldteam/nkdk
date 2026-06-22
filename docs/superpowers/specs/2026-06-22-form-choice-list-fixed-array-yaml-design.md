# FormChoiceListDesTimeValue в FixedArray YAML

## Контекст

Полный round-trip `XML -> YAML -> XML` для `/Users/nikita/git/round-trip/acc` оставляет 42 diff. Первая triage-пачка показывает один повторяющийся тип расхождения: внутри `v8:FixedArray` элементы `FormChoiceListDesTimeValue` с пустым `Presentation` превращаются в простые `v8:Value`.

Пример XML-diff:

```diff
- <v8:Value xsi:type="FormChoiceListDesTimeValue">
-   <Presentation/>
-   <Value xsi:type="xr:DesignTimeRef">Enum.ВидыПродукцииСАТУРН.EnumValue.Агрохимикат</Value>
- </v8:Value>
+ <v8:Value xsi:type="xr:DesignTimeRef">Enum.ВидыПродукцииСАТУРН.EnumValue.Агрохимикат</v8:Value>
```

Причина в `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`: текущий YAML-экспорт специально сокращает `formChoiceListDesTimeValue` без `presentation` до вложенного значения. При обратном импорте YAML это значение распознается как обычный `ref`, `string` или другой примитив, и модель теряет тип `formChoiceListDesTimeValue`.

## Решение

YAML-договор для `formChoiceListDesTimeValue` должен быть обратимым: значение всегда экспортируется объектом через ключ `Значение`, даже если `Представление` отсутствует.

Было:

```yaml
- Перечисление.ВидыПродукцииСАТУРН.Агрохимикат
- Перечисление.ВидыПродукцииСАТУРН.Пестицид
```

Станет:

```yaml
- Значение: Перечисление.ВидыПродукцииСАТУРН.Агрохимикат
- Значение: Перечисление.ВидыПродукцииСАТУРН.Пестицид
```

Если у элемента есть представление, оно остается рядом:

```yaml
- Представление: Агрохимикат
  Значение: Перечисление.ВидыПродукцииСАТУРН.Агрохимикат
```

Новый YAML-синтаксис не вводится. Для вложенного `Значение` сохраняется существующее поведение `exportMetadataValueToYAML`, включая текущую обработку неоднозначных строк.

## Границы

В границы входит:

- убрать специальное сокращение `formChoiceListDesTimeValue` из `fixedArray/toYAML.ts`;
- оставить `formChoiceList/toYAML.ts` ответственным за объектную форму `{ Значение, Представление? }`;
- обновить существующие YAML-ожидания для `formChoiceRefsFixedArray`;
- добавить или расширить тест, который проверяет обратимость `fixedArray` с элементами `formChoiceListDesTimeValue` через YAML и XML.

В границы не входит:

- изменение XML-фикстур;
- добавление новых правил `rules.ts`;
- изменение формата обычных `fixedArray` из примитивов и ссылок;
- reference-восстановление по XML для этой ошибки.

## Поток данных

1. XML импортирует вложенный `FormChoiceListDesTimeValue` как модель:
   `{ type: "formChoiceListDesTimeValue", value: ... }`.
2. YAML экспортирует этот элемент как объект:
   `{ Значение: ... }`.
3. YAML импорт распознает объект с `Значение` как `formChoiceListDesTimeValue`.
4. XML экспорт восстанавливает обертку:
   `<v8:Value xsi:type="FormChoiceListDesTimeValue">...`.

## Обработка ошибок

Новых режимов ошибок не требуется. Если вложенное `Значение` не поддерживается существующим `MetadataValue` YAML-импортом, поведение остается прежним: ошибка должна возникать в текущих импортерах значений.

## Проверка

Минимальная проверка:

- точечные тесты `metadata/commonObjects/metadataValue/fixedArray`;
- при необходимости точечные тесты `metadata/commonObjects/metadataValue/formChoiceList`;
- диагностический `round-trip-yaml` для `/Users/nikita/git/round-trip/acc`, чтобы подтвердить исчезновение diff'ов с потерей `FormChoiceListDesTimeValue`.

Полный `pnpm test` нужен перед закрытием реализации, но не на этапе диагностики или написания spec.
