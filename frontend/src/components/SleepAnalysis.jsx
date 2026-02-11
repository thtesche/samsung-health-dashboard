import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Moon, RefreshCcw, AlertCircle, Clock, Heart, Zap, Waves, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DataChart } from './DataChart'
import { cn } from '../lib/utils'

export function SleepAnalysis() {
    const [period, setPeriod] = useState('week')
    const [analyzing, setAnalyzing] = useState(false)
    const [insight, setInsight] = useState(null)
    const [data, setData] = useState(null)
    const [loadingData, setLoadingData] = useState(false)
    const [error, setError] = useState(null)

    const fetchDataOnly = async (p = period) => {
        setLoadingData(true)
        setError(null)
        try {
            const response = await axios.post('http://localhost:8000/api/analyze/sleep/advanced', {
                period: p,
                skip_analysis: true
            })
            setData(response.data.data_used)
        } catch (err) {
            console.error("Data fetch failed:", err)
            setError("Failed to fetch sleep data for the selected period.")
        } finally {
            setLoadingData(false)
        }
    }

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

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    }

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod)
        if (insight) {
            performAnalysis(newPeriod)
        } else {
            fetchDataOnly(newPeriod)
        }
    }

    useEffect(() => {
        fetchDataOnly()
    }, [])

    const TrendBadge = ({ trend }) => {
        if (trend === 0 || trend === null) return null;
        const isPositive = trend > 0;
        return (
            <div className={cn(
                "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto",
                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
                {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Advanced Sleep Analysis</h2>
                    <p className="text-muted-foreground">Comprehensive review of sleep cycles, vitals, and recovery patterns.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                    <Button
                        variant={period === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePeriodChange('week')}
                        className={cn(period === 'week' ? "shadow-sm bg-sky-500 hover:bg-sky-600 text-white" : "hover:bg-sky-500/10 hover:text-sky-600")}
                    >
                        Last 7 Days
                    </Button>
                    <Button
                        variant={period === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePeriodChange('month')}
                        className={cn(period === 'month' ? "shadow-sm bg-sky-500 hover:bg-sky-600 text-white" : "hover:bg-sky-500/10 hover:text-sky-600")}
                    >
                        Last 30 Days
                    </Button>
                </div>
            </div>

            {(!insight && !analyzing && !error) && (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                    <Moon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Ready for Deep Dive?</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        We'll analyze your sleep score, heart rate, oxygen levels, and HRV to provide professional insights.
                    </p>
                    <Button onClick={() => performAnalysis()} className="gap-2 bg-sky-500 hover:bg-sky-600 border-none shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 px-6">
                        <Sparkles className="h-4 w-4" />
                        Start AI Analysis
                    </Button>
                </Card>
            )}

            {analyzing && (
                <Card className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4">
                        <Moon className="h-12 w-12 text-sky-500 animate-pulse" />
                        <Sparkles className="h-6 w-6 text-sky-500 absolute -top-2 -right-2 animate-bounce" />
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

            <div className={cn("flex flex-col gap-6 transition-opacity", loadingData && "opacity-50 pointer-events-none")}>
                {loadingData && !data && (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCcw className="h-8 w-8 text-sky-500 animate-spin" />
                    </div>
                )}
                {data?.metrics && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* 1. Total Duration */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> Total Duration
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.sleep_duration.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(data.metrics.sleep_duration.value)}</div>
                                <p className="text-xs text-muted-foreground">Avg per night</p>
                            </CardContent>
                        </Card>

                        {/* 2. Sleep Efficiency */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Sleep Efficiency
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.efficiency.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.metrics.efficiency.value ? `${data.metrics.efficiency.value.toFixed(1)}%` : 'N/A'}
                                </div>
                                <p className="text-xs text-muted-foreground">Avg for {period}</p>
                            </CardContent>
                        </Card>

                        {/* 3. HRV */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Zap className="h-3 w-3" /> HRV (Recovery)
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hrv.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hrv.value ? `${data.metrics.hrv.value.toFixed(1)} ms` : 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Average during sleep</p>
                            </CardContent>
                        </Card>

                        {/* 4. Heart Rate */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Heart className="h-3 w-3" /> Heart Rate (Avg)
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hr.trend * -1} /> {/* Invert for HR: lower is better trend */}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hr.value ? `${data.metrics.hr.value.toFixed(1)} bpm` : 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Min {data.metrics.hr.min?.toFixed(1) || 'N/A'}</p>
                            </CardContent>
                        </Card>

                        {/* 5. SpO2 */}
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Waves className="h-3 w-3" /> Oxygen SpO2
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.spo2.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.spo2.value ? `${data.metrics.spo2.value.toFixed(1)}%` : 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Min {data.metrics.spo2.min?.toFixed(1) || 'N/A'}%</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {insight && !analyzing && (
                    <Card className="bg-sky-500/5 border-sky-500/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="h-24 w-24 text-sky-600" />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-sky-500" />
                                    AI Sleep Insights
                                </CardTitle>
                                <div className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-semibold capitalize border border-sky-200 dark:border-sky-800/50">
                                    {period === 'week' ? '7-Day Report' : '30-Day Report'}
                                </div>
                            </div>
                            <CardDescription>Comprehensive analysis for the last {period === 'week' ? '7 days' : '30 days'} based on your health metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{insight}</p>
                            </div>
                        </CardContent>
                    </Card>
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
        </div>
    )
}
