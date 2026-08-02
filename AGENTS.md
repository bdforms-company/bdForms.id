<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Documentation Workflow
Whenever a change is made to the codebase (features, refactoring, or infrastructure updates):
1. **Update `docs/05-changelog.md`:** Record the specific changes made.
2. **Update Master Docs:** After changes are stable, update `docs/MASTER_ARCHITECTURE.md` and `docs/DATABASE_MASTER.sql` to ensure they reflect the current system state.
3. **Consistency:** Never delete old documentation; move it to `docs/archive/` if it becomes obsolete.
