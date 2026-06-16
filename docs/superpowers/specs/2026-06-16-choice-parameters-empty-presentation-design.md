# ChoiceParameters empty presentation YAML

## Контекст

ERP YAML содержит группу ошибок валидации `Expected union value`, где диагностируется строка `Представление: ""` внутри `ПараметрыВыбора`.

Пример:

```yaml
ПараметрыВыбора:
  Отбор.ТипДоговора:
    Представление: ""
    Значение:
      - Представление: ""
        Значение: Перечисление.ТипыДоговоров.СПоставщиком
```

Источник примера:

`/home/nikita/git/temp-yaml/Документ/ВводОстатков/Формы/ФормаРасчетыСПартнерами/Форма.yaml:451`

Желаемый YAML не должен хранить пустое представление:

```yaml
ПараметрыВыбора:
  Отбор.ТипДоговора:
    Значение:
      - Перечисление.ТипыДоговоров.СПоставщиком
```

## Цель

Сделать пустое XML-представление `FormChoiceListDesTimeValue` неявным в YAML:

- `<Presentation/>` не превращается в `Представление: ""`;
- отсутствие `Представление` в YAML означает пустое XML `<Presentation/>`;
- элементы коллекции с пустым представлением экспортируются как простые значения;
- непустое представление продолжает храниться явно.

## TS-модель

Текущая модель остаётся достаточной:

```ts
export interface MetadataFormChoiceListValue {
  type: "formChoiceListDesTimeValue"
  presentation?: I8nText
  value?: MetadataTypedValue
}
```

Семантика поля:

- `presentation === undefined` означает пустое XML `<Presentation/>`;
- пустое XML `<Presentation/>` не должно становиться `presentation: { items: { ru: "" } }`;
- пустое представление не пишется в YAML;
- `presentation` задаётся только для фактического непустого `Presentation`;
- `toXML` при отсутствии `presentation` всегда пишет `<Presentation/>`.

## YAML-контракт

`formChoiceListDesTimeValue` получает сокращённую форму:

```yaml
Значение: Перечисление.ТипыДоговоров.СПоставщиком
```

Такая форма эквивалентна модели:

```ts
{
  type: "formChoiceListDesTimeValue",
  value: { type: "ref", value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком" },
}
```

Если представление непустое, YAML остаётся объектным:

```yaml
Представление: Физическое лицо
Значение: "\"ФЛ\""
```

Для массивов `fixedArray` внутри `ПараметрыВыбора` применяется та же нормализация: элемент без непустого `presentation` экспортируется как простое значение, а не как объект `Представление/Значение`.

## Архитектура

Исправление должно жить в общем `metadataValue/formChoiceList`, а не в специальной логике `ChoiceParameters`.

Причина: `ChoiceParameters` сейчас корректно делегирует значения в `MetadataValue`. Проблема в YAML-представлении `formChoiceListDesTimeValue`, которое всегда пишет `Представление`, даже когда модель не содержит `presentation`.

Ожидаемое поведение:

- `fromXML`: `<Presentation/>` импортируется как `presentation: undefined`;
- `toYAML`: если `presentation` отсутствует, поле `Представление` не пишется;
- `fromYAML`: объект `{ Значение: ... }` импортируется как `formChoiceListDesTimeValue`;
- `toXML`: отсутствие `presentation` экспортируется как `<Presentation/>`.

## Границы

Входит в задачу:

- изменить YAML-импорт и YAML-экспорт `formChoiceListDesTimeValue`;
- обновить тесты `metadataValue/formChoiceList`;
- обновить тесты `сhoiceParameters`, чтобы пустое представление исчезло из YAML;
- покрыть вложенный массив из ERP-примера.

Не входит в задачу:

- менять XML-фикстуры;
- менять TS-модель `MetadataFormChoiceListValue`;
- менять формат непустого `Представление`;
- решать отдельные ошибки `Color auto` и пустые `ChoiceParameters` со значением `null`.

## Тестирование

Точечные тесты:

- `formChoiceList` экспортирует значение без `presentation` как `{ Значение: ... }`;
- `formChoiceList` импортирует `{ Значение: ... }` с `presentation: undefined`;
- `ChoiceParameters` экспортирует одиночный `formChoiceListDesTimeValue` без `Представление`;
- `ChoiceParameters` экспортирует `fixedArray` из `formChoiceListDesTimeValue` как список простых значений;
- JSON Schema принимает целевой YAML для ERP-примера.

Итоговая проверка:

- точечные vitest-тесты для `metadataValue/formChoiceList` и `сhoiceParameters`;
- полный `pnpm test`;
- повторная валидация ERP должна убрать подгруппу ошибок, связанную с `Представление: ""` в `ПараметрыВыбора`.

## Риски

Изменение касается всех YAML-мест, где используется `formChoiceListDesTimeValue`, а не только `ПараметрыВыбора`. Это ожидаемо: пустое `Presentation` является XML-деталью и не должно шуметь в YAML.

Риск обратной совместимости: старый YAML с `Представление: ""` должен продолжать импортироваться. Меняется только новый экспорт и JSON Schema для целевого компактного формата.
