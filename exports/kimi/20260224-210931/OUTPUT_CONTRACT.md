# OUTPUT CONTRACT

## Required Deliverables

1. `PATCH.diff`
2. `CHANGE_REPORT.md`
3. `COMMAND_LOG.md`

## Patch Rules

- Must be unified diff format
- Must be apply-able via `git apply`
- Must not include binary payloads
- Must not modify files outside `TASK_BRIEF.md` scope

## Change Report Rules

- List all modified files
- Explain why each file changed
- List new dependencies and rationale
- List risks and rollback steps

## Command Log Rules

- Record executed commands in order
- Keep key outputs and errors
- Include final verification outputs
