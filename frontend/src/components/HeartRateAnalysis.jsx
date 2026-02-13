import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Sparkles, Heart, RefreshCcw, AlertCircle, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DataChart } from './DataChart'
import { cn } from '../lib/utils'

import { useAIStream } from '../lib/useAIStream'

export function HeartRateAnalysis() {
    const [period, setPeriod] = useState('week')
    const [data, setData] = useState(null)
    const [loadingData, setLoadingData] = useState(false)
    const [localError, setLocalError] = useState(null)

    const {
        processStream,
        thoughts,
        finalResponse,
        isThinking,
        isStreaming,
        error: streamError,
        resetStream
    } = useAIStream()

    const thoughtsScrollRef = useRef(null)

    // Auto-scroll thoughts to bottom
    useEffect(() => {
        if (thoughtsScrollRef.current) {
            thoughtsScrollRef.current.scrollTop = thoughtsScrollRef.current.scrollHeight
        }
    }, [thoughts])

    const error = localError || streamError;

    const fetchDataOnly = async (p = period) => {
        setLoadingData(true)
        setLocalError(null)
        try {
            const response = await axios.post('http://localhost:8000/api/analyze/heart_rate/advanced', {
                period: p,
                skip_analysis: true
            })
            setData(response.data.data_used)
        } catch (err) {
            console.error("Data fetch failed:", err)
            setLocalError("Failed to fetch heart rate data for the selected period.")
        } finally {
            setLoadingData(false)
        }
    }

    const performAnalysis = async (p = period) => {
        setLocalError(null)
        try {
            if (!data) {
                await fetchDataOnly(p);
            }
            await processStream('http://localhost:8000/api/analyze/heart_rate/advanced', { period: p });
        } catch (err) {
            console.error("Heart rate analysis failed:", err)
            setLocalError("Failed to start analysis.")
        }
    }

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod)
        resetStream()
        fetchDataOnly(newPeriod)
    }

    useEffect(() => {
        fetchDataOnly()
    }, [])

    const TrendBadge = ({ trend, invert = false }) => {
        if (trend === 0 || trend === null) return null;
        // For HR, lower is often better (resting HR), but for HRV higher is better.
        const isActuallyPositive = invert ? trend < 0 : trend > 0;
        const colorClass = isActuallyPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500";

        return (
            <div className={cn(
                "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto",
                colorClass
            )}>
                {trend > 0 ? <TrendingUp className="h-2 w-2 mr-1" /> : <TrendingDown className="h-2 w-2 mr-1" />}
                {Math.abs(trend).toFixed(1)}%
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 -mx-6 px-6 py-4 border-b -mt-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Heart Rate Analysis</h2>
                        <p className="text-sm text-muted-foreground">Detailed cardiovascular overview, resting heart rate, and variability metrics.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-lg border shadow-sm self-start md:self-center">
                        <Button
                            variant={period === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handlePeriodChange('week')}
                            className={cn(period === 'week' ? "shadow-sm bg-rose-500 hover:bg-rose-600 text-white" : "hover:bg-rose-500/10 hover:text-rose-600")}
                        >
                            7 Days
                        </Button>
                        <Button
                            variant={period === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handlePeriodChange('month')}
                            className={cn(period === 'month' ? "shadow-sm bg-rose-500 hover:bg-rose-600 text-white" : "hover:bg-rose-500/10 hover:text-rose-600")}
                        >
                            30 Days
                        </Button>
                        <Button
                            variant={period === '90d' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handlePeriodChange('90d')}
                            className={cn(period === '90d' ? "shadow-sm bg-rose-500 hover:bg-rose-600 text-white" : "hover:bg-rose-500/10 hover:text-rose-600")}
                        >
                            90 Days
                        </Button>
                        <Button
                            variant={period === '180d' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handlePeriodChange('180d')}
                            className={cn(period === '180d' ? "shadow-sm bg-rose-500 hover:bg-rose-600 text-white" : "hover:bg-rose-500/10 hover:text-rose-600")}
                        >
                            180 Days
                        </Button>
                    </div>
                </div>
            </div>

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
                        <RefreshCcw className="h-8 w-8 text-rose-500 animate-spin" />
                    </div>
                )}

                {data?.metrics && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Avg HR
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hr_avg.trend} invert />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hr_avg.value?.toFixed(1) || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Beats per minute</p>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Heart className="h-3 w-3" /> Avg sleeping HR
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hr_sleeping.value?.toFixed(1) || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">During sleep sessions</p>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <TrendingDown className="h-3 w-3" /> Min HR
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hr_min.trend} invert />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hr_min.value?.toFixed(1) || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Resting HR</p>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" /> Max HR
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hr_max.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hr_max.value?.toFixed(1) || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">Peak recorded</p>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                        <Zap className="h-3 w-3" /> HRV
                                    </CardTitle>
                                    <TrendBadge trend={data.metrics.hrv.trend} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.metrics.hrv.value?.toFixed(1) || 'N/A'} <span className="text-xs font-normal text-muted-foreground">ms</span></div>
                                <p className="text-xs text-muted-foreground">Recovery capacity</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Unified AI Analysis Card */}
                <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Heart className="h-24 w-24 text-rose-600" />
                    </div>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-rose-600" />
                                AI Heart Analysis
                            </CardTitle>
                            {(finalResponse || isStreaming) && (
                                <div className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold capitalize border border-rose-200 dark:border-rose-800/50">
                                    {period === 'week' ? '7-Day Report' :
                                        period === 'month' ? '30-Day Report' :
                                            period === '90d' ? '90-Day Report' : '180-Day Report'}
                                </div>
                            )}
                        </div>
                        {(finalResponse || isStreaming) && (
                            <CardDescription>Advanced cardiovascular assessment and recovery metrics for the last {period === 'week' ? '7 days' : period === 'month' ? '30 days' : period === '90d' ? '90 days' : '180 days'}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!isStreaming && !finalResponse && !thoughts ? (
                            <div className="grid grid-cols-3 items-center gap-4 py-4">
                                <div className="flex items-center gap-4 col-span-1">
                                    <Heart className="h-8 w-8 text-rose-500 flex-shrink-0 opacity-50" />
                                    <div>
                                        <h3 className="text-base font-medium mb-1">Analyze Cardiovascular Trends</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Deep insights into resting heart rate and HRV recovery.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-center col-span-1">
                                    <Button onClick={() => performAnalysis()} className="gap-2 bg-rose-500 hover:bg-rose-600 border-none shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95">
                                        <Sparkles className="h-4 w-4" />
                                        Start Analysis
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Thoughts Section - Hide when final response appears */}
                                {(isThinking || thoughts) && !finalResponse && (
                                    <div
                                        ref={thoughtsScrollRef}
                                        className="rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto"
                                    >
                                        <div className="flex items-center gap-2 mb-2 text-rose-500 font-semibold uppercase tracking-wider text-[10px]">
                                            <Sparkles className="h-3 w-3 animate-pulse" />
                                            AI Thought Process
                                        </div>
                                        <div className="whitespace-pre-wrap opacity-80">
                                            {thoughts}
                                            {isThinking && <span className="inline-block w-1.5 h-3 ml-1 bg-rose-500 animate-pulse" />}
                                        </div>
                                    </div>
                                )}

                                {/* Final Response */}
                                {finalResponse && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in duration-700">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{finalResponse}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {data?.hr_metrics?.length > 0 && (
                    <DataChart
                        title="Daily Average Heart Rate"
                        description={`Trends over the last ${period}`}
                        data={data.hr_metrics}
                        dataKey="heart_rate"
                        category="day"
                        type="area"
                        yAxisInterval={10}
                    />
                )}

                {data?.sleeping_hr_metrics?.length > 0 && (
                    <DataChart
                        title="Average Sleeping Heart Rate"
                        description={`Heart rate during sleep intervals over the last ${period}`}
                        data={data.sleeping_hr_metrics}
                        dataKey="sleeping_heart_rate"
                        category="day"
                        type="area"
                        yAxisInterval={10}
                    />
                )}
            </div>
        </div>
    )
}
