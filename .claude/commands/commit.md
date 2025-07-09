If something is git staged, analyse the staged changes and create a commit with a meaningful message following Conventional Commits format. If nothing is staged, analyse all unstaged changes, stage them and commit with an equivalent message.

Steps:
1. Run `git status` to see all staged and unstaged changes
2. If there are no changes at all, you are done; nothing needs to be committed.
3. If there are only unstaged changes, run `git add .`; do not do this if there already are staged changes!
4. Run `git diff --cached` to ingest the actual changes to be made
5. Run `git log --oneline -5` to see recent commit message patterns
6. Analyze the changes to determine the appropriate Conventional Commits type:
   - feat: new features or functionality
   - fix: bug fixes
   - docs: documentation changes
   - style: formatting, whitespace, missing semicolons
   - refactor: code restructuring without changing functionality
   - test: adding or updating tests
   - chore: maintenance tasks, dependencies, build config
   - build: build system or external dependencies
   - ci: continuous integration changes
7. Generate a concise, descriptive commit message in format: `type(scope): description`
8. Create commit with the generated message
9.  Add the `Claude Code <claude@simonshine.dk>` co-authorship footer

The commit message should be:
- Clear and descriptive, and not just a single header
- Follow the established pattern from recent commits
- Accurately reflect the nature and scope of changes
- Include appropriate scope if relevant (e.g., client, server, api)