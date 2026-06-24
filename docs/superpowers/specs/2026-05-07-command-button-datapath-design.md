# DataPath у командных кнопок

## Цель

Сохранить XML-узел `DataPath` у кнопок командной панели при импорте и экспорте формы.
Первичный пример покрывает фикстура `packages/core/metadata/forms/elements/button/__fixtures__/withDataPath.xml`.

## Границы

В работу входит только свойство `DataPath` для элементов `Button` / `CommandBarButton`.
Не входят другие текущие round-trip расхождения: `MobileDeviceCommandBarContent`, порядок `CommandInterface`, DCS `xsi:type`, настройки диаграмм и колонки реквизитов.

## Решение

Добавить свойство `dataPath` в `commonButtonProperties`:

- YAML: `Данные`
- XML: `DataPath`
- тип: `DataPath`
- fallback-тип для Enterprise: `string`

Свойство размещается рядом с `commandName`, потому что `DataPath` задает данные для команды кнопки. Добавление в общие свойства делает его доступным как для обычной `Button`, так и для `CommandBarButton`, что согласуется с текущей моделью общих свойств кнопок.

## Тестовые данные

В `packages/core/metadata/forms/elements/button/__fixtures__/data.ts` добавляется модель для `withDataPath.xml`:

- `itemType: "CommandBarButton"`
- `name: "ОбщаяКомандаКомандаСПараметром"`
- `type: "CommandBarButton"`
- `commandName: "CommonCommand.КомандаСПараметром"`
- `dataPath: "Items.ДинамическийСписок.CurrentData.Ref"`

Для YAML-ожидания используется поле `Данные` с тем же путем.

## Подключение к тестам

В `packages/core/metadata/forms/elements/__tests__/fixtures.ts` добавляется запись группы `CommandBarButton` для `withDataPath.xml`. Это включает фикстуру в общие проверки:

- `fromXML`
- `toXML`
- `fromYAML`
- `toYAML`

## Проверка

Сначала запускается узкая проверка по новой фикстуре:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "with data path"
```

После этого запускается пакетная проверка:

```bash
pnpm --filter '@nakidka/core' test
```
