
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { useModel } from '@/hooks/use-model';
import { getHistory, getGoals, saveGoals } from '@/lib/actions';
import type { HistoryEntry, UserGoals, GenerateInsightsOutput, GenerateInsightsInput } from '@/lib/types';
import { generateInsights } from '@/ai/flows/generate-insights-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as BarChartIcon, Sparkles, Zap, Target, BrainCircuit, Activity } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { subDays, format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type TimeRange = '7' | '30' | '90';

type PlannerForm = {
  weight: string;
  height: string;
  age: string;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
};

const DEFAULT_PLANNER_FORM: PlannerForm = {
    weight: '70',
    height: '175',
    age: '30',
    gender: 'male',
    activityLevel: 'moderate',
};

export default function InsightsPage() {
  const { user, loading: userLoading } = useUser();
  const { model, incrementModelUsage } = useModel();
  const { toast } = useToast();
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  const [insights, setInsights] = useState<GenerateInsightsOutput | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  
  const [plannerForm, setPlannerForm] = useState<PlannerForm>(DEFAULT_PLANNER_FORM);
  const [showPlanner, setShowPlanner] = useState(false);


  useEffect(() => {
    if (user) {
      setDataLoading(true);
      Promise.all([getHistory(user.id), getGoals(user.id)])
        .then(([userHistory, userGoals]) => {
          setHistory(userHistory);
          if (userGoals) setGoals(userGoals);
        })
        .catch(console.error)
        .finally(() => setDataLoading(false));
    }
  }, [user]);
  
  const handleGenerateInsights = async (calculationRequest?: GenerateInsightsInput['calculationRequest']) => {
    if (!user || !goals) {
        toast({variant: "destructive", title: "Cannot generate insights", description: "User or goal data is missing."})
        return
    };

    setInsightsLoading(true);
    setInsightsError(null);
    incrementModelUsage(model);
    try {
        const filteredHistory = history.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          const range = parseInt(timeRange);
          return entryDate >= subDays(new Date(), range);
        });

        const result = await generateInsights({
            history: filteredHistory,
            goals,
            calculationRequest
        }, model);
        setInsights(result);
        if(calculationRequest) setShowPlanner(false);
    } catch (e: any) {
        setInsightsError(e.message || "An unknown error occurred.");
    } finally {
        setInsightsLoading(false);
    }
  };
  
  const handleApplyPlan = async (plan: NonNullable<GenerateInsightsOutput['suggestedPlans']>[0]) => {
      if(!user) return;
      const newGoals: UserGoals = {
          calories: plan.targetCalories,
          protein: plan.targetProtein,
          carbs: plan.targetCarbs,
          fat: plan.targetFat,
      };
      setGoals(newGoals);
      await saveGoals(user.id, newGoals);
      toast({title: "Plan Applied!", description: `${plan.planName} goals have been set as your new daily targets.`})
  }

  const chartData = Array.from({ length: parseInt(timeRange) }, (_, i) => {
    const date = subDays(new Date(), parseInt(timeRange) - 1 - i);
    const dayEntries = history.filter(
      (entry) => new Date(entry.timestamp).toDateString() === date.toDateString()
    );
    const totalCalories = dayEntries.reduce((acc, curr) => acc + curr.analysis.total_calories, 0);
    return {
      date: format(date, 'MMM d'),
      calories: totalCalories,
      goal: goals?.calories || 0
    };
  });
  
  if (userLoading || dataLoading) {
    return <LoadingSpinner className="h-[calc(100vh-80px)]" />;
  }

  return (
    <div className="flex-1 bg-muted/30 dark:bg-slate-950/50">
      <main className="flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <Card className='overflow-hidden shadow-lg rounded-3xl'>
                 <CardHeader className="p-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                    <div className='flex justify-between items-center'>
                        <div>
                            <CardTitle className="font-black tracking-tighter text-3xl flex items-center gap-3">
                                <BarChartIcon size={28} className="text-primary"/>
                                Performance Insights
                            </CardTitle>
                            <CardDescription className="mt-1">Your nutritional dashboard for the last {timeRange} days.</CardDescription>
                        </div>
                        <Select onValueChange={(value: TimeRange) => setTimeRange(value)} defaultValue={timeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </CardHeader>
                 <CardContent className="p-6">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid hsl(var(--border))',
                                        background: 'hsl(var(--background))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                                <Bar dataKey="calories" fill="hsl(var(--primary))" name="Calories Consumed" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="goal" fill="hsl(var(--primary) / 0.2)" name="Calorie Goal" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-xl">
                            <Activity size={48} className="mb-4 opacity-50"/>
                            <h3 className="text-lg font-bold">Not Enough Data</h3>
                            <p className="text-sm">Log some meals to start seeing your performance insights.</p>
                        </div>
                    )}
                 </CardContent>
            </Card>

            <Card className="shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="p-6">
                    <CardTitle className="font-black tracking-tighter text-3xl flex items-center gap-3">
                         <BrainCircuit size={28} className="text-primary"/>
                         AI-Powered Analysis
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {showPlanner ? "Calculate your custom calorie and macro plans." : "Let AI analyze your trends and provide personalized feedback."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    {!insightsLoading && !insights && !showPlanner && (
                        <div className="flex gap-4">
                            <Button onClick={() => handleGenerateInsights()} size="lg" className="flex-1">
                                <Sparkles className="mr-2"/> Generate My Insights
                            </Button>
                             <Button onClick={() => setShowPlanner(true)} size="lg" variant="outline" className="flex-1">
                                <Target className="mr-2"/> Open Calorie Planner
                            </Button>
                        </div>
                    )}

                    {insightsLoading && <LoadingSpinner />}
                    
                    {insightsError && (
                         <Alert variant="destructive">
                            <Zap className="h-4 w-4" />
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>{insightsError}</AlertDescription>
                        </Alert>
                    )}

                    {insights && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                           {showPlanner && (
                                <Button onClick={() => setShowPlanner(false)} variant="ghost">Back to Insights</Button>
                           )}

                           {insights.bmrAndMaintenance && insights.suggestedPlans && (
                               <div className="space-y-6">
                                    <div className='grid grid-cols-2 gap-4 text-center'>
                                        <div className='bg-muted p-4 rounded-lg'>
                                            <p className='text-sm font-bold text-muted-foreground'>Basal Metabolic Rate (BMR)</p>
                                            <p className='text-2xl font-extrabold text-primary'>{Math.round(insights.bmrAndMaintenance.bmr)} kcal/day</p>
                                        </div>
                                        <div className='bg-muted p-4 rounded-lg'>
                                            <p className='text-sm font-bold text-muted-foreground'>Maintenance Calories</p>
                                            <p className='text-2xl font-extrabold text-primary'>{Math.round(insights.bmrAndMaintenance.maintenanceCalories)} kcal/day</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                       {insights.suggestedPlans.map(plan => (
                                           <Card key={plan.planName} className="flex flex-col">
                                               <CardHeader>
                                                   <CardTitle>{plan.planName}</CardTitle>
                                                   <CardDescription>{plan.description}</CardDescription>
                                               </CardHeader>
                                               <CardContent className="flex-1">
                                                   <div className="text-3xl font-extrabold">{plan.targetCalories} <span className="text-base font-medium text-muted-foreground">kcal</span></div>
                                                   <div className="text-xs text-muted-foreground mt-2">
                                                       P: {plan.targetProtein}g | C: {plan.targetCarbs}g | F: {plan.targetFat}g
                                                   </div>
                                               </CardContent>
                                               <div className="p-6 pt-0">
                                                    <Button onClick={() => handleApplyPlan(plan)} className="w-full">Apply Plan</Button>
                                               </div>
                                           </Card>
                                       ))}
                                    </div>
                               </div>
                           )}

                           {!showPlanner && (
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className='space-y-4'>
                                    <h4 className="font-bold text-muted-foreground">Key Observations</h4>
                                    <ul className="list-disc list-inside space-y-2 text-sm">
                                        {insights.keyObservations.map((obs, i) => <li key={i}>{obs}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                     <h4 className="font-bold text-muted-foreground">Trend Analysis</h4>
                                    <p className="text-sm">{insights.calorieTrendAnalysis}</p>
                                     <h4 className="font-bold text-muted-foreground mt-4">Macro Analysis</h4>
                                    <p className="text-sm">{insights.macroDistributionAnalysis}</p>
                                </div>
                            </div>
                           )}
                           
                            <div className="flex gap-4">
                                <Button onClick={() => handleGenerateInsights(showPlanner ? {
                                    weight: parseFloat(plannerForm.weight),
                                    height: parseFloat(plannerForm.height),
                                    age: parseInt(plannerForm.age),
                                    gender: plannerForm.gender,
                                    activityLevel: plannerForm.activityLevel
                                } : undefined)} size="lg" variant="outline">
                                    <Sparkles className="mr-2"/> Regenerate
                                </Button>
                                {!showPlanner && <Button onClick={() => setShowPlanner(true)} size="lg" variant="outline">
                                    <Target className="mr-2"/> Open Calorie Planner
                                </Button>}
                            </div>
                        </div>
                    )}
                    
                    {showPlanner && !insightsLoading && (
                         <div className="space-y-4 animate-in fade-in duration-500">
                             <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Weight (kg)</label>
                                    <Input type="number" value={plannerForm.weight} onChange={e => setPlannerForm({...plannerForm, weight: e.target.value})} className="mt-1" />
                                </div>
                                 <div>
                                    <label className="text-sm font-medium">Height (cm)</label>
                                    <Input type="number" value={plannerForm.height} onChange={e => setPlannerForm({...plannerForm, height: e.target.value})} className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Age</label>
                                    <Input type="number" value={plannerForm.age} onChange={e => setPlannerForm({...plannerForm, age: e.target.value})} className="mt-1" />
                                </div>
                             </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Gender</label>
                                    <Select value={plannerForm.gender} onValueChange={(v: PlannerForm['gender']) => setPlannerForm({...plannerForm, gender: v})}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Activity Level</label>
                                     <Select value={plannerForm.activityLevel} onValueChange={(v: PlannerForm['activityLevel']) => setPlannerForm({...plannerForm, activityLevel: v})}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                                            <SelectItem value="light">Lightly Active (light exercise/sports 1-3 days/week)</SelectItem>
                                            <SelectItem value="moderate">Moderately Active (moderate exercise/sports 3-5 days/week)</SelectItem>
                                            <SelectItem value="active">Very Active (hard exercise/sports 6-7 days a week)</SelectItem>
                                            <SelectItem value="very_active">Extra Active (very hard exercise/sports & physical job)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                             <div className="flex gap-4 pt-4">
                                 <Button onClick={() => handleGenerateInsights({
                                    weight: parseFloat(plannerForm.weight),
                                    height: parseFloat(plannerForm.height),
                                    age: parseInt(plannerForm.age),
                                    gender: plannerForm.gender,
                                    activityLevel: plannerForm.activityLevel
                                })} size="lg" className="flex-1">Calculate My Plan</Button>
                                <Button onClick={() => { setShowPlanner(false); setInsights(null); setInsightsError(null); }} size="lg" variant="ghost">Cancel</Button>
                             </div>
                         </div>
                    )}
                </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}
