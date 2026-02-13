import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Activity, Moon, Heart, FileText, ChevronRight, Menu, Brain, LayoutDashboard, Sparkles, Server, Cpu } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { DataChart } from './components/DataChart'
import { SleepAnalysis } from './components/SleepAnalysis'
import { HeartRateAnalysis } from './components/HeartRateAnalysis'
import { cn } from './lib/utils'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dataFiles, setDataFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedFileData, setSelectedFileData] = useState(null)
  const [chartConfig, setChartConfig] = useState(null)
  const [insight, setInsight] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiStatus, setAiStatus] = useState({ status: 'checking', model: '' })

  useEffect(() => {
    // Fetch available data files
    const fetchDataFiles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/data/files')
        setDataFiles(response.data.files)
      } catch (error) {
        console.error("Failed to fetch data files:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDataFiles()

    // Fetch AI Status
    const fetchAiStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/ai/status')
        setAiStatus(response.data)
      } catch (error) {
        setAiStatus({ status: 'error', model: 'N/A' })
      }
    }
    fetchAiStatus()
  }, [])

  const handleFileClick = async (filename) => {
    setActiveTab(filename)
    setSelectedFileData(null) // Reset while loading
    setChartConfig(null)
    setInsight(null)

    try {
      const response = await axios.get(`http://localhost:8000/api/data/${filename}?limit=50`)
      const data = response.data.data
      setSelectedFileData(data)

      // Simple heuristic to configure chart
      if (data.length > 0) {
        const keys = Object.keys(data[0])
        const numericKeys = keys.filter(k => typeof data[0][k] === 'number')
        const timeKeys = keys.filter(k => k.includes('time') || k.includes('date') || k.includes('day'))

        if (numericKeys.length > 0) {
          setChartConfig({
            dataKey: numericKeys[0],
            category: timeKeys.length > 0 ? timeKeys[0] : keys[0],
            title: `${filename.replace('.csv', '')} Analysis`,
            description: `Visualizing ${numericKeys[0]} over time`
          })
        }
      }

    } catch (error) {
      console.error("Failed to fetch file data:", error)
    }
  }

  const handleGenerateInsight = async () => {
    if (!activeTab || activeTab === 'overview' || activeTab === 'sleep' || activeTab === 'activity' || activeTab === 'heart_rate') return;

    setAnalyzing(true)
    setInsight(null)
    try {
      const response = await axios.post(`http://localhost:8000/api/analyze/${activeTab}`)
      setInsight(response.data.insight)
    } catch (error) {
      console.error("Failed to generate insight:", error)
      setInsight("Failed to generate insight. Ensure backend is running.")
    } finally {
      setAnalyzing(false)
    }
  }

  const SidebarItem = ({ icon: Icon, label, id, onClick }) => (
    <button
      onClick={onClick || (() => setActiveTab(id))}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
        activeTab === id
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 md:relative md:translate-x-0 flex flex-col h-screen",
        !isSidebarOpen && "-translate-x-full md:hidden"
      )}>
        <div className="p-6 border-b flex items-center space-x-2 shrink-0">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Health AI</span>
        </div>

        {/* Fixed Top Navigation */}
        <div className="p-4 space-y-2 shrink-0">
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            id="overview"
            onClick={() => { setActiveTab('overview'); setInsight(null); setSelectedFileData(null); }}
          />
          <SidebarItem
            icon={Moon}
            label="Sleep Analysis"
            id="sleep"
            onClick={() => { setActiveTab('sleep'); setInsight(null); setSelectedFileData(null); }}
          />
          <SidebarItem
            icon={Heart}
            label="Heart Rate"
            id="heart_rate"
            onClick={() => { setActiveTab('heart_rate'); setInsight(null); setSelectedFileData(null); }}
          />
          <SidebarItem
            icon={Activity}
            label="Activity"
            id="activity"
            onClick={() => { setActiveTab('activity'); setInsight(null); setSelectedFileData(null); }}
          />
        </div>

        {/* Scrollable Raw Data Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t">
          <div className="pt-4 pb-2 shrink-0">
            <p className="px-8 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Raw Data</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-hide">
            {loading ? (
              <div className="px-4 text-sm text-muted-foreground animate-pulse">Loading files...</div>
            ) : (
              dataFiles.map((file, idx) => (
                <SidebarItem
                  key={idx}
                  icon={FileText}
                  label={file.replace('.csv', '')}
                  id={file}
                  onClick={() => handleFileClick(file)}
                />
              ))
            )}
          </nav>
        </div>

        {/* Sidebar Footer - AI Status */}
        <div className="mt-auto p-4 border-t">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 transition-all cursor-help group"
            title={`Model: ${aiStatus.model}`}
          >
            <div className="relative">
              <Cpu className={cn(
                "h-5 w-5 transition-colors",
                aiStatus.status === 'connected' ? "text-emerald-500" : "text-muted-foreground"
              )} />
              <div className={cn(
                "absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-card",
                aiStatus.status === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none">AI Connection</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {aiStatus.status === 'connected' ? "Connected to Ollama" : "Ollama Offline"}
              </p>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              <div className="font-semibold mb-1">Current Model</div>
              <div className="font-mono text-primary">{aiStatus.model}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Sleep Score</CardTitle>
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85</div>
                  <p className="text-xs text-muted-foreground">+2.1% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,432</div>
                  <p className="text-xs text-muted-foreground">-1.5% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resting HR</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">62 BPM</div>
                  <p className="text-xs text-muted-foreground">Normal range</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dynamic Data Chart for selected file */}
          {activeTab !== 'overview' && activeTab !== 'sleep' && activeTab !== 'activity' && activeTab !== 'heart_rate' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">{activeTab.replace('.csv', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
                <Button
                  onClick={handleGenerateInsight}
                  disabled={analyzing}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {analyzing ? "Analyzing..." : "Generate AI Insights"}
                </Button>
              </div>

              {insight && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{insight}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {chartConfig && selectedFileData ? (
                <DataChart
                  title={chartConfig.title}
                  description={chartConfig.description}
                  data={selectedFileData}
                  dataKey={chartConfig.dataKey}
                  category={chartConfig.category}
                  type="area"
                />
              ) : null}

              {selectedFileData && (
                <Card>
                  <CardHeader><CardTitle>Raw Data Preview</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-md border p-4 bg-muted/50 overflow-auto max-h-96">
                      <pre className="text-xs">{JSON.stringify(selectedFileData.slice(0, 5), null, 2)}</pre>
                      {selectedFileData.length > 5 && <p className="text-xs text-muted-foreground mt-2">... {selectedFileData.length - 5} more rows</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'sleep' && (
            <SleepAnalysis />
          )}

          {activeTab === 'heart_rate' && (
            <HeartRateAnalysis />
          )}

          {activeTab === 'activity' && (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-20" />
              <p>Advanced analysis for activity coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
