"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Badge } from "./components/ui/badge"
import { ScrollArea } from "./components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Textarea } from "./components/ui/textarea"
import { Label } from "./components/ui/label"
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
  Palette,
  BarChart,
} from "lucide-react"

interface BannerFormData {
  website_url: string;
  domain: string;
  description: string;
  banner_size: string;
  offer: string;
}

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
  isLoading?: boolean
  chartData?: any // Chart data from backend
  imageUrl?: string // Image URL from backend
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
  const [isCampaignAnalysisMode, setIsCampaignAnalysisMode] = useState(false)
  const [isBannerGenMode, setIsBannerGenMode] = useState(false)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [bannerFormData, setBannerFormData] = useState<BannerFormData>({
    website_url: "",
    domain: "",
    description: "",
    banner_size: "300x250",
    offer: ""
  })
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

  const formatCampaignAnalysis = (data: any): string => {
    let formatted = `📊 **Campaign Analysis Results**\n\n`;
    
    if (data.analysis) {
      const analysis = data.analysis;
      
      formatted += `🏢 **Domain Classification:** ${analysis.Domain_Classification}\n`;
      formatted += `🎯 **Ad Focus:** ${analysis.Ad_Focus}\n`;
      formatted += `🚀 **Predicted Campaign Goal:** ${analysis.Predicted_Campaign_Goal}\n\n`;
    }
    
    if (data.domain) {
      formatted += `**Campaign Domain:** ${data.domain}\n`;
    }
    
    if (data.banner_size) {
      formatted += `**Banner Size:** ${data.banner_size}\n`;
    }
    
    formatted += `\n_AI-powered campaign analysis completed successfully._`;
    
    return formatted;
  };

  const formatBannerConcept = (data: any): { content: string; imageUrl?: string } => {
    let formatted = `🎨 **Banner Generated**\n\n`;
    
    // Check if we have actual image URL - first check nested in result, then at top level
    const imageUrl = data.result?.image_url || data.image_url || data.result?.image_path || data.image_path;
    const bannerData = data.result || data;
    
    if (imageUrl) {
      formatted += `✅ **Status:** AI-generated banner image ready!\n`;
      formatted += `📐 **Banner Size:** ${bannerData.banner_size || 'N/A'}\n`;
      if (bannerData.dimensions) {
        formatted += `📏 **Dimensions:** ${bannerData.dimensions}\n`;
      }
      formatted += `🏢 **Domain:** ${bannerData.domain || 'N/A'}\n`;
      formatted += `🎯 **Campaign Type:** ${bannerData.campaign_type || 'Digital Advertisement'}\n`;
      formatted += `🤖 **Generated with:** ${bannerData.model_used || 'AI Model'}\n\n`;
      formatted += `_Click to download or save the generated banner image._`;
      
      return { content: formatted, imageUrl: imageUrl };
    }
    
    // Fallback to concept formatting for text-based responses
    if (data.result) {
      const result = data.result;
      
      if (result.banner_size) {
        formatted += `📐 **Banner Size:** ${result.banner_size}\n`;
      }
      
      if (result.dimensions) {
        formatted += `📏 **Dimensions:** ${result.dimensions}\n\n`;
      }
      
      if (result.concept) {
        const concept = result.concept;
        
        if (concept.headline || concept.Headline) {
          formatted += `📝 **Headline:** ${concept.headline || concept.Headline}\n`;
        }
        
        if (concept.cta || concept.CTA || concept['Call-to-Action']) {
          formatted += `🔘 **Call-to-Action:** ${concept.cta || concept.CTA || concept['Call-to-Action']}\n`;
        }
        
        if (concept.visual_design || concept['Visual Design Description']) {
          formatted += `🎨 **Visual Design:** ${concept.visual_design || concept['Visual Design Description']}\n`;
        }
        
        if (concept.color_scheme || concept['Color Scheme']) {
          formatted += `🌈 **Color Scheme:** ${concept.color_scheme || concept['Color Scheme']}\n`;
        }
        
        if (concept.creative_strategy || concept['Creative Strategy']) {
          formatted += `💡 **Strategy:** ${concept.creative_strategy || concept['Creative Strategy']}\n`;
        }
        
        if (concept.typography_suggestions || concept['Typography Suggestions']) {
          formatted += `✏️ **Typography:** ${concept.typography_suggestions || concept['Typography Suggestions']}\n`;
        }
      }
      
      formatted += `\n_AI-generated banner concept ready for design implementation._`;
    }
    
    return { content: formatted };
  };

  const handleCampaignAnalysis = async () => {
    if (!inputValue.trim()) return;

    // Try to parse campaign data from input
    const input = inputValue.trim();
    let campaignData;
    
    try {
      // Try to parse as JSON first
      campaignData = JSON.parse(input);
    } catch {
      // If not JSON, create a simple campaign object
      campaignData = {
        website_url: "https://example.com",
        domain: input,
        description: `Marketing campaign for ${input}`,
        banner_size: "300x250",
        offer: null
      };
    }

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `📊 Campaign Analysis: ${input}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing campaign data with AI... 🤖",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/advertiser/analyze-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease make sure the campaign data is properly formatted.`;
      } else {
        responseContent = formatCampaignAnalysis(data);
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
        content: `❌ Campaign analysis failed:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleBannerGeneration = async () => {
    if (!inputValue.trim()) return;

    // Try to parse banner data from input
    const input = inputValue.trim();
    let bannerData;
    
    try {
      // Try to parse as JSON first
      bannerData = JSON.parse(input);
    } catch {
      // If not JSON, create a simple banner object
      bannerData = {
        website_url: "https://example.com",
        domain: input,
        description: `Banner ad for ${input}`,
        banner_size: "728x90",
        offer: "Special discount available"
      };
    }

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `🎨 Banner Generation: ${input}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Generating banner concept with AI... 🎨",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/advertiser/generate-banner-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: string;
      let imageUrl: string | undefined;
      
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease make sure the banner data is properly formatted.`;
      } else {
        const result = formatBannerConcept(data);
        responseContent = result.content;
        imageUrl = result.imageUrl;
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
        imageUrl: imageUrl,
      };

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ Banner generation failed:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleBannerFormSubmit = async () => {
    if (!bannerFormData.domain || !bannerFormData.description) {
      return;
    }

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `🎨 Banner Design Request:\n**Domain:** ${bannerFormData.domain}\n**Size:** ${bannerFormData.banner_size}\n**Description:** ${bannerFormData.description}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowBannerForm(false);
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Creating your banner concept with AI... 🎨",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/advertiser/generate-banner-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerFormData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: string;
      let imageUrl: string | undefined;
      
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nPlease make sure all form fields are properly filled.`;
      } else {
        const result = formatBannerConcept(data);
        responseContent = result.content;
        imageUrl = result.imageUrl;
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
        imageUrl: imageUrl,
      };

      setMessages((prev) => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ Banner generation failed:\n\n${error instanceof Error ? error.message : "Unknown error"}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
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
      } else if (isCampaignAnalysisMode) {
        handleCampaignAnalysis()
      } else if (isBannerGenMode) {
        handleBannerGeneration()
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
                                  
                                  {/* Render generated banner image if exists */}
                                  {message.imageUrl && (
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                      <div className="text-sm font-medium mb-2">Generated Banner:</div>
                                      <img 
                                        src={message.imageUrl}
                                        alt="Generated Banner"
                                        className="max-w-full h-auto rounded border shadow-sm"
                                        style={{ maxHeight: '300px' }}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = message.imageUrl!;
                                            link.download = `banner-${Date.now()}.png`;
                                            link.click();
                                          }}
                                        >
                                          Download PNG
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
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
                        placeholder={
                          isWebSearchMode 
                            ? "🔍 Competitive Analysis Mode: Enter product/service to analyze..." 
                            : isCampaignAnalysisMode
                            ? "📊 Campaign Analysis Mode: Enter company name or campaign details..."
                            : isBannerGenMode
                            ? "🎨 Banner Generation Mode: Enter company name or banner requirements..."
                            : "Ask about conversions, CPC, ROI, or campaign performance..."
                        }
                        disabled={isLoading}
                        className={
                          isWebSearchMode ? "border-blue-500 bg-blue-50/20" :
                          isCampaignAnalysisMode ? "border-green-500 bg-green-50/20" :
                          isBannerGenMode ? "border-purple-500 bg-purple-50/20" : ""
                        }
                      />
                      {(isWebSearchMode || isCampaignAnalysisMode || isBannerGenMode) && (
                        <div className="absolute -top-6 left-0 text-xs font-medium">
                          {isWebSearchMode && <span className="text-blue-600">🔍 Competitive Analysis Active</span>}
                          {isCampaignAnalysisMode && <span className="text-green-600">📊 Campaign Analysis Active</span>}
                          {isBannerGenMode && <span className="text-purple-600">🎨 Banner Generation Active</span>}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setIsWebSearchMode(!isWebSearchMode);
                        if (isWebSearchMode) {
                          setIsCampaignAnalysisMode(false);
                          setIsBannerGenMode(false);
                        } else {
                          setInputValue('');
                          setIsCampaignAnalysisMode(false);
                          setIsBannerGenMode(false);
                        }
                      }}
                      size="icon"
                      variant={isWebSearchMode ? "default" : "outline"}
                      title="Toggle Competitive Analysis Mode"
                    >
                      <Search className={`h-4 w-4 ${isWebSearchMode ? 'text-white' : ''}`} />
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCampaignAnalysisMode(!isCampaignAnalysisMode);
                        if (isCampaignAnalysisMode) {
                          setIsWebSearchMode(false);
                          setIsBannerGenMode(false);
                        } else {
                          setInputValue('');
                          setIsWebSearchMode(false);
                          setIsBannerGenMode(false);
                        }
                      }}
                      size="icon"
                      variant={isCampaignAnalysisMode ? "default" : "outline"}
                      title="Toggle Campaign Analysis Mode"
                    >
                      <BarChart className={`h-4 w-4 ${isCampaignAnalysisMode ? 'text-white' : ''}`} />
                    </Button>
                    <Button
                      onClick={() => {
                        setIsBannerGenMode(!isBannerGenMode);
                        if (isBannerGenMode) {
                          setIsWebSearchMode(false);
                          setIsCampaignAnalysisMode(false);
                        } else {
                          setInputValue('');
                          setIsWebSearchMode(false);
                          setIsCampaignAnalysisMode(false);
                        }
                      }}
                      size="icon"
                      variant={isBannerGenMode ? "default" : "outline"}
                      title="Toggle Banner Generation Mode"
                    >
                      <Palette className={`h-4 w-4 ${isBannerGenMode ? 'text-white' : ''}`} />
                    </Button>
                    <Button
                      onClick={
                        isWebSearchMode ? handleExaSearch :
                        isCampaignAnalysisMode ? handleCampaignAnalysis :
                        isBannerGenMode ? handleBannerGeneration :
                        handleSendMessage
                      }
                      disabled={isLoading || !inputValue.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isWebSearchMode ? (
                        <Search className="h-4 w-4" />
                      ) : isCampaignAnalysisMode ? (
                        <BarChart className="h-4 w-4" />
                      ) : isBannerGenMode ? (
                        <Palette className="h-4 w-4" />
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
                        setIsCampaignAnalysisMode(false);
                        setIsBannerGenMode(false);
                        setInputValue("email marketing software competitors");
                      }}
                    >
                      <Search className="mr-1 h-3 w-3" />
                      Competitive Analysis
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => {
                        setIsCampaignAnalysisMode(true);
                        setIsWebSearchMode(false);
                        setIsBannerGenMode(false);
                        setInputValue("TechStartup");
                      }}
                    >
                      <BarChart className="mr-1 h-3 w-3" />
                      Campaign Analysis
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => {
                        // Reset form data when opening
                        setBannerFormData({
                          website_url: "",
                          domain: "",
                          description: "",
                          banner_size: "300x250",
                          offer: ""
                        });
                        setShowBannerForm(true);
                        setIsWebSearchMode(false);
                        setIsCampaignAnalysisMode(false);
                        setIsBannerGenMode(false);
                      }}
                    >
                      <Palette className="mr-1 h-3 w-3" />
                      Banner Design
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => {
                        // Pre-fill form with TakeUForward sample data
                        setBannerFormData({
                          website_url: "https://takeuforward.org/",
                          domain: "TakeUForward (EdTech / Coding Interview Prep)",
                          description: "Diwali Sale campaign to promote Striver's premium courses. Target audience: students and professionals preparing for placements and coding interviews. Emphasize festive spirit with lights, diyas, and celebration.",
                          banner_size: "300x250",
                          offer: "20% off TUF Plus"
                        });
                        setShowBannerForm(true);
                        setIsWebSearchMode(false);
                        setIsCampaignAnalysisMode(false);
                        setIsBannerGenMode(false);
                      }}
                    >
                      <Palette className="mr-1 h-3 w-3" />
                      Sample: TUF Diwali
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Banner Design Form Dialog */}
      <Dialog open={showBannerForm} onOpenChange={setShowBannerForm}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Palette className="h-5 w-5" />
              Banner Design Request
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details below to generate an AI-powered banner design for your campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="website_url" className="text-foreground">Website URL</Label>
              <Input
                id="website_url"
                placeholder="https://yourwebsite.com"
                value={bannerFormData.website_url}
                onChange={(e) => setBannerFormData(prev => ({ ...prev, website_url: e.target.value }))}
                className="mt-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            <div>
              <Label htmlFor="domain" className="text-foreground">Company/Brand Name *</Label>
              <Input
                id="domain"
                placeholder="Your Company Name"
                value={bannerFormData.domain}
                onChange={(e) => setBannerFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="mt-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-foreground">Campaign Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign, target audience, and key message..."
                value={bannerFormData.description}
                onChange={(e) => setBannerFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 min-h-[80px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="banner_size" className="text-foreground">Banner Size</Label>
              <Select 
                value={bannerFormData.banner_size} 
                onValueChange={(value) => setBannerFormData(prev => ({ ...prev, banner_size: value }))}
              >
                <SelectTrigger className="mt-1 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select banner size" className="text-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="300x250" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    300×250 (Medium Rectangle)
                  </SelectItem>
                  <SelectItem value="728x90" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    728×90 (Leaderboard)
                  </SelectItem>
                  <SelectItem value="160x600" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    160×600 (Wide Skyscraper)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="offer" className="text-foreground">Special Offer (Optional)</Label>
              <Input
                id="offer"
                placeholder="20% off, Free trial, etc."
                value={bannerFormData.offer}
                onChange={(e) => setBannerFormData(prev => ({ ...prev, offer: e.target.value }))}
                className="mt-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBannerForm(false)}
                className="flex-1 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBannerFormSubmit}
                disabled={!bannerFormData.domain || !bannerFormData.description || isLoading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Palette className="mr-2 h-4 w-4" />
                    Create Banner
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvertiserChatBot