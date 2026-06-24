# Document And Information Register Modules

## Контекст

После `round-trip-yaml` в diff остаётся большая группа удалённых BSL-модулей
прикладных объектов:

- `Documents`: 444 `ManagerModule.bsl`, 442 `ObjectModule.bsl`, 79 `CommandModule.bsl`;
- `InformationRegisters`: 985 `ManagerModule.bsl`, 506 `RecordSetModule.bsl`.

Это не связано с модулями форм. Дочерние формы уже сохраняют
`Forms/<Форма>/Ext/Form/Module.bsl`, а общие формы разбираются отдельным дизайном
`2026-05-20-common-form-module-rule-design.md`.

Причина для документов и регистров сведений похожа: соответствующие внешние BSL-файлы
есть в XML, но не описаны в `rules.ts`, поэтому оркестратор не вызывает существующие
`Module.syncExternalFromXML` / `Module.syncExternalToXML`. YAML-файлы модулей не
создаются, а при обратном `sync` XML-файлы удаляются финальной очисткой как
неожидаемые.

## Решение

Используем существующий декларативный механизм `Module` без новой логики копирования.

### Documents

В `MetadataDocumentRules` добавить свойства:

```ts
objectModule: {
  type: "Module",
  nkdkPath: "МодульОбъекта.bsl",
  xmlPath: "Ext/ObjectModule.bsl",
  toXML: false,
  fromXML: false,
},
managerModule: {
  type: "Module",
  nkdkPath: "МодульМенеджера.bsl",
  xmlPath: "Ext/ManagerModule.bsl",
  toXML: false,
  fromXML: false,
},
```

Также добавить специализированное правило команд документа по аналогии с регистрами:

```ts
const MetadataDocumentCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
```

И подключить обход команд:

```ts
childCollections: [{ propertyKey: "commands", itemRule: MetadataDocumentCommandRules }]
```

### InformationRegisters

В `MetadataInformationRegisterRules` добавить свойства:

```ts
recordSetModule: {
  type: "Module",
  nkdkPath: "МодульНабораЗаписей.bsl",
  xmlPath: "Ext/RecordSetModule.bsl",
  toXML: false,
  fromXML: false,
},
managerModule: {
  type: "Module",
  nkdkPath: "МодульМенеджера.bsl",
  xmlPath: "Ext/ManagerModule.bsl",
  toXML: false,
  fromXML: false,
},
```

## Поток данных

При XML -> YAML `convertAppliedObjectFromXML` обходит свойства правила и вызывает
`Module.syncExternalFromXML`. Файлы должны появиться рядом с `Свойства.yaml`:

- `Документ/<Имя>/МодульОбъекта.bsl`;
- `Документ/<Имя>/МодульМенеджера.bsl`;
- `Документ/<Имя>/Команды/<ИмяКоманды>/МодульКоманды.bsl`;
- `РегистрСведений/<Имя>/МодульНабораЗаписей.bsl`;
- `РегистрСведений/<Имя>/МодульМенеджера.bsl`.

При YAML -> XML `syncAppliedObjectToXML` вызывает `Module.syncExternalToXML`, копирует
эти файлы обратно в `Ext/*Module.bsl` и добавляет их в `xmlManifest`, чтобы финальная
очистка не удаляла восстановленные модули.

## Границы

В рамках этой задачи не меняем:

- существующие XML-фикстуры;
- общий обработчик `Module`;
- обработку модулей форм;
- другие прикладные объекты, где модули уже описаны в правилах.

## Проверка

Нужны focused sync-тесты, потому что ошибка проявляется именно на файловом
round-trip и финальной очистке:

- `MetadataDocument` XML -> YAML: импорт создаёт `МодульОбъекта.bsl`,
  `МодульМенеджера.bsl` и `Команды/<Команда>/МодульКоманды.bsl`;
- `MetadataDocument` YAML -> XML через `syncAppliedObjectToXML`: восстанавливает
  `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Commands/<Команда>/Ext/CommandModule.bsl`;
- `MetadataDocument` sync-тест проверяет, что эти `.bsl` есть в
  `xmlManifest.expectedFiles()`;
- `MetadataInformationRegister` XML -> YAML: импорт создаёт
  `МодульНабораЗаписей.bsl` и `МодульМенеджера.bsl`;
- `MetadataInformationRegister` YAML -> XML через `syncAppliedObjectToXML`:
  восстанавливает `Ext/RecordSetModule.bsl` и `Ext/ManagerModule.bsl`;
- `MetadataInformationRegister` sync-тест проверяет, что эти `.bsl` есть в
  `xmlManifest.expectedFiles()`.

После реализации повторить focused-тесты для этих объектов и
`round-trip-yaml --triage --batch-size 5 --start-index 6`, чтобы подтвердить, что
диффы по этим объектным модулям ушли из текущей пачки или сместились ниже.
