"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Badge } from "./components/ui/badge"
import { ScrollArea } from "./components/ui/scroll-area"
import ChartRenderer from "./components/ChartRenderer"
import {
  Target,
  Send,
  Loader2,
  Bot,
  User,
  TrendingUp,
  DollarSign,
  MousePointer,
  BarChart3,
  Search,
} from "lucide-react"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
  isLoading?: boolean
  chartData?: any // Chart data from backend
}

interface MetricData {
  metric: string
  value?: number
  description: string
  [key: string]: any
}

const AdvertiserChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm your Advertiser Campaign Assistant. I can help you track campaign performance, conversions, ROI, and ad spend.\n\n🔍 **New!** Use the search button (🔍) for AI-powered competitive intelligence!\n\nWhat would you like to know? 🚀",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isWebSearchMode, setIsWebSearchMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatMetricData = (data: MetricData): string => {
    let formatted = `🎯 **${data.metric.toUpperCase()} Metrics**\n\n`

    if (data.metric === "conversions") {
      formatted += `✅ **Total Conversions:** ${data.value?.toLocaleString()}\n`
    } else if (data.metric === "clicks") {
      formatted += `👆 **Total Clicks:** ${data.value?.toLocaleString()}\n`
      if (data.ctr) {
        formatted += `📈 **CTR:** ${(data.ctr * 100).toFixed(2)}%\n`
      }
    } else if (data.metric === "roi") {
      formatted += `📊 **ROI:** ${data.value}x\n`
      if (data.roas) {
        formatted += `💰 **ROAS:** ${data.roas}x\n`
      }
    } else if (data.metric === "spend") {
      formatted += `💸 **Total Spend:** $${data.value?.toLocaleString()}\n`
    } else if (data.metric === "impressions") {
      formatted += `👀 **Total Impressions:** ${data.value?.toLocaleString()}\n`
    } else if (data.metric === "cpc") {
      formatted += `💰 **Cost Per Click:** $${data.value}\n`
    } else if (data.metric === "cpm") {
      formatted += `📊 **Cost Per Mille:** $${data.value}\n`
    } else if (data.metric === "cpa") {
      formatted += `🎯 **Cost Per Acquisition:** $${data.value}\n`
    }

    formatted += `\n_${data.description}_`
    return formatted
  }

  const formatExaResults = (data: any): string => {
    let formatted = `🔍 **Competitive Intelligence for:** "${data.query}"\n\n`;
    
    if (data.ai_insights && typeof data.ai_insights === 'string') {
      try {
        const insights = JSON.parse(data.ai_insights);
        
        if (insights.market_gaps) {
          formatted += '🎯 **Market Gaps:**\n';
          insights.market_gaps.forEach((gap: string, index: number) => {
            formatted += `${index + 1}. ${gap}\n`;
          });
          formatted += '\n';
        }
        
        if (insights.bidding_strategy) {
          formatted += '💰 **Bidding Strategy:**\n';
          formatted += `${insights.bidding_strategy}\n\n`;
        }
        
        if (insights.key_differentiators) {
          formatted += '🚀 **Key Differentiators:**\n';
          insights.key_differentiators.forEach((diff: string) => {
            formatted += `• ${diff}\n`;
          });
          formatted += '\n';
        }
        
        if (insights.target_audience) {
          formatted += '🎯 **Target Audience:**\n';
          formatted += `${insights.target_audience}\n\n`;
        }
        
        if (insights.campaign_angles) {
          formatted += '📊 **Campaign Angles:**\n';
          insights.campaign_angles.forEach((angle: string, index: number) => {
            formatted += `${index + 1}. ${angle}\n`;
          });
          formatted += '\n';
        }
        
        if (insights.competitive_advantage) {
          formatted += '⚡ **Competitive Advantage:**\n';
          formatted += `${insights.competitive_advantage}\n\n`;
        }
      } catch (e) {
        formatted += `💡 **AI Insights:**\n${data.ai_insights}\n\n`;
      }
    }
    
    if (data.top_competitors && data.top_competitors.length > 0) {
      formatted += '🏆 **Top Competitors:**\n';
      data.top_competitors.slice(0, 5).forEach((comp: any, index: number) => {
        formatted += `${index + 1}. ${comp.domain} (${comp.mentions} mentions)\n`;
      });
      formatted += '\n';
    }
    
    if (data.market_trends && data.market_trends.length > 0) {
      formatted += '📈 **Market Trends:**\n';
      data.market_trends.slice(0, 3).forEach((trend: any, index: number) => {
        formatted += `${index + 1}. **${trend.title}**\n`;
        if (trend.snippet) {
          formatted += `   ${trend.snippet.substring(0, 100)}...\n`;
        }
        formatted += `   🔗 [Read more](${trend.url})\n\n`;
      });
    }
    
    return formatted;
  };

  const handleExaSearch = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `🔍 Competitive Analysis: ${inputValue.trim()}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const searchQuery = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing competitors and market intelligence... 🌐",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/advertiser/exa-competitive-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          num_results: 8,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease make sure the Exa API is configured properly.`;
      } else {
        responseContent = formatExaResults(data);
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ Sorry, competitive analysis failed:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running and Exa API is configured.`,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

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
        content: "Analyzing your campaign data... ⏳",
        timestamp: new Date(),
        isLoading: true,
      }

      setMessages((prev) => [...prev, loadingMessage])

      const response = await fetch("http://localhost:8000/advertiser/query", {
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

      let responseContent: string
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease try asking about your campaign metrics.`
      } else {
        responseContent = formatMetricData(data)
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
        content: `❌ Sorry, I encountered an error:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]))
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isWebSearchMode) {
        handleExaSearch()
      } else {
        handleSendMessage()
      }
    }
  }

  const formatMessageContent = (content: string) => {
    return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br />")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation - Matching landing page style */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-xl font-bold text-balance">MediaNet Analytics</span>
              </div>
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link to="/publisher" className="text-muted-foreground hover:text-foreground transition-colors">
                  Publisher
                </Link>
                <span className="text-accent font-medium">Advertiser</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
              <Button size="sm">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

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
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <Card
                            className={`max-w-[80%] ${
                              message.type === "user"
                                ? "bg-accent text-accent-foreground"
                                : "bg-card border-border/50"
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-2 rounded-full ${
                                    message.type === "user" ? "bg-accent-foreground/20" : "bg-muted"
                                  }`}
                                >
                                  {message.type === "user" ? (
                                    <User className="h-4 w-4 text-accent-foreground" />
                                  ) : (
                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div
                                    className="leading-relaxed whitespace-pre-wrap break-words"
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
                                  
                                  <div
                                    className={`text-xs mt-2 ${
                                      message.type === "user" ? "text-accent-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {message.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  {message.isLoading && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="text-sm">Processing...</span>
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
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isWebSearchMode 
                          ? "🔍 Competitive Analysis Mode: Enter product/service to analyze..." 
                          : "Ask about conversions, CPC, ROI, or campaign performance..."
                        }
                        disabled={isLoading}
                        className={isWebSearchMode ? "border-blue-500 bg-blue-50/20" : ""}
                      />
                      {isWebSearchMode && (
                        <div className="absolute -top-6 left-0 text-xs text-blue-600 font-medium">
                          🔍 Competitive Analysis Active
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setIsWebSearchMode(!isWebSearchMode);
                        if (!isWebSearchMode) {
                          setInputValue(''); // Clear input when switching modes
                        }
                      }}
                      size="icon"
                      variant={isWebSearchMode ? "default" : "outline"}
                      title="Toggle Competitive Analysis Mode"
                    >
                      <Search className={`h-4 w-4 ${isWebSearchMode ? 'text-white' : ''}`} />
                    </Button>
                    <Button
                      onClick={isWebSearchMode ? handleExaSearch : handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isWebSearchMode ? (
                        <Search className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Quick action badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Show me conversions")}
                    >
                      <Target className="mr-1 h-3 w-3" />
                      Conversions
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("What's my ROI?")}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      ROI
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Show CPC and CPM")}
                    >
                      <DollarSign className="mr-1 h-3 w-3" />
                      CPC/CPM
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Total ad spend")}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" />
                      Ad Spend
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Click-through rates")}
                    >
                      <MousePointer className="mr-1 h-3 w-3" />
                      CTR
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => {
                        setIsWebSearchMode(true);
                        setInputValue("email marketing software competitors");
                      }}
                    >
                      <Search className="mr-1 h-3 w-3" />
                      Competitive Analysis
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvertiserChatBot