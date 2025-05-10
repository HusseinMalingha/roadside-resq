"use server";

import { suggestIssueSummary as genkitSuggestIssueSummary, type SuggestIssueSummaryInput } from "@/ai/flows/suggest-issue-summary";

interface FetchSummaryResult {
  summary?: string;
  error?: string;
}

export async function fetchSuggestedSummary(issueDescription: string): Promise<FetchSummaryResult> {
  if (!issueDescription.trim()) {
    return { error: "Issue description cannot be empty." };
  }
  try {
    const input: SuggestIssueSummaryInput = { issueDescription };
    const result = await genkitSuggestIssueSummary(input);
    return { summary: result.suggestedSummary };
  } catch (error) {
    console.error("Error fetching AI summary:", error);
    // Provide a generic error message to the user
    return { error: "An unexpected error occurred while suggesting an issue summary. Please try manually entering the issue or try again later." };
  }
}
