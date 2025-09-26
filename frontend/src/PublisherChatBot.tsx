import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const PublisherChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Publisher Analytics & Website Analysis Assistant. I can help you with:\n\n📊 **Publisher Metrics:**\n• "Show me today\'s revenue"\n• "What\'s my RPM this month?"\n• "Geography breakdown for impressions"\n• "Click-through rates by device"\n\n🔍 **Website Analysis:**\n• Just paste any URL to get detailed analysis\n• SEO optimization recommendations\n• Security vulnerability checks\n• Ad placement opportunities\n\n**Examples:** Try "revenue data" or paste "https://example.com" 💰',
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

      // Format security vulnerabilities
      if (analysis.vulns && analysis.vulns.length > 0) {
        formatted += '🔒 **Security Vulnerabilities:**\n';
        analysis.vulns.forEach((vuln: any, index: number) => {
          formatted += `${index + 1}. **${vuln.issue}**\n`;
          if (vuln.risk) formatted += `   Risk Level: ${vuln.risk}\n`;
          if (vuln.remediation) formatted += `   Solution: ${vuln.remediation}\n`;
          formatted += '\n';
        });
      }

      // Format SEO recommendations
      if (analysis.seo && analysis.seo.length > 0) {
        formatted += '📈 **SEO Recommendations:**\n';
        analysis.seo.forEach((seo: any, index: number) => {
          formatted += `${index + 1}. **${seo.issue}**\n`;
          if (seo.priority) formatted += `   Priority: ${seo.priority}\n`;
          if (seo.recommendation) formatted += `   Details: ${seo.recommendation}\n`;
          formatted += '\n';
        });
      }

      // Format ad placement suggestions
      if (analysis.ads && analysis.ads.length > 0) {
        formatted += '💰 **Ad Placement Opportunities:**\n';
        analysis.ads.forEach((ad: any, index: number) => {
          formatted += `${index + 1}. **${ad.location}**\n`;
          if (ad.format) formatted += `   Format: ${ad.format}\n`;
          if (ad.reasoning) formatted += `   Why: ${ad.reasoning}\n`;
          formatted += '\n';
        });
      }

      if (analysis.confidence) {
        formatted += `🎯 **Confidence Level:** ${analysis.confidence}%\n`;
      }

      if (analysis.fetch_method) {
        formatted += `\n🔧 **Analysis Method:** ${analysis.fetch_method === 'playwright' ? 'Full Browser' : 'Fast HTTP'}`;
      }

      return formatted;
    }

    // Handle regular publisher metrics
    if (data.type === 'publisher_metric' || !data.type) {
      let formatted = `📊 **${(data.metric || '').toUpperCase()} Data**\n\n`;
      
      // Handle different data structures
      if (data.metric === 'revenue') {
        formatted += `💰 **Daily Revenue:** $${data.daily}\n`;
        formatted += `📅 **Monthly Revenue:** $${data.monthly}\n`;
        if (data.site_wise) {
          formatted += `🏢 **Site Breakdown:**\n`;
          Object.entries(data.site_wise).forEach(([site, revenue]) => {
            formatted += `   • ${site}: $${revenue}\n`;
          });
        }
      } else if (data.metric === 'geography') {
        formatted += `🌍 **Geographic Breakdown:**\n`;
        if (data.breakdown) {
          Object.entries(data.breakdown).forEach(([region, percentage]) => {
            formatted += `   • ${region}: ${percentage}%\n`;
          });
        }
        if (data.device) {
          formatted += `\n📱 **Device Breakdown:**\n`;
          Object.entries(data.device).forEach(([device, percentage]) => {
            formatted += `   • ${device}: ${percentage}%\n`;
          });
        }
      } else if (data.metric === 'clicks') {
        formatted += `👆 **Total Clicks:** ${data.value?.toLocaleString()}\n`;
        if (data.ctr) {
          formatted += `📈 **CTR:** ${(data.ctr * 100).toFixed(2)}%\n`;
        }
      } else if (data.metric === 'rpm') {
        formatted += `💵 **RPM:** $${data.value}\n`;
        if (data.ecpm) {
          formatted += `📊 **eCPM:** $${data.ecpm}\n`;
        }
      } else {
        // Generic formatting
        if (data.value !== undefined) {
          formatted += `📈 **Value:** ${data.value.toLocaleString()}\n`;
        }
      }
      
      if (data.description) {
        formatted += `\n💡 ${data.description}`;
      }
      
      return formatted;
    }

    return 'Data received but could not be formatted.';
  };

  const queryPublisherAPI = async (query: string) => {
    try {
      const response = await fetch('http://localhost:8000/publisher/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to query publisher API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        content: 'Let me fetch your publisher metrics... 📊',
        timestamp: new Date(),
        isLoading: true
      };

      setMessages(prev => [...prev, loadingMessage]);

      const data = await queryPublisherAPI(userMessage.content);
      
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
        timestamp: new Date()
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 font-sans">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-6 text-center border-b border-white/20 shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          📊 Publisher Analytics Dashboard
        </h2>
        <p className="text-gray-600 text-sm">
          Ask me about your revenue, impressions, RPM, and more!
        </p>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/5">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex animate-slide-in ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            } max-w-[70%] ${
              message.type === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div className={`
              p-4 rounded-3xl shadow-lg backdrop-blur-md relative
              ${message.type === 'user' 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white ml-8' 
                : 'bg-white/95 text-gray-800 mr-8'
              }
            `}>
              <div 
                className="leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: formatMessageContent(message.content) 
                }}
              />
              <div className={`
                text-xs mt-2 text-right
                ${message.type === 'user' ? 'text-white/70' : 'text-gray-500'}
              `}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              {message.isLoading && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-purple-500"></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/95 backdrop-blur-md border-t border-white/20">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about revenue, RPM, impressions, or any metric..."
            disabled={isLoading}
            className="
              flex-1 px-6 py-4 border-2 border-gray-200 rounded-full 
              text-base outline-none transition-all duration-300
              bg-white/90 focus:border-purple-500 focus:ring-4 
              focus:ring-purple-500/10 focus:bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              placeholder:text-gray-400
            "
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="
              w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500
              text-white border-none rounded-full cursor-pointer
              text-lg flex items-center justify-center
              transition-all duration-300 shadow-lg
              hover:shadow-xl hover:-translate-y-1
              active:translate-y-0 disabled:opacity-60 
              disabled:cursor-not-allowed disabled:transform-none
              disabled:shadow-lg
            "
          >
            {isLoading ? (
              <div className="animate-spin text-xl">⏳</div>
            ) : (
              <span className="text-xl">📊</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublisherChatBot;