import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Textarea } from "./components/ui/textarea"
import { Label } from "./components/ui/label"
import { DashboardHeader } from "./components/dashboard/DashboardHeader"
import { CampaignOverview } from "./components/dashboard/CampaignOverview"
import { KeywordTable } from "./components/dashboard/KeywordTable"
import { MarketForecast } from "./components/dashboard/MarketForecast"
import {
  Send,
  Loader2,
  Bot,
  User,
  Search,
  MessageCircle,
  X,
} from "lucide-react"

interface KeywordFormData {
  company_website: string;
  company_name: string;
  campaign_description: string;
  audience_target_type: string;
  city: string;
}

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
  isLoading?: boolean
  chartData?: any
  keywordData?: any
}

const PredictChatBot: React.FC = () => {
  // Dashboard state
  const [campaignData, setCampaignData] = useState<any>(null)
  const [showKeywordForm, setShowKeywordForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content: "🎯 **Welcome to MediaNet Prediction AI!**\n\nI can help you with keyword analysis and marketing predictions. Use the **Keyword Analysis** form to get started with comprehensive keyword research and market insights!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [keywordFormData, setKeywordFormData] = useState<KeywordFormData>({
    company_website: "",
    company_name: "",
    campaign_description: "",
    audience_target_type: "",
    city: "",
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatMessageContent = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '<span style="color: #10b981;">•</span>')
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing trends and generating predictions... 📈",
        timestamp: new Date(),
        isLoading: true,
      }

      setMessages((prev) => [...prev, loadingMessage])

      const response = await fetch("http://localhost:8000/predict/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease make sure the backend server is running.`;
      } else {
        responseContent = data.response || "I'm here to help with marketing predictions and trend analysis!";
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
        chartData: data.chart_data || null
      }

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]))
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ **Sorry, I encountered an error:**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]))
    }

    setIsLoading(false)
  }

  const handleKeywordAnalysis = async () => {
    if (!keywordFormData.company_name || !keywordFormData.campaign_description) {
      alert("Please fill in at least Company Name and Campaign Description");
      return;
    }

    setShowKeywordForm(false);
    setIsLoading(true);

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `Analyze keywords for ${keywordFormData.company_name}: ${keywordFormData.campaign_description}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "🔍 Analyzing keywords and market data... Discovering relevant keywords, estimating search volumes, and calculating performance metrics.",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/keyword/generate-marketing-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keywordFormData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseContent = formatKeywordAnalysis(data);

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
        keywordData: data,
      };

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ **Keyword analysis failed:**\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running and try again.`,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    }

    // Reset form
    setKeywordFormData({
      company_website: "",
      company_name: "",
      campaign_description: "",
      audience_target_type: "",
      city: "",
    });
    setIsLoading(false);
  };

  const formatKeywordAnalysis = (data: any): string => {
    let content = `🔍 **Keyword Analysis Report**\n\n`;
    content += `**Company:** ${data.campaign_inputs?.company_name || "N/A"}\n`;
    content += `**Campaign:** ${data.campaign_inputs?.campaign_description || "N/A"}\n\n`;

    if (data.ai_driven_strategy?.executive_summary) {
      content += `**Executive Summary:**\n${data.ai_driven_strategy.executive_summary}\n\n`;
    }

    if (data.keyword_dashboard_data && data.keyword_dashboard_data.length > 0) {
      content += `**Top Keywords by Performance:**\n\n`;
      
      // Sort by projected revenue
      const topKeywords = data.keyword_dashboard_data
        .sort((a: any, b: any) => (b.projected_monthly_revenue || 0) - (a.projected_monthly_revenue || 0))
        .slice(0, 8);

      topKeywords.forEach((kw: any, index: number) => {
        content += `${index + 1}. **${kw.keyword}** (${kw.category})\n`;
        content += `   💰 Revenue: $${kw.projected_monthly_revenue?.toLocaleString() || 'N/A'}\n`;
        content += `   📊 CPC: $${kw.estimated_cpc || 'N/A'} | Volume: ${kw.monthly_search_volume?.toLocaleString() || 'N/A'}\n`;
        content += `   🎯 ROAS: ${kw.projected_roas || 'N/A'}x\n\n`;
      });
    }

    if (data.market_revenue_forecast?.scenarios) {
      content += `**Market Revenue Forecast:**\n`;
      const scenarios = data.market_revenue_forecast.scenarios;
      if (scenarios.optimistic && scenarios.optimistic.length > 0) {
        const avgOptimistic = scenarios.optimistic.reduce((a: number, b: number) => a + b, 0) / scenarios.optimistic.length;
        content += `📈 Optimistic: $${avgOptimistic.toFixed(1)}K average\n`;
      }
      if (scenarios.baseline && scenarios.baseline.length > 0) {
        const avgBaseline = scenarios.baseline.reduce((a: number, b: number) => a + b, 0) / scenarios.baseline.length;
        content += `📊 Baseline: $${avgBaseline.toFixed(1)}K average\n`;
      }
    }

    return content;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />
      
      {/* Main Dashboard Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {campaignData ? (
          <>
            {/* Campaign Overview */}
            <CampaignOverview campaignData={campaignData} />
            
            {/* Market Forecast */}
            <MarketForecast forecastData={campaignData.market_revenue_forecast || {}} />
            
            {/* Keyword Performance Table */}
            <KeywordTable keywordData={campaignData.keyword_dashboard_data || []} />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Start Your Analysis</h2>
                <p className="text-muted-foreground">
                  Generate comprehensive keyword analysis and market insights for your campaign.
                </p>
              </div>
              <Button 
                onClick={() => setShowKeywordForm(true)}
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generate Keyword Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Chat Interface - Full height, no scrolling */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-hidden p-4">
          <div className="max-w-4xl mx-auto h-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-2xl h-full">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-6">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-accent text-accent-foreground' : 'bg-card border-border/50'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-accent-foreground/20' : 'bg-muted'}`}>
                                  {message.type === 'user' ? (
                                    <User className="h-4 w-4 text-accent-foreground" />
                                  ) : (
                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div 
                                    className="text-sm leading-relaxed break-words"
                                    dangerouslySetInnerHTML={{
                                      __html: formatMessageContent(message.content),
                                    }}
                                  />
                                  
                                  {/* Render chart if chart data exists */}
                                  {message.chartData && (
                                    <div className="mt-4">
                                      <ChartRenderer 
                                        chartData={message.chartData}
                                        width={350}
                                        height={250}
                                        className="w-full"
                                      />
                                    </div>
                                  )}

                                  {/* Render keyword analysis chart if keyword data exists */}
                                  {message.keywordData && message.keywordData.market_revenue_forecast && (
                                    <div className="mt-4">
                                      <ChartRenderer 
                                        chartData={{
                                          type: "line",
                                          title: "Revenue Forecast Scenarios",
                                          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                          datasets: [
                                            {
                                              label: "Optimistic",
                                              data: message.keywordData.market_revenue_forecast.scenarios?.optimistic || [],
                                              borderColor: "#10b981",
                                              backgroundColor: "rgba(16, 185, 129, 0.1)"
                                            },
                                            {
                                              label: "Baseline",
                                              data: message.keywordData.market_revenue_forecast.scenarios?.baseline || [],
                                              borderColor: "#3b82f6",
                                              backgroundColor: "rgba(59, 130, 246, 0.1)"
                                            },
                                            {
                                              label: "Pessimistic",
                                              data: message.keywordData.market_revenue_forecast.scenarios?.pessimistic || [],
                                              borderColor: "#ef4444",
                                              backgroundColor: "rgba(239, 68, 68, 0.1)"
                                            }
                                          ]
                                        }}
                                        width={350}
                                        height={250}
                                        className="w-full"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                                    {message.timestamp.toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                  
                                  {message.isLoading && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="text-sm">Analyzing trends...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="border-t border-border/40 p-4 bg-card/30 backdrop-blur-sm">
                  <div className="flex gap-3 mb-3">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about marketing predictions, trends, or future forecasts..."
                      disabled={isLoading}
                      className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Keyword Analysis Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowKeywordForm(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Search className="h-4 w-4" />
                      Keyword Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Keyword Analysis Form Dialog */}
      <Dialog open={showKeywordForm} onOpenChange={setShowKeywordForm}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Search className="h-5 w-5" />
              Keyword Analysis
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Generate comprehensive keyword analysis and marketing insights for your campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="kw_company_website" className="text-foreground">Website URL</Label>
              <Input
                id="kw_company_website"
                placeholder="https://yourcompany.com"
                value={keywordFormData.company_website}
                onChange={(e) => setKeywordFormData({...keywordFormData, company_website: e.target.value})}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
              />
            </div>
            
            <div>
              <Label htmlFor="kw_company_name" className="text-foreground">Company Name *</Label>
              <Input
                id="kw_company_name"
                placeholder="Your Company Name"
                value={keywordFormData.company_name}
                onChange={(e) => setKeywordFormData({...keywordFormData, company_name: e.target.value})}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="kw_campaign_description" className="text-foreground">Campaign Description *</Label>
              <Textarea
                id="kw_campaign_description"
                placeholder="Describe your product/service and marketing goals..."
                value={keywordFormData.campaign_description}
                onChange={(e) => setKeywordFormData({...keywordFormData, campaign_description: e.target.value})}
                className="min-h-[80px] bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="kw_audience_target_type" className="text-foreground">Target Audience</Label>
              <Select 
                value={keywordFormData.audience_target_type} 
                onValueChange={(value) => setKeywordFormData({...keywordFormData, audience_target_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="young professionals">Young Professionals</SelectItem>
                  <SelectItem value="university students">University Students</SelectItem>
                  <SelectItem value="small business owners">Small Business Owners</SelectItem>
                  <SelectItem value="enterprise clients">Enterprise Clients</SelectItem>
                  <SelectItem value="tech enthusiasts">Tech Enthusiasts</SelectItem>
                  <SelectItem value="creative professionals">Creative Professionals</SelectItem>
                  <SelectItem value="general consumers">General Consumers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="kw_city" className="text-foreground">Target City</Label>
              <Input
                id="kw_city"
                placeholder="e.g., New York, London, Mumbai"
                value={keywordFormData.city}
                onChange={(e) => setKeywordFormData({...keywordFormData, city: e.target.value})}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleKeywordAnalysis} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Analyze Keywords
              </Button>
              <Button variant="outline" onClick={() => setShowKeywordForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PredictChatBot