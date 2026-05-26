@AGENTS.md

## Non-interactive Claude configuration

The project is configured to run Claude in non-interactive mode. Settings applied:

- `/.claude/settings.local.json`: permissions set to allow all actions and `nonInteractive` + `autoApprove` enabled.
- `/NFProjects/.claude/settings.json`: `nonInteractive` + `autoApprove` enabled for the project scope.

If you need to revert interactive prompts, edit those files and remove or change the `nonInteractive` and `autoApprove` flags or restrict the `permissions.allow` list.
