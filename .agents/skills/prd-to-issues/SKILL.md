---
name: prd-to-issues
description: Break a PRD into independently-grabbable GitHub issues using tracer-bullet vertical slices. Use when user wants to convert a PRD to issues, create implementation tickets, or break down a PRD into work items.
---

# PRD to Issues

Break a PRD into independently-grabbable GitHub issues using vertical slices (tracer bullets).

**Output language:** Write every user-facing artifact in **Russian**: slice titles and descriptions, GitHub issue titles and bodies, acceptance criteria, and the quiz questions you ask the user. Keep this skill file’s procedural English as-is.

## Process

### 1. Locate the PRD

Ask the user for the PRD GitHub issue number (or URL).

If the PRD is not already in your context window, fetch it with `gh issue view <number>` (with comments).

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list **in Russian**. For each slice, show:

- **Заголовок**: короткое описательное имя
- **Тип**: HITL / AFK
- **Заблокировано**: какие другие срезы (если есть) должны завершиться раньше
- **Покрытые user story**: какие user story из PRD закрывает этот срез

Ask the user **in Russian**:

- Устраивает ли детализация? (слишком крупно / слишком мелко)
- Верны ли зависимости между срезами?
- Нужно ли объединить или разбить какие-то срезы?
- Правильно ли отмечены HITL и AFK?

Iterate until the user approves the breakdown.

### 5. Create the GitHub issues

For each approved slice, create a GitHub issue using `gh issue create`. Use the issue body template below (section headings and content **in Russian**).

Create issues in dependency order (blockers first) so you can reference real issue numbers in the "Заблокировано" field.

<issue-template>
## Родительский PRD

#<номер-issue-prd>

## Что сделать

Краткое описание этого вертикального среза. Опишите сквозное поведение end-to-end, а не реализацию по слоям. Ссылайтесь на конкретные разделы родительского PRD вместо дублирования текста.

## Критерии приёмки

- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Критерий 3

## Заблокировано

- Заблокировано #<номер-issue> (если есть)

Или «Нет — можно начинать сразу», если блокеров нет.

## Покрытые user story

Ссылки по номерам из родительского PRD:

- User story 3
- User story 7

</issue-template>

Do NOT close or modify the parent PRD issue.
