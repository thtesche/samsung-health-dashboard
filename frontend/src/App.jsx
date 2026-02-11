import { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Moon, Heart, FileText, ChevronRight, Menu, Brain, LayoutDashboard, Sparkles } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { DataChart } from './components/DataChart'
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
    if (!activeTab || activeTab === 'overview' || activeTab === 'sleep' || activeTab === 'activity' || activeTab === 'vitals') return;

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 md:relative md:translate-x-0",
        !isSidebarOpen && "-translate-x-full md:hidden"
      )}>
        <div className="p-6 border-b flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Health AI</span>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" />
          <SidebarItem icon={Moon} label="Sleep Analysis" id="sleep" />
          <SidebarItem icon={Activity} label="Activity" id="activity" />
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raw Data</p>
          </div>
          {loading ? (
            <div className="px-4 text-sm text-muted-foreground">Loading files...</div>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <header className="h-16 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold capitalize">{activeTab.replace('.csv', '')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateInsight}
              disabled={activeTab === 'overview' || activeTab === 'sleep' || activeTab === 'activity' || analyzing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {analyzing ? "Analyzing..." : "Generate AI Insights"}
            </Button>
          </div>
        </header>

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

          {insight && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{insight}</p>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Data Chart for selected file */}
          {activeTab !== 'overview' && activeTab !== 'sleep' && activeTab !== 'activity' && (
            <div className="space-y-4">
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

          {/* Fallback for other tabs */}
          {(activeTab === 'sleep' || activeTab === 'activity') && (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-20" />
              <p>Advanced analysis for {activeTab} coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
