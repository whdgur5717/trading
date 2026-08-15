---
name: assess-code
description: Evaluate code using reusable, user-defined design perspectives without treating examples as templates. Use when the user asks whether code conflicts with architectural or structural criteria, wants an evidence-backed assessment without automatic fixes, or explains a new code-judgment perspective that should be clarified and added to this skill's references.
---

# Assess Code

Use the documents under `references/` as perspectives for reading code. Keep the perspectives in those documents; keep this file focused on routing and assessment procedure.

## Route the request

Choose the branch that matches the user's request.

- **Assess code** — inspect code through relevant stored perspectives.
- **Add or refine a perspective** — turn the user's reasoning and examples into reusable reference material.

When a request contains both, clarify the perspective first, then assess the code with the clarified perspective.

## Assess code

1. Resolve the exact package, files, and question in scope. Follow repository-local instructions and avoid expanding into unrelated packages.
2. List the Markdown files under `references/`. Read every reference whose subject could materially affect the question. If none applies, state that the stored perspectives provide no basis for a judgment.
3. Inspect the actual code path: callers, entry points, data and control flow, ownership, dependencies, tests, and available change evidence. Separate verified facts from inference.
4. Apply each selected reference as a way to investigate the code. Treat its examples as demonstrations of reasoning, not shapes the code must copy.
5. Report the strongest evidence-backed tension first. For each finding, connect:

   ```text
   observed code
   → applicable perspective
   → point of alignment or tension
   → practical consequence
   → uncertainty or counterevidence
   ```

6. Keep diagnosis separate from redesign. Propose changes only when the user asks for them, and do not present one implementation as required unless the evidence rules out the alternatives.

Complete the assessment when every reported finding cites code evidence and a relevant reference, and unsupported concerns have been omitted.

## Add or refine a perspective

1. Treat the user's statements and examples as raw evidence of a judgment perspective. Identify what relationship, risk, or design quality makes the examples matter.
2. Restate the perspective with its evidence requirements, application range, and cases that may look similar but should be judged differently. Continue refining while the meaning remains ambiguous.
3. Read the existing references and decide placement:
   - Update an existing reference when the new material uses the same judgment basis and evidence.
   - Create a new reference when it can independently change a code assessment and requires different evidence.
4. Write the perspective for both human and AI readers. Keep the reasoning in the main text. Put concrete cases in an `Examples` section and mark their details as local to those cases.
5. Re-read the resulting reference against an unseen example and a non-violation case. Check that it supports a judgment without copying an example or forcing one redesign.

Complete the update when the reference can explain what evidence changes the judgment, where the perspective applies, and why superficially similar code may receive different assessments.
