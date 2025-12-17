'use client';

import { ChangeEvent, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import Image from 'next/image';
import { Upload, Sparkles, Send, Save, Loader2, RefreshCw } from 'lucide-react';
import { analyzeImage, refineAnalysis, commitToJourney } from '@/lib/actions';
import type { NutritionalAnalysis, RefinedNutritionalAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { NutritionalChart } from './nutritional-chart';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const initialAnalysisState: { result?: NutritionalAnalysis | null; error?: string | null } = {};
const initialRefinementState: { result?: RefinedNutritionalAnalysis | null; error?: string | null } = {};

export function AnalysisPanel({ date, closePanel }: { date: Date, closePanel: () => void }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisState, analyzeAction] = useFormState(analyzeImage, initialAnalysisState);
  const [refinementState, refineAction] = useFormState(refineAnalysis, initialRefinementState);
  const [isCommitPending, startCommitTransition] = useTransition();
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetFlow = () => {
    setImagePreview(null);
    analysisState.result = null;
    analysisState.error = null;
    refinementState.result = null;
    refinementState.error = null;
  }

  const handleCommit = () => {
    const finalAnalysis = refinementState.result ?? analysisState.result;
    if (!finalAnalysis || !imagePreview) return;
    
    startCommitTransition(async () => {
      const result = await commitToJourney(finalAnalysis, imagePreview, date);
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        closePanel();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  }

  const analysisResult = analysisState.result;
  const refinedResult = refinementState.result;
  const currentAnalysisText = refinedResult?.refinedAnalysis ?? analysisResult?.estimatedNutritionalContent;

  return (
    <div className="py-6">
      {!analysisResult ? (
        <ImageUploadForm
          action={analyzeAction}
          onImageChange={handleImageChange}
          imagePreview={imagePreview}
          error={analysisState.error}
        />
      ) : (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Analysis Complete</span>
                        <Button variant="ghost" size="icon" onClick={resetFlow}>
                            <RefreshCw className="h-4 w-4"/>
                            <span className="sr-only">Start Over</span>
                        </Button>
                    </CardTitle>
                    <CardDescription>Here is the AI's analysis of your meal. You can refine it below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {imagePreview && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                            <Image src={imagePreview} alt="Meal preview" layout="fill" objectFit="cover" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <h4 className="font-semibold">Identified Dishes</h4>
                        <div className="flex flex-wrap gap-2">
                        {analysisResult.dishes.map((dish) => (
                            <Badge key={dish} variant="secondary">{dish}</Badge>
                        ))}
                        </div>
                    </div>
                    {currentAnalysisText && (
                        <div className="space-y-4">
                             <h4 className="font-semibold">Nutritional Information</h4>
                             <NutritionalChart nutritionString={currentAnalysisText} />
                             <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentAnalysisText}</p>
                        </div>
                    )}
                    {analysisResult.analysisNotes && (
                        <div className="space-y-2">
                             <h4 className="font-semibold">AI Notes</h4>
                             <p className="text-sm text-muted-foreground">{analysisResult.analysisNotes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Refine Analysis</CardTitle>
                    <CardDescription>Not quite right? Tell the AI how to improve the analysis.</CardDescription>
                </CardHeader>
                <form action={refineAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="initialAnalysis" value={analysisResult.estimatedNutritionalContent} />
                        <Textarea
                            name="refinementInstructions"
                            placeholder="e.g., 'The portion of rice was smaller.' or 'That's not paneer, it's tofu.'"
                            rows={3}
                        />
                        {refinementState.error && <p className="text-sm text-destructive">{refinementState.error}</p>}
                    </CardContent>
                    <CardFooter>
                         <SubmitButton icon={<Sparkles />} text="Refine" />
                    </CardFooter>
                </form>
            </Card>
             <div className="flex justify-end">
                <Button size="lg" onClick={handleCommit} disabled={isCommitPending}>
                    {isCommitPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Commit to Journey
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}

function ImageUploadForm({ action, onImageChange, imagePreview, error }: {
    action: (payload: FormData) => void;
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    imagePreview: string | null;
    error?: string | null;
}) {
    const [pending, startTransition] = useTransition();

    return (
        <form action={(formData) => {
            if (!imagePreview) return;
            formData.set('photoDataUri', imagePreview);
            startTransition(() => action(formData));
        }}>
            <Card>
                <CardHeader>
                    <CardTitle>Upload Meal Photo</CardTitle>
                    <CardDescription>Upload a picture of your meal to get started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input id="image" type="file" accept="image/*" onChange={onImageChange} required />
                    {imagePreview && (
                        <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-lg border">
                             <Image src={imagePreview} alt="Meal preview" layout="fill" objectFit="cover" />
                        </div>
                    )}
                    {error && (
                         <Alert variant="destructive">
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter>
                    {pending ? <LoadingSpinner /> : <SubmitButton icon={<Send />} text="Analyze Meal" disabled={!imagePreview}/> }
                </CardFooter>
            </Card>
        </form>
    );
}

function SubmitButton({ icon, text, disabled = false }: { icon: React.ReactNode; text: string; disabled?: boolean; }) {
    return (
        <Button type="submit" className="w-full" disabled={disabled} aria-disabled={disabled}>
            {icon}
            <span>{text}</span>
        </Button>
    )
}
