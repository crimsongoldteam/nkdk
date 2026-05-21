# Дизайн: сохранять неизвестные CommandGroup в CommandInterface

## Контекст

В полном round-trip `XML -> YAML -> XML` для формы
`Catalogs/Сотрудники/Forms/ФормаЭлемента/Ext/Form.xml` найдено расхождение:

```diff
  <Item>
    <Command>0</Command>
    <Type>Auto</Type>
-   <CommandGroup>CommandGroup.Печать</CommandGroup>
    <DefaultVisible>false</DefaultVisible>
    <Visible>
      <xr:Common>false</xr:Common>
```

В YAML для этого элемента сейчас появляется пустое поле:

```yaml
- Команда: "0"
  Тип: Auto
  Автовидимость: Ложь
  ГруппаКоманд:
  ЗапретитьИспользование: {}
```

Пользовательское решение: для неизвестных групп команд пока сохранять сырой
XML-идентификатор, например `CommandGroup.Печать`, а не вводить новое русское
имя.

## Причина

`packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
экспортирует группу через `StandardCommandsGroupToYAML[item.commandGroup]`.
Для `CommandGroup.Печать` в `StandardCommandsGroupToYAML` нет записи, поэтому
в YAML попадает `undefined`. При обратном чтении
`packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
не видит значения и не восстанавливает `commandGroup`.

## Решение

Разрешить `CommandInterfaceItem.commandGroup` и YAML-поле `ГруппаКоманд`
хранить два вида значений:

- известные платформенные группы с русским YAML-именем;
- неизвестные или пока не описанные XML-идентификаторы как строку без перевода.

Правила преобразования:

- `toYAML`: если `StandardCommandsGroupToYAML[item.commandGroup]` найден,
  писать русское имя; иначе писать исходный `item.commandGroup`.
- `fromYAML`: если значение есть в `StandardCommandsGroupFromYAML`, переводить
  в XML-идентификатор; иначе сохранять значение как есть.
- `toXML`: писать `CommandGroup` из модели без дополнительной нормализации.

## Границы

- Не добавлять `CommandGroup.Печать -> Печать` в перечисление на этом этапе.
- Не скрывать неизвестную группу в reference-only данных.
- Не менять XML-фикстуры.
- Не менять поведение уже известных групп вроде `FormNavigationPanelGoTo`.

## Проверка

- Добавить тест `toYAML`: неизвестный `commandGroup: "CommandGroup.Печать"`
  экспортируется как `ГруппаКоманд: CommandGroup.Печать`.
- Добавить тест `fromYAML`: `ГруппаКоманд: CommandGroup.Печать` возвращает
  `commandGroup: "CommandGroup.Печать"`.
- Проверить, что существующие тесты для известных групп команд не меняют
  ожидаемый YAML.
- После исправления проверить выбранный diff через `round-trip-yaml` single
  или triage для третьего расхождения.
