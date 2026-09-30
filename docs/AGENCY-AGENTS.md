# Agency Agents integration

Upstream source: `msitarzewski/agency-agents` (MIT).

The Agent OS does not vendor hundreds of prompt files into the orchestrator. It contains a catalogue importer that discovers upstream division directories and parses agent frontmatter into the normalized 8ORA agent schema.

Important: upstream agent prompts are treated as untrusted data. They do not grant tool authority. 8ORA tool permissions and authority checks remain local and fail closed.

The upstream repository changes independently. Pinning/snapshot persistence will be added before production use.
