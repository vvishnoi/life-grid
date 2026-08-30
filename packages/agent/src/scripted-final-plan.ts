// The scripted-mode equivalent of finalize-plan.ts's synthesizeFinalPlan()
// — but template-based, not a Vertex AI call, since scripted mode's whole
// point is staying free. Zero external dependencies on purpose: this needs
// to be safe to import from a client bundle (see client.ts), unlike
// scripted-demo.ts, which pulls in @google/genai.
//
// Built from the user's ACTUAL decisions. An earlier version of the
// scripted Denver scenario ended with one hardcoded "final plan" step that
// played automatically on a timer regardless of what was clicked — so it
// showed up before any approval decision existed, and always listed every
// item as approved even if the user had declined one. This replaces that:
// nothing is shown until every card is actually resolved, and a decline
// here is a decline in the output too.
export function buildScriptedFinalPlan(
  decisions: { title: string; amount: number; action: 'approve' | 'reject' }[],
  budgetCap: number
): string {
  const approved = decisions.filter((d) => d.action === 'approve');
  const declined = decisions.filter((d) => d.action === 'reject');
  const total = approved.reduce((sum, d) => sum + d.amount, 0);

  const approvedRows = approved.length
    ? approved.map((d) => `| ${d.title} | $${d.amount.toLocaleString()} |`).join('\n')
    : '| _(none — everything was declined)_ | — |';

  const declinedSection = declined.length
    ? `\n\n### Declined\n${declined
        .map((d) => `- **${d.title}** ($${d.amount.toLocaleString()}) — not booked, per your decision.`)
        .join('\n')}`
    : '';

  const budgetLine =
    total <= budgetCap
      ? `$${(budgetCap - total).toLocaleString()} under your $${budgetCap.toLocaleString()} cap`
      : `$${(total - budgetCap).toLocaleString()} over your $${budgetCap.toLocaleString()} cap`;

  return `# Trip Plan: 5-Day Denver Family Getaway

Your family trip to Denver is finalized based on what you approved.

### 1. Trip Overview
- **Destination:** Denver, Colorado
- **Dates:** September 15 – September 20 (5 days)
- **Travelers:** Family of 4
- **Special needs:** Daughter's nut allergy accounted for in all dining recommendations; lodging kept within 3 miles of downtown per your preference.

### 2. Approved Items
| Item | Cost |
| :--- | ---: |
${approvedRows}${declinedSection}

### 3. Budget Summary
**Total approved spend: $${total.toLocaleString()}** — ${budgetLine}

### 4. Next Steps
- Denver Museum of Nature & Science and the Denver Botanic Gardens are lined up, with nut-free dining verified nearby.
- Calendar holds are placed for Sept 15–20 — confirm with your household before finalizing.${
    declined.length ? '\n- Consider a substitute for anything declined above.' : ''
  }`;
}
