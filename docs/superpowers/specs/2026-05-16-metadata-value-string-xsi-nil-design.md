# MetadataValue: строковый `xsi:nil`

## Контекст

`round-trip.sh --triage --all-configs --batch-size 5` останавливается до получения diff'ов на конфигурации `acc`.
Падение происходит при импорте формы `Catalogs/ОтветственныеЗаАктуализациюТокеновАвторизацииИСМП/ФормаЭлемента`.

В XML внутри `ChoiceList` есть значение:

```xml
<Value xsi:nil="true"/>
```

`importMetadataValueFromXML` сейчас считает пустым значением только `{ "_xsi:nil": true }`.
В данном пути парсер сохраняет атрибут как строку `{ "_xsi:nil": "true" }`, поэтому импорт не распознает пустое значение, пытается найти `_xsi:type` и падает с ошибкой `MetadataValue: не распознан тип: undefined`.

## Цель

Разблокировать triage round-trip по всем конфигурациям, не меняя модель данных и не расширяя поведение за пределы `MetadataValue`.

## Выбранный подход

Точечно расширить проверку `xsi:nil` в `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`.
Пустым значением считаются оба представления:

- `{ "_xsi:nil": true }`
- `{ "_xsi:nil": "true" }`

Для обычного импорта результат остается `undefined`.
Для импорта reference-данных сохраняется исходный nil-узел, как и раньше.

## Границы

В рамках этой правки не меняются:

- правила `rules.ts`;
- XML-фикстуры из внешнего репозитория;
- YAML-поведение;
- обработка других типов `MetadataValue`;
- общий механизм XML-парсера.

## Тестирование

Добавить точечный тест в `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`, который явно передает `{ "_xsi:nil": "true" }` и ожидает `undefined`.

Проверка после правки:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts
./.agents/skills/round-trip-xml/round-trip.sh --triage --all-configs --batch-size 5
```

Успех: первый тест зеленый, а triage больше не падает на `MetadataValue: не распознан тип: undefined` для пустого значения `ChoiceList`.
