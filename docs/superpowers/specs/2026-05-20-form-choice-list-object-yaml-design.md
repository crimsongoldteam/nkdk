# Объектный YAML для FormChoiceListDesTimeValue

## Контекст

`round-trip-yaml --triage --batch-size 5 --start-index 6` показал, что `ChoiceParameters` теряет XML-обертку `FormChoiceListDesTimeValue`.

Исходный XML:

```xml
<app:value xsi:type="FormChoiceListDesTimeValue">
  <Presentation/>
  <Value xsi:type="xs:boolean">false</Value>
</app:value>
```

После цикла XML -> YAML -> XML:

```xml
<app:value xsi:type="xs:string">Ложь()</app:value>
```

Причина в компактном YAML-представлении `FormChoiceListDesTimeValue`: значение `Ложь()` выглядит как строковая формула и при обратном чтении может быть восстановлено не как обертка выбора, а как обычная строка. Та же проблема видна для `Истина()`.

## Решение

Для всех `MetadataValue` с типом `formChoiceListDesTimeValue` YAML-контракт становится только объектным:

```yaml
Представление: ""
Значение: Ложь
```

Для многоязычного представления:

```yaml
Представление:
  ru: Не помечен на удаление
Значение: Ложь
```

Компактный вид вроде `Ложь()`, `Истина()` или `"abc"(текст)` больше не является поддерживаемым контрактом. Обратная совместимость с ним не требуется.

## Границы

- Меняется общий слой `packages/core/metadata/commonObjects/metadataValue/formChoiceList`.
- `exportFormChoiceListToYAML` всегда возвращает объект с ключами `Представление` и, если значение присутствует, `Значение`.
- `importFormChoiceListFromYAML` принимает объектный вид как основной контракт.
- Эвристика общего `MetadataValue` не должна превращать объектный `FormChoiceListDesTimeValue` в строковый `MetadataValue`.
- `ChoiceParameters` не получает собственного частного формата: он использует общий `MetadataValue`-контракт.

## Пустое значение

Если XML содержит `FormChoiceListDesTimeValue` без `Value`, с пустым `Value` или с nil-значением, YAML остается объектом. Ключ `Значение` отсутствует, когда доменное `value` отсутствует:

```yaml
Представление: ""
```

Это сохраняет различие между отсутствующим значением выбора и строкой с пустым текстом.

## Ошибки и валидация

Если при импорте YAML для `FormChoiceListDesTimeValue` приходит не объект, это больше не штатный формат. Тесты должны фиксировать новый контракт, а старые проверки компактного вида нужно удалить или заменить.

## Проверки

Нужны точечные тесты:

- `metadataValue/formChoiceList/toYAML`: boolean-значение экспортируется объектом.
- `metadataValue/formChoiceList/fromYAML`: объект с `Представление` и `Значение` восстанавливает `formChoiceListDesTimeValue`.
- `сhoiceParameters/fromYAML` и `toYAML`: параметры выбора с boolean-значениями проходят через общий объектный формат.
- Форма с `ChoiceParameters`: YAML round-trip сохраняет XML-обертку `FormChoiceListDesTimeValue`.

После реализации нужно запустить focused Vitest для затронутых модулей и `round-trip-yaml --triage --batch-size 5`, чтобы первые расхождения по `FormChoiceListDesTimeValue` ушли.
