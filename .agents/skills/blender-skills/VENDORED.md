# Vendored: blender-skills

Source: https://github.com/arjun988/blender-skills (MIT)
Commit: 904f095d8f36a6e72adaebb08d07f884a074743d
Copied: 2026-11-17 as a whole pack.
Excluded: .git, site/ (the pack's docs website), .cursor/ (a duplicate of .claude/skills for Cursor).
Read-only vendor copy. Update by re-cloning and re-copying, then bumping the commit line.

Notes for this AIOS:
- The pack expects Blender MCP (a running Blender desktop app with the BlenderMCP add-on). Cloud
  sessions here have no Blender app: we drive Blender headless with the `bpy` module and Python
  scripts (see 3d-walkthrough). Use the pack's skills as craft references (modeling, materials,
  lighting, archviz, vehicles, vegetation, set dressing, realism), and do the work in bpy.
- The pack's own `.mcp.json` is a Windows config and is not loaded from this subfolder.
