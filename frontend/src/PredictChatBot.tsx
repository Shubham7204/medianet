import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { CampaignOverview } from "./components/dashboard/CampaignOverview";
import { KeywordTable } from "./components/dashboard/KeywordTable";
import { MarketForecast } from "./components/dashboard/MarketForecast";
import { Send, Loader2, Bot, User, Search, MessageCircle, X } from "lucide-react";

interface KeywordFormData {
  company_website: string;
  company_name: string;
  campaign_description: string;
  audience_target_type: string;
  city: string;
}

interface Message {
  id: number;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  chartData?: any;
  keywordData?: any;
}

const PredictChatBot: React.FC = () => {
  // Dashboard state
  const [campaignData, setCampaignData] = useState<any>(null);
  const [showKeywordForm, setShowKeywordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content:
        "🎯 **Welcome to MediaNet Prediction AI!**\\n\\nI can help you with keyword analysis and marketing predictions. Use the **Keyword Analysis** form to get started with comprehensive keyword research and market insights!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const [keywordFormData, setKeywordFormData] = useState<KeywordFormData>({
    company_website: "",
    company_name: "",
    campaign_description: "",
    audience_target_type: "",
    city: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageContent = (content: string): string => {
    return content
      .replace(/\\*\\*(.*?)\\*\\*/g, "<strong>$1</strong>")
      .replace(/\\*(.*?)\\*/g, "<em>$1</em>")
      .replace(/\\n/g, "<br>")
      .replace(/•/g, '<span style="color: #10b981;">•</span>');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing trends and generating predictions... 📈",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/predict/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\\n\\nPlease make sure the backend server is running.`;
      } else {
        responseContent =
          data.response || "I'm here to help with marketing predictions and trend analysis!";
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
        chartData: data.chart_data || null,
      };

      setMessages(prev => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `❌ **Sorry, I encountered an error:**\\n\\n${
          error instanceof Error ? error.message : "Unknown error"
        }\\n\\nPlease make sure the backend server is running.`,
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleKeywordAnalysis = async () => {
    if (!keywordFormData.company_name || !keywordFormData.campaign_description) {
      alert("Please fill in at least Company Name and Campaign Description");
      return;
    }

    setShowKeywordForm(false);
    setIsLoading(true);

    try {
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
      setCampaignData(data);

      // Also send success message to chat
      const successMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `✅ **Analysis Complete!**\\n\\nGenerated keyword analysis for ${
          data.campaign_inputs?.company_name
        }. Check out the dashboard above for detailed insights including ${
          data.keyword_dashboard_data?.length || 0
        } keywords and market forecasts.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `❌ **Keyword analysis failed:**\\n\\n${
          error instanceof Error ? error.message : "Unknown error"
        }\\n\\nPlease make sure the backend server is running and try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isChatOpen ? (
          <Button
            onClick={() => setIsChatOpen(true)}
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Card className="w-80 h-96 shadow-xl border-border bg-card">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                <span className="font-medium text-foreground">AI Assistant</span>
              </div>
              <Button
                onClick={() => setIsChatOpen(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col h-80">
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 text-sm ${
                          message.type === "user"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatMessageContent(message.content),
                          }}
                        />
                        {message.isLoading && (
                          <div className="flex items-center gap-1 mt-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-border p-2">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    size="sm"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
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
              <Label htmlFor="kw_company_website" className="text-foreground">
                Website URL
              </Label>
              <Input
                id="kw_company_website"
                placeholder="https://yourcompany.com"
                value={keywordFormData.company_website}
                onChange={e =>
                  setKeywordFormData({ ...keywordFormData, company_website: e.target.value })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <Label htmlFor="kw_company_name" className="text-foreground">
                Company Name *
              </Label>
              <Input
                id="kw_company_name"
                placeholder="Your Company Name"
                value={keywordFormData.company_name}
                onChange={e =>
                  setKeywordFormData({ ...keywordFormData, company_name: e.target.value })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                required
              />
            </div>

            <div>
              <Label htmlFor="kw_campaign_description" className="text-foreground">
                Campaign Description *
              </Label>
              <Textarea
                id="kw_campaign_description"
                placeholder="Describe your product/service and marketing goals..."
                value={keywordFormData.campaign_description}
                onChange={e =>
                  setKeywordFormData({ ...keywordFormData, campaign_description: e.target.value })
                }
                className="min-h-[80px] bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                required
              />
            </div>

            <div>
              <Label htmlFor="kw_audience_target_type" className="text-foreground">
                Target Audience
              </Label>
              <Select
                value={keywordFormData.audience_target_type}
                onValueChange={value =>
                  setKeywordFormData({ ...keywordFormData, audience_target_type: value })
                }
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
              <Label htmlFor="kw_city" className="text-foreground">
                Target City
              </Label>
              <Input
                id="kw_city"
                placeholder="e.g., New York, London, Mumbai"
                value={keywordFormData.city}
                onChange={e => setKeywordFormData({ ...keywordFormData, city: e.target.value })}
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
  );
};

export default PredictChatBot;
