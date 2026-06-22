# Явная YAML-форма ЗначениеСпискаВыбора в FixedArray

## Контекст

В полном round-trip `XML -> YAML -> XML` для `acc` осталось 43 расхождения одного класса:
элементы `<v8:Value xsi:type="FormChoiceListDesTimeValue">` внутри
`<Value xsi:type="v8:FixedArray">` экспортируются в YAML как обычные значения.
При обратном импорте YAML уже не содержит признака обертки `FormChoiceListDesTimeValue`,
поэтому XML восстанавливается как прямые `xr:DesignTimeRef` или `xs:string`.

Проблема находится в YAML-договоре `FixedArray`: краткая форма удобна, но необратима
для элементов списка выбора формы.

## Цель

Сделать YAML для `FormChoiceListDesTimeValue` внутри `FixedArray` обратимым,
не переводя все обычные элементы массива на полную форму.

## Договор YAML

Обычные элементы `FixedArray` остаются в текущей краткой форме:

```yaml
- Перечисление.ТипыДоговоров.СПоставщиком
```

Если элемент массива в модели имеет тип `formChoiceListDesTimeValue`, он экспортируется
явно:

```yaml
- Тип: ЗначениеСпискаВыбора
  Значение: Перечисление.ТипыДоговоров.СПоставщиком
```

Если у элемента есть представление, оно сохраняется тем же YAML-полем, что и для
обычного `FormChoiceListDesTimeValue`:

```yaml
- Тип: ЗначениеСпискаВыбора
  Представление: Поставщик
  Значение: Перечисление.ТипыДоговоров.СПоставщиком
```

Поле `Тип: ЗначениеСпискаВыбора` применяется только к явной форме элемента массива.
Оно не меняет краткий YAML для обычных ссылок, строк, чисел, булевых значений и `nil`.

## Импорт

`fromYAML` для `FixedArray` должен распознавать объект с
`Тип: ЗначениеСпискаВыбора` и собирать из него модель:

```ts
{
  type: "formChoiceListDesTimeValue",
  presentation?: I8nText,
  value?: MetadataTypedValue
}
```

`Представление` импортируется по текущим правилам `I8nText`.
`Значение` импортируется через существующий импорт значения списка выбора, чтобы сохранить
особые случаи вроде строк, ссылок и явных перечислений.

Если `Значение` отсутствует, модель должна оставаться валидным
`formChoiceListDesTimeValue` без внутреннего значения.

## Экспорт

`toYAML` для `FixedArray` больше не должен разворачивать
`formChoiceListDesTimeValue` без `Представление` до внутреннего значения.
Вместо этого он всегда пишет явный объект с `Тип: ЗначениеСпискаВыбора`.

Для обычных элементов массива текущий экспорт не меняется.

## XML-эффект

После обратного YAML-импорта `toXML` должен восстановить исходную обертку:

```xml
<v8:Value xsi:type="FormChoiceListDesTimeValue">
  <Presentation/>
  <Value xsi:type="xr:DesignTimeRef">...</Value>
</v8:Value>
```

Это устраняет текущую потерю `xsi:type="FormChoiceListDesTimeValue"` внутри
`v8:FixedArray`.

## Тестирование

Нужно покрыть:

- `fixedArray/toYAML`: элементы `formChoiceListDesTimeValue` экспортируются с
  `Тип: ЗначениеСпискаВыбора`.
- `fixedArray/fromYAML`: явная форма импортируется обратно в
  `formChoiceListDesTimeValue`.
- `choiceParameters` или соседний сценарий: вложенная структура
  `FormChoiceListDesTimeValue -> FixedArray -> FormChoiceListDesTimeValue[]`
  сохраняет обертки.
- Полный `pnpm test` перед закрытием работы.
- Диагностический `round-trip-yaml` на `/Users/nikita/git/round-trip/acc`:
  первая пачка с потерей `FormChoiceListDesTimeValue` внутри `FixedArray` должна исчезнуть.

## Не входит в задачу

- Не переводить все элементы `FixedArray` на полную форму.
- Не менять XML-фикстуры.
- Не менять общий XML-договор `FormChoiceListDesTimeValue`.
- Не чинить другие классы оставшихся round-trip diff в этой задаче.
