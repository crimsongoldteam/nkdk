# SettingsParameterValue Nil Reference Preserve

## Контекст

Round-trip форм теряет явный nil-узел в DCS appearance:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>Текст</dcscor:parameter>
	<dcscor:value xsi:nil="true"/>
</dcscor:item>
```

После XML -> модель -> XML узел `dcscor:value` исчезает:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>Текст</dcscor:parameter>
</dcscor:item>
```

Проблема находится в `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue` и соседнем `dcsMetadataValue`.

## Цель

Сохранять исходную XML-форму `<dcscor:value xsi:nil="true"/>` при round-trip, когда значение в YAML/TS-модели не задано явно.

Это задача про сохранение reference XML, а не про изменение публичной модели.

## Модель

Не вводить новый обязательный смысл `value: null` для `SettingsParameterValue`.

Обычная модель по-прежнему может представлять отсутствие значения как отсутствие поля `value`. Явный nil из исходного XML нужен для обратного экспорта в том же XML-виде, если пользователь не задал новое значение.

## Reference-поведение

При `context.fromXML.forReference === true` импорт `SettingsParameterValue` должен сохранять признак того, что `dcscor:value` присутствовал в XML как nil:

```xml
<dcscor:value xsi:nil="true"/>
```

Этот признак должен жить только в reference-данных и использоваться при `toXML`.

При обычном `fromXML` поведение остаётся доменным: если nil не несёт полезного значения для модели, публичный объект не обязан получать `value: null`.

## XML-экспорт

`exportParameterValueToDcsXML` должен учитывать `referenceData` для соответствующего `SettingsParameterValue`.

Если в текущих данных `value` отсутствует, но reference-элемент содержит nil-значение, экспорт должен вернуть:

```xml
<dcscor:value xsi:nil="true"/>
```

Если в текущих данных `value` задан, он имеет приоритет над reference-формой.

Если reference-элемент не содержит nil-значение, поведение остаётся прежним: `dcscor:value` не экспортируется при отсутствующем `value`.

## Сопоставление reference-элемента

Для вложенных `dcscor:item` нужно передавать reference-данные рекурсивно вместе с текущими `ParameterValue`.

Минимальное сопоставление внутри одного родителя:

- по `parameter`;
- с учётом позиции, если одинаковые `parameter` повторяются.

Это сохраняет существующий порядок и не требует менять публичную структуру `ParameterValue`.

## Фикстуры и тесты

Нужно добавить узкую XML-фикстуру для `parameterValue` или ближайшего существующего DCS-модуля, где есть `SettingsParameterValue` с nil:

- входной XML содержит `dcscor:value xsi:nil="true"`;
- обычный импорт не превращает это в новое обязательное доменное значение;
- reference-импорт + экспорт восстанавливает nil-узел.

Также нужно покрыть приоритет текущих данных:

- если `value` задан явно, экспортирует заданное значение;
- reference nil не должен перетирать явное значение.

## Не входит

- Не менять YAML-контракт для `SettingsParameterValue`.
- Не вводить обязательное `value: null` как публичный способ моделировать nil.
- Не чинить неподдержанные DCS-типы из текущего full round-trip запуска: `v8:ValueListType`, `xr:ValueList`, `dcsset:DataCompositionComparisonType`, `xs:dateTime`.
- Не менять общую обработку `MetadataValue` вне DCS parameter value.
