# CommandInterface Attribute DataPath

## Контекст

Round-trip форм теряет узел `Attribute` внутри элементов командного интерфейса:

```xml
<Item>
	<Command>InformationRegister.СчетаУчетаРасчетовСКонтрагентами.StandardCommand.OpenByValue.Контрагент</Command>
	<Type>Added</Type>
	<Attribute>Объект.Ref</Attribute>
	<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
	<DefaultVisible>false</DefaultVisible>
</Item>
```

Сейчас `CommandInterfaceItemXML` и модель `CommandInterfaceItem` не содержат это поле. Поэтому `fromXML` его отбрасывает, а `toXML` уже не может восстановить исходный XML.

## Цель

Сохранить `Attribute` в `packages/core/metadata/forms/commonObjects/commandInterface` во всех поддерживаемых представлениях:

- XML: тег `Attribute`;
- TS-модель: поле `attribute`;
- YAML: ключ `Реквизит`.

## Модель

`CommandInterfaceItem.attribute` должен иметь тип `DataPath` из `packages/core/metadata/forms/commonObjects/dataPath/types.ts`.

Причина: значение `Attribute` является путём к данным формы, например `Объект.Ref` или `РегистрацияВНалоговомОргане.Owner`, и должно участвовать в том же договоре типов, что и другие `DataPath`-поля форм.

## XML

`CommandInterfaceItemXML` получает опциональное поле:

```ts
Attribute?: DataPathXML
```

Импорт XML переносит `Attribute` в `attribute` без дополнительной нормализации.

Экспорт XML возвращает `attribute` в `Attribute`. При наличии reference-данных порядок узлов сохраняется по исходному XML, как уже работает для остальных полей `CommandInterfaceItem`.

Fallback-порядок без reference-данных:

1. `Command`
2. `Type`
3. `Attribute`
4. `Index`
5. `DefaultVisible`
6. `CommandGroup`
7. `Visible`

Такой порядок соответствует найденным XML-diff: `Attribute` находится после `Type` и до `CommandGroup`.

## YAML

`CommandInterfaceItemYAML` получает опциональный ключ:

```ts
Реквизит?: DataPathYAML
```

`fromYAML` переносит `Реквизит` в `attribute`, `toYAML` экспортирует `attribute` обратно в `Реквизит`.

YAML-порядок в `fullCommandInterfaceYAML` должен быть:

1. `Команда`
2. `Тип`
3. `Реквизит`
4. `Индекс`
5. `ГруппаКоманд`
6. `Автовидимость`
7. `РазрешитьИспользование` / `ЗапретитьИспользование`

## Фикстуры и тесты

Нужно дополнить связанные существующие фикстуры `CommandInterface`, а не добавлять только изолированный пример:

- `__fixtures__/full.xml` получает `Attribute` у одного элемента `NavigationPanel`;
- `__fixtures__/full.ts` получает `attribute` в соответствующем `fullCommandInterface`;
- `fullCommandInterfaceYAML` получает `Реквизит` в соответствующем элементе.

Существующие тесты должны начать покрывать новое поле без отдельных тест-блоков:

- `fromXML.test.ts` — `should import full command interface`;
- `toXML.test.ts` — `should export full command interface`;
- `fromYAML.test.ts` — `should import full command interface`;
- `toYAML.test.ts` — `should export full command interface`.

Если порядок fallback без reference-данных уже проверяется отдельным тестом, его нужно расширить ожиданием `Attribute` между `Type` и `Index`.

## Не входит

- Не добавлять новую доменную модель для `Attribute`: это не объект команды, а путь к данным.
- Не менять существующую логику поиска reference-item.
- Не добавлять YAML-поведение за пределами `CommandInterface`.
- Не чинить соседние round-trip проблемы из текущей triage-пачки: `Planner`, `dcscor:value xsi:nil`, неподдержанные DCS-типы.
