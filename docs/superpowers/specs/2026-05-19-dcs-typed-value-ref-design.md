# DCS typed value ref в round-trip-yaml

## Контекст

После диагностического исправления `round-trip-yaml` показывает две ошибки на стадии `YAML -> XML`:

- `MetadataCatalog "СканированныеДокументыДляПередачиВЭлектронномВиде": DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ref`
- `MetadataDocument "ЗаявлениеАбонентаСпецоператораСвязи": DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ref`

Обе ошибки относятся к значениям заполнения, которые в исходном XML представлены как `xsi:type="xr:DesignTimeRef"`, например `Catalog.Организации.EmptyRef` или `Enum.МодельХраненияЗакрытогоКлюча.EnumValue.ЛокальныйКлюч`. При экспорте в YAML они становятся человекочитаемыми ссылками вида `Справочник.Организации.ПустаяСсылка` и `Перечисление.МодельХраненияЗакрытогоКлюча.ЛокальныйКлюч`.

## Цель

Поддержать `ref` как допустимый вариант `DcsMetadataTypedValue`, чтобы DCS typed value мог пройти полный цикл:

`XML xr:DesignTimeRef -> модель ref -> YAML ссылка -> модель ref -> XML xr:DesignTimeRef`.

## Границы

XML-фикстуры не меняются.

YAML-формат не меняется: ссылки остаются строками в уже существующем формате `MetadataValue.ref`.

Не добавляется новый общий механизм сериализации. Для `ref` используется существующая логика `MetadataValue.ref`, потому что она уже умеет преобразовывать design-time ссылки между XML, моделью и YAML.

## Подход

Добавить в `DcsMetadataTypedValue` вариант:

```ts
{ type: "ref"; value: string }
```

В `DcsMetadataTypedValueRegistry` добавить обработчик `ref`, который:

- распознаёт YAML-строки, импортируемые `importMetadataValueStringFromYAML` в design-time ссылку;
- импортирует XML `xr:DesignTimeRef` через существующий `MetadataValue`-обработчик;
- экспортирует YAML через существующий `MetadataValue.ref`;
- экспортирует XML через существующий `MetadataValue.ref`, получая `xsi:type="xr:DesignTimeRef"`.

В `DcsMetadataTypedValueTypeFromXML` добавить соответствие `xr:DesignTimeRef -> ref`, чтобы импорт XML выбирал новый обработчик.

Порядок распознавания важен: `ref` должен проверяться до общего строкового варианта, иначе ссылка будет ошибочно сохранена как `string`.

## Ошибки

Если строка похожа на ссылку в YAML, но не может быть преобразована существующим механизмом `MetadataValue.ref`, поведение остаётся прежним для соседних DCS-типов: значение либо распознаётся другим обработчиком, либо падает в существующую диагностическую ошибку отсутствующего обработчика.

## Проверка

Нужны точечные тесты на DCS typed value:

- `fromXML` для `xr:DesignTimeRef` возвращает `{ type: "ref", value: ... }`;
- `toXML` для `{ type: "ref", value: ... }` возвращает `xr:DesignTimeRef`;
- `fromYAML` для `Справочник.Организации.ПустаяСсылка` возвращает `ref`;
- `toYAML` для `ref` возвращает человекочитаемую ссылку.

После точечных тестов нужно запустить `round-trip-yaml` и убедиться, что две ошибки `DcsMetadataTypedValue ... type ref` исчезли.
