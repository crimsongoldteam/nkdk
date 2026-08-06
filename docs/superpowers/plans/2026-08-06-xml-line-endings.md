# XML Line Endings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Хранить и выдавать все отслеживаемые XML-файлы NKDK с окончаниями строк LF.

**Architecture:** Корневой `.gitattributes` задаёт `eol=lf` только для `*.xml`. Существующие XML механически нормализуются без изменения их содержимого.

**Tech Stack:** Git attributes, PowerShell, pnpm.

## Global Constraints

- Не изменять XML-содержимое, кодировку и пробелы внутри строк.
- Не задавать правила окончаний строк для файлов, отличных от XML.
- Выполнять изменение в изолированной рабочей копии.

---

### Task 1: Нормализовать XML

**Files:**
- Create: `.gitattributes`
- Modify: все отслеживаемые `*.xml` только заменой CRLF/смешанных окончаний на LF

**Interfaces:**
- Consumes: Git clean/smudge filters и текущие XML-файлы.
- Produces: правило `*.xml text eol=lf` и единообразные XML.

- [ ] **Step 1: Зафиксировать исходное распределение окончаний строк**

Run: `git ls-files --eol -- "*.xml"`

- [ ] **Step 2: Добавить правило Git attributes**

```gitattributes
*.xml text eol=lf
```

- [ ] **Step 3: Механически заменить CRLF и одиночные CR в отслеживаемых XML на LF**

Обрабатывать только пути из `git ls-files -z -- "*.xml"`; читать и записывать байты без перекодирования.

- [ ] **Step 4: Нормализовать индекс и проверить окончания строк**

Run: `git add --renormalize -- "*.xml" && git ls-files --eol -- "*.xml"`

Expected: у всех строк `i/lf w/lf`; отсутствуют `i/crlf`, `i/mixed`, `w/crlf`, `w/mixed`.

- [ ] **Step 5: Проверить отсутствие содержательных изменений**

Run: сравнить XML до и после после замены `CRLF`/`CR` на `LF`; различий быть не должно.

- [ ] **Step 6: Запустить проверки проекта**

Run: `pnpm test`

Run: `pnpm duplicates -- --base 95ec6424bc9002a6a3fb7be545e80fbf521b9904`

- [ ] **Step 7: Создать отдельный коммит**

```text
chore: :wrench: унифицировать окончания строк XML
```
