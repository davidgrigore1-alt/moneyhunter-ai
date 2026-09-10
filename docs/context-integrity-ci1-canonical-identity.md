# Context Integrity CI-1 — Canonical Identity Resolution Repair

The real Meridian dataset uses legal CRM names:
- Nova Medical Systems SRL
- Vector Industrial Services SRL

The linked Drive document declares:
- Client: Vector Industrial

CI-1 must not use fuzzy matching. This repair adds a deliberately narrow,
deterministic legal-name alias rule:

1. exact normalized identity still wins;
2. otherwise alias matching is allowed only with a complete bounded tenant directory;
3. declaration must contain at least two whole tokens and eight characters;
4. those tokens must be an exact prefix of the canonical CRM name;
5. the CRM name may add at most two trailing tokens;
6. the canonical name must end in a known legal suffix (e.g. SRL, SA, Ltd, LLC);
7. exactly one tenant-local candidate must match;
8. multiple candidates => ambiguous; incomplete directory => unresolved.

Examples:
- "Vector Industrial" -> "Vector Industrial Services SRL": allowed when unique.
- "Nova Medical" -> "Nova Medical Systems SRL": allowed when unique.
- "Nova Med" -> "Nova Medical Systems SRL": rejected.
- "Vector" -> "Vector Industrial Services SRL": rejected.

No edit distance, substring contains search, embeddings, LLM resolution, or autonomous
truth selection is introduced.
