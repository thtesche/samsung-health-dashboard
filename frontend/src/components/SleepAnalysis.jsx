import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Moon, RefreshCcw, AlertCircle, Clock, Heart, Zap, Waves } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DataChart } from './DataChart'
import { cn } from '../lib/utils'

export function SleepAnalysis() {
    const [period, setPeriod] = useState('week')
    const [analyzing, setAnalyzing] = useState(false)
    const [insight, setInsight] = useState(null)
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    const performAnalysis = async (p = period) => {
        setAnalyzing(true)
        setError(null)
        setInsight(null)
        try {
            const response = await axios.post('http://localhost:8000/api/analyze/sleep/advanced', { period: p })
            setInsight(response.data.insight)
            setData(response.data.data_used)
        } catch (err) {
            console.error("Analysis failed:", err)
            setError("Failed to generate advanced sleep analysis. Ensure your data files are in the 'cleaned' folder and Ollama is running.")
        } finally {
            setAnalyzing(false)
        }
    }

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod)
        performAnalysis(newPeriod)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Advanced Sleep Analysis</h2>
                    <p className="text-muted-foreground">Comprehensive review of sleep cycles, vitals, and recovery patterns.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant={period === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePeriodChange('week')}
                        className={cn(period === 'week' && "shadow-sm")}
                    >
                        Last Week
                    </Button>
                    <Button
                        variant={period === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePeriodChange('month')}
                        className={cn(period === 'month' && "shadow-sm")}
                    >
                        Last Month
                    </Button>
                </div>
            </div>

            {!insight && !analyzing && !error && (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                    <Moon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Ready for Deep Dive?</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        We'll analyze your sleep score, heart rate, oxygen levels, and HRV to provide professional insights.
                    </p>
                    <Button onClick={() => performAnalysis()} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Start AI Analysis
                    </Button>
                </Card>
            )}

            {analyzing && (
                <Card className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4">
                        <Moon className="h-12 w-12 text-primary animate-pulse" />
                        <Sparkles className="h-6 w-6 text-primary absolute -top-2 -right-2 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-medium">Consulting AI Sleep Specialist...</h3>
                    <p className="text-sm text-muted-foreground">Aggregating vitals and analyzing patterns over the last {period}.</p>
                </Card>
            )}

            {error && (
                <Card className="border-destructive/50 bg-destructive/5 p-6 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="space-y-1">
                        <h3 className="font-semibold text-destructive">Analysis Error</h3>
                        <p className="text-sm text-destructive/80">{error}</p>
                        <Button variant="outline" size="sm" onClick={() => performAnalysis()} className="mt-2">Try Again</Button>
                    </div>
                </Card>
            )}

            {insight && (
                <div className="grid gap-6">
                    <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    AI Sleep Insights
                                </CardTitle>
                                <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize border border-primary/20">
                                    {period === 'week' ? 'Weekly Report' : 'Monthly Report'}
                                </div>
                            </div>
                            <CardDescription>Comprehensive analysis for the {period} based on your health metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{insight}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {data && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Heart className="h-3 w-3" /> Heart Rate (Avg)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.hr_avg ? `${data.hr_avg.toFixed(1)} bpm` : 'N/A'}</div>
                                    <p className="text-xs text-muted-foreground">Min {data.hr_min?.toFixed(1) || 'N/A'}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Waves className="h-3 w-3" /> Oxygen SpO2
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.spo2_avg ? `${data.spo2_avg.toFixed(1)}%` : 'N/A'}</div>
                                    <p className="text-xs text-muted-foreground">Min {data.spo2_min?.toFixed(1) || 'N/A'}%</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Zap className="h-3 w-3" /> HRV (Recovery)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.hrv_avg ? `${data.hrv_avg.toFixed(1)} ms` : 'N/A'}</div>
                                    <p className="text-xs text-muted-foreground">Average during sleep</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> Sleep Eficiency
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {data.sleep_metrics?.length > 0
                                            ? `${(data.sleep_metrics.reduce((acc, curr) => acc + curr.efficiency, 0) / data.sleep_metrics.length).toFixed(1)}%`
                                            : 'N/A'
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">Avg for {period}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {data?.sleep_metrics?.length > 0 && (
                        <DataChart
                            title="Sleep Score Trend"
                            description={`Consistency over the last ${period}`}
                            data={data.sleep_metrics}
                            dataKey="sleep_score"
                            category="start_time"
                            type="area"
                        />
                    )}
                </div>
            )}
        </div>
    )
}
