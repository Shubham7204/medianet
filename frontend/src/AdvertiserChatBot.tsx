import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface MetricData {
  metric: string;
  value?: number;
  description: string;
  [key: string]: any;
}

const AdvertiserChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Advertiser Campaign Assistant. I can help you track:\n\n🎯 **Campaign Performance**\n💰 **CPC, CPM, CPA**\n📊 **Conversions & ROI**\n💸 **Ad Spend & ROAS**\n👆 **Clicks & Impressions**\n\nWhat campaign metric would you like to check? 🚀',
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

  const formatMetricData = (data: MetricData): string => {
    let formatted = `🎯 **${data.metric.toUpperCase()} Metrics**\n\n`;
    
    // Handle different data structures
    if (data.metric === 'conversions') {
      formatted += `✅ **Total Conversions:** ${data.value?.toLocaleString()}\n`;
    } else if (data.metric === 'clicks') {
      formatted += `👆 **Total Clicks:** ${data.value?.toLocaleString()}\n`;
      if (data.ctr) {
        formatted += `📈 **CTR:** ${(data.ctr * 100).toFixed(2)}%\n`;
      }
    } else if (data.metric === 'roi') {
      formatted += `📈 **ROI:** ${data.value}x\n`;
      if (data.roas) {
        formatted += `💰 **ROAS:** ${data.roas}x\n`;
      }
    } else if (data.metric === 'spend') {
      formatted += `💸 **Total Spend:** $${data.value?.toLocaleString()}\n`;
    } else if (['cpc', 'cpm', 'cpa'].includes(data.metric)) {
      const symbol = data.metric === 'cpc' ? '$' : data.metric === 'cpm' ? '$' : '$';
      formatted += `💰 **${data.metric.toUpperCase()}:** ${symbol}${data.value}\n`;
    } else {
      // Generic formatting
      if (data.value !== undefined) {
        formatted += `📊 **Value:** ${data.value.toLocaleString()}\n`;
      }
    }
    
    formatted += `\n💡 ${data.description}`;
    
    return formatted;
  };

  const queryAdvertiserAPI = async (query: string) => {
    try {
      const response = await fetch('http://localhost:8000/advertiser/query', {
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
      throw new Error(`Failed to query advertiser API: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        content: 'Fetching your campaign metrics... 🎯',
        timestamp: new Date(),
        isLoading: true
      };

      setMessages(prev => [...prev, loadingMessage]);

      const data = await queryAdvertiserAPI(userMessage.content);
      
      let responseContent: string;
      if (data.error) {
        responseContent = `❌ **Error:** ${data.error}\n\nTry asking about:\n• Campaign conversions\n• CPC, CPM, CPA costs\n• Ad spend and ROI\n• Clicks and impressions`;
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 font-sans">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-6 text-center border-b border-white/20 shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          🎯 Advertiser Campaign Dashboard
        </h2>
        <p className="text-gray-600 text-sm">
          Track your campaign performance, costs, and conversions!
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
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white ml-8' 
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
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-emerald-500"></div>
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
            placeholder="Ask about conversions, CPC, ROI, ad spend, or any metric..."
            disabled={isLoading}
            className="
              flex-1 px-6 py-4 border-2 border-gray-200 rounded-full 
              text-base outline-none transition-all duration-300
              bg-white/90 focus:border-emerald-500 focus:ring-4 
              focus:ring-emerald-500/10 focus:bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              placeholder:text-gray-400
            "
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="
              w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500
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
              <span className="text-xl">🎯</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserChatBot;