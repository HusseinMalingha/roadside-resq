
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertCircle, Loader2, Check, Edit3 } from 'lucide-react';
import { fetchSuggestedSummary } from '@/lib/actions';
import { Input } from '@/components/ui/input';

interface IssueFormProps {
  initialDescription?: string;
  initialSummary?: string;
  onIssueDetailsConfirmed: (description: string, summary: string) => void;
  isLocationAvailable: boolean;
  isSubmitted: boolean;
}

const IssueForm: FC<IssueFormProps> = ({
  initialDescription = '',
  initialSummary = '',
  onIssueDetailsConfirmed,
  isLocationAvailable,
  isSubmitted,
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [summary, setSummary] = useState(initialSummary);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(!initialSummary);


  const handleSuggestSummary = async () => {
    if (!description.trim()) {
      setSummaryError("Please describe your issue first.");
      return;
    }
    setIsLoadingSummary(true);
    setSummaryError(null);
    const result = await fetchSuggestedSummary(description);
    if (result.error) {
      setSummaryError(result.error);
    } else if (result.summary) {
      setSummary(result.summary);
      setIsEditingSummary(false); // Show the suggested summary
    }
    setIsLoadingSummary(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(description.trim() && summary.trim()){
      onIssueDetailsConfirmed(description, summary);
    } else if (description.trim() && !summary.trim()) {
      // If no summary but description exists, use description as summary
      const autoSummary = description.substring(0, 50) + (description.length > 50 ? '...' : '');
      setSummary(autoSummary);
      onIssueDetailsConfirmed(description, autoSummary);
    }
  };
  
  const canConfirm = isLocationAvailable && description.trim() && summary.trim();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">2. Issue Details</CardTitle>
        <CardDescription>Describe the problem. Our AI can help suggest a common issue type.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="issueDescription" className="font-medium">Detailed Description</Label>
            <Textarea
              id="issueDescription"
              placeholder="e.g., My car won't start and makes a clicking sound..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-base"
              disabled={isSubmitted}
            />
          </div>
          
          <Button 
            type="button" 
            onClick={handleSuggestSummary} 
            disabled={isLoadingSummary || !description.trim() || isSubmitted} 
            variant="outline" 
            className="w-full"
          >
            {isLoadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isLoadingSummary ? 'Analyzing...' : 'Suggest Issue Type (AI)'}
          </Button>

          {summaryError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Suggestion Error</AlertTitle>
              <AlertDescription>{summaryError}</AlertDescription>
            </Alert>
          )}

          {(summary || isEditingSummary) && !summaryError && (
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="issueSummary" className="font-medium">Issue Summary (e.g., Flat Tire)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="issueSummary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter or confirm issue summary"
                  disabled={(!isEditingSummary && !!summary) || isSubmitted}
                  className="text-base flex-grow"
                  required
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditingSummary(!isEditingSummary)} 
                  title={isEditingSummary ? "Confirm Summary Text" : "Edit Summary Text"}
                  type="button"
                  disabled={isSubmitted}
                >
                  {isEditingSummary ? <Check className="h-5 w-5 text-green-500" /> : <Edit3 className="h-5 w-5" />}
                </Button>
              </div>
              {!isEditingSummary && summary && !isSubmitted && (
                <p className="text-xs text-muted-foreground">AI Suggestion: "{summary}". Click edit icon to change.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            type="submit" 
            disabled={!canConfirm || isSubmitted} 
            className="w-full"
          >
            {isSubmitted ? <Check className="mr-2 h-4 w-4"/> : null}
            {isSubmitted ? 'Issue Details Confirmed' : 'Confirm Issue Details'}
          </Button>
          {!isLocationAvailable && (
            <p className="text-xs text-destructive text-center w-full">Provide location to confirm issue.</p>
          )}
          {isLocationAvailable && !description.trim() && !isSubmitted && (
             <p className="text-xs text-destructive text-center w-full">Please describe your issue.</p>
          )}
           {isLocationAvailable && description.trim() && !summary.trim() && !isSubmitted && (
             <p className="text-xs text-orange-600 text-center w-full">Provide or confirm an issue summary.</p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default IssueForm;

