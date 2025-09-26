import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { ScrollArea } from './components/ui/scroll-area';
import { BarChart3, Send, Loader2, Bot, User, Globe, Shield, TrendingUp } from 'lucide-react';
import ChartRenderer from './components/ChartRenderer';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  chartData?: any; // Chart data from backend
}

const PublisherChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Publisher Analytics Assistant. I can help you track revenue, RPM, impressions, and analyze websites for security and SEO insights.\n\nWhat would you like to know? 🚀',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMetricData = (data: any): string => {
    // Handle website analysis results
    if (data.type === 'website_analysis') {
      let formatted = `🔍 **Website Analysis Results for:** ${data.url}\n\n`;
      
      const analysis = data.analysis;
      if (analysis.error) {
        formatted += `❌ **Error:** ${analysis.error}\n`;
        if (analysis.raw_output) {
          // Try to extract partial information from raw output
          if (analysis.raw_output.includes('"vulns"')) {
            formatted += '\n🔒 **Security Issues Found** (partial results)\n';
          }
          if (analysis.raw_output.includes('"seo"')) {
            formatted += '📈 **SEO Issues Found** (partial results)\n';
          }
          if (analysis.raw_output.includes('"ads"')) {
            formatted += '💰 **Ad Opportunities Found** (partial results)\n';
          }
        }
        return formatted;
      }

      // Security vulnerabilities
      if (analysis.vulns && analysis.vulns.length > 0) {
        formatted += '🔒 **Security Vulnerabilities:**\n';
        analysis.vulns.forEach((vuln: any, index: number) => {
          formatted += `${index + 1}. **${vuln.issue || 'Security Issue'}**\n`;
          if (vuln.risk) formatted += `   Risk Level: ${vuln.risk}\n`;
          if (vuln.remediation) formatted += `   Solution: ${vuln.remediation}\n`;
          formatted += '\n';
        });
      }

      // SEO recommendations
      if (analysis.seo && analysis.seo.length > 0) {
        formatted += '📈 **SEO Recommendations:**\n';
        analysis.seo.forEach((seo: any, index: number) => {
          formatted += `${index + 1}. **${seo.issue || seo.recommendation || 'SEO Issue'}**\n`;
          if (seo.priority) formatted += `   Priority: ${seo.priority}\n`;
          if (seo.recommendation) formatted += `   Details: ${seo.recommendation}\n`;
          formatted += '\n';
        });
      }

      // Ad placement suggestions
      if (analysis.ads && analysis.ads.length > 0) {
        formatted += '💰 **Ad Placement Opportunities:**\n';
        analysis.ads.forEach((ad: any, index: number) => {
          formatted += `${index + 1}. **${ad.location || 'Ad Placement'}**\n`;
          if (ad.format) formatted += `   Format: ${ad.format}\n`;
          if (ad.reasoning) formatted += `   Why: ${ad.reasoning}\n`;
          formatted += '\n';
        });
      }

      if (analysis.confidence) {
        formatted += `🎯 **Confidence Level:** ${analysis.confidence}%\n`;
      }

      return formatted;
    }

    // Handle publisher metrics
    let formatted = `📊 **${data.metric || 'Publisher Data'}**\n\n`;
    
    if (data.value !== undefined) {
      formatted += `**Value:** ${data.value}\n`;
    }
    if (data.daily !== undefined) {
      formatted += `**Daily:** $${data.daily}\n`;
    }
    if (data.monthly !== undefined) {
      formatted += `**Monthly:** $${data.monthly}\n`;
    }
    if (data.ctr !== undefined) {
      formatted += `**CTR:** ${(data.ctr * 100).toFixed(2)}%\n`;
    }
    if (data.ecpm !== undefined) {
      formatted += `**eCPM:** $${data.ecpm}\n`;
    }
    if (data.breakdown) {
      formatted += `\n**Breakdown:**\n`;
      Object.entries(data.breakdown).forEach(([key, value]) => {
        formatted += `• ${key}: ${value}%\n`;
      });
    }
    if (data.site_wise) {
      formatted += `\n**Site-wise Revenue:**\n`;
      Object.entries(data.site_wise).forEach(([site, revenue]) => {
        formatted += `• ${site}: $${revenue}\n`;
      });
    }
    if (data.description) {
      formatted += `\n_${data.description}_`;
    }

    return formatted;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: 'Analyzing your request... ⏳',
        timestamp: new Date(),
        isLoading: true
      };

      setMessages(prev => [...prev, loadingMessage]);

      const response = await fetch('http://localhost:8000/publisher/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nTry asking about:\n• Revenue and earnings\n• Impressions\n• Clicks and CTR\n• RPM/eCPM\n• Geography breakdown`;
      } else {
        responseContent = formatMetricData(data);
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        chartData: data.chart_data || null
      };

      setMessages(prev => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: 'bot',
        content: `❌ Sorry, I encountered an error:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure the backend server is running.`,
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

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
                <span className="text-accent font-medium">Publisher</span>
                <Link to="/advertiser" className="text-muted-foreground hover:text-foreground transition-colors">
                  Advertiser
                </Link>
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
                                    className="leading-relaxed whitespace-pre-wrap break-words"
                                    dangerouslySetInnerHTML={{ 
                                      __html: formatMessageContent(message.content) 
                                    }}
                                  />
                                  
                                  {/* Render chart if chart data exists */}
                                  {message.chartData && (
                                    <div className="mt-4">
                                      {message.chartData.primary ? (
                                        // Handle multiple charts (like revenue endpoint)
                                        <div className="space-y-4">
                                          <ChartRenderer 
                                            chartData={message.chartData.primary}
                                            width={350}
                                            height={250}
                                            className="w-full"
                                          />
                                          {message.chartData.secondary && (
                                            <ChartRenderer 
                                              chartData={message.chartData.secondary}
                                              width={350}
                                              height={250}
                                              className="w-full"
                                            />
                                          )}
                                        </div>
                                      ) : message.chartData.geography ? (
                                        // Handle geography charts
                                        <div className="space-y-4">
                                          <ChartRenderer 
                                            chartData={message.chartData.geography}
                                            width={350}
                                            height={250}
                                            className="w-full"
                                          />
                                          {message.chartData.device && (
                                            <ChartRenderer 
                                              chartData={message.chartData.device}
                                              width={350}
                                              height={250}
                                              className="w-full"
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        // Handle single chart
                                        <ChartRenderer 
                                          chartData={message.chartData}
                                          width={350}
                                          height={250}
                                          className="w-full"
                                        />
                                      )}
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
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about revenue, impressions, RPM, or paste a URL to analyze..."
                      disabled={isLoading}
                      className="flex-1"
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
                  
                  {/* Quick action badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue('Show me today\'s revenue')}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Revenue
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue('What\'s my RPM this month?')}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" />
                      RPM
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue('Geography breakdown')}
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      Geography
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue('https://example.com')}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      Analyze URL
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherChatBot;