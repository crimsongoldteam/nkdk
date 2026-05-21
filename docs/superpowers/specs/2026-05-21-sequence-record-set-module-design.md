# Sequence Record Set Module Design

## Контекст

`round-trip-yaml` показывает потерю файлов:
`Sequences/<Последовательность>/Ext/RecordSetModule.bsl`.

У регистров модуль набора записей уже описан явным свойством `recordSetModule` типа `Module`.
У `MetadataSequenceRules` такого свойства нет, хотя последовательность имеет generated type
`SequenceRecordSet` и может иметь внешний `RecordSetModule`.

## Решение

Добавить в `MetadataSequenceRules` явное свойство:

```ts
recordSetModule: {
  type: "Module",
  nkdkPath: "МодульНабораЗаписей.bsl",
  xmlPath: "Ext/RecordSetModule.bsl",
  toXML: false,
  fromXML: false,
}
```

Это сохраняет поведение в одном стиле с регистрами.
После общей поддержки `.bin` в типе `Module` последовательности автоматически смогут хранить
`МодульНабораЗаписей.bin` как зашифрованную альтернативу.

## YAML-Контракт

Модуль набора записей последовательности хранится в корне YAML-каталога объекта:

```text
Последовательность/<Имя>/
  МодульНабораЗаписей.bsl
```

Файл восстанавливается в:
`Sequences/<Имя>/Ext/RecordSetModule.bsl`.

## Тестирование

Sync-фикстура `MetadataSequence` должна содержать `Ext/RecordSetModule.bsl`.

Проверки:

- convertFromXML копирует файл в `МодульНабораЗаписей.bsl`;
- syncToXML восстанавливает `Ext/RecordSetModule.bsl`;
- файл входит в ожидаемый список syncToXML.

## Вне Границ

Этот пункт не меняет модельные свойства последовательности и не добавляет ручные fromXML/toXML
правила. Поддержка `.bin` для модулей описана отдельным решением общего типа `Module`.
