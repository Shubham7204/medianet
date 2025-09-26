import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  report?: NormalizedReport;
}

interface SecurityFinding {
  issue: string;
  risk?: string;
  remediation?: string;
}

interface SEORecommendation {
  issue: string;
  recommendation?: string;
  priority?: string;
}

interface NormalizedReport {
  security_vulnerabilities: SecurityFinding[];
  seo_recommendations: SEORecommendation[];
  confidence?: number;
  error?: string;
  raw_output?: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Website Analysis Assistant. Send me a URL and I\'ll analyze it for security vulnerabilities, SEO opportunities, and ad placement suggestions. 🔍',
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

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const normalizeReport = (incoming: any): NormalizedReport => {
    if (!incoming) {
      return { security_vulnerabilities: [], seo_recommendations: [] };
    }

    const security = (incoming.security_vulnerabilities || incoming.vulns || []) as any[];
    const seo = (incoming.seo_recommendations || incoming.seo || []) as any[];

    const toSecurityFinding = (v: any): SecurityFinding => {
      if (!v) return { issue: String(v) };
      if (typeof v === 'string') return { issue: v };
      return {
        issue: v.issue ?? JSON.stringify(v),
        risk: v.risk,
        remediation: v.remediation,
      };
    };

    const toSEORec = (s: any): SEORecommendation => {
      if (!s) return { issue: String(s) };
      if (typeof s === 'string') return { issue: s };
      return {
        issue: s.issue ?? JSON.stringify(s),
        recommendation: s.recommendation,
        priority: s.priority,
      };
    };

    return {
      security_vulnerabilities: Array.isArray(security) ? security.map(toSecurityFinding) : [toSecurityFinding(security)],
      seo_recommendations: Array.isArray(seo) ? seo.map(toSEORec) : [toSEORec(seo)],
      confidence: incoming.confidence,
      error: incoming.error,
      raw_output: incoming.raw_output,
    };
  };

  const formatAnalysisReport = (report: any): string => {
    // Handle raw JSON parsing errors more gracefully
    if (report.error && report.raw_output) {
      let formatted = `❌ **Error:** ${report.error}\n\n`;
      try {
        const rawText = report.raw_output;
        if (rawText.includes('"vulns"') || rawText.includes('"security_vulnerabilities"')) {
          const vulnMatch = rawText.match(/"vulns":\s*\[(.*?)\]/s);
          if (vulnMatch) {
            formatted += '🔒 **Security Vulnerabilities Found:**\n';
            try {
              const vulns = JSON.parse(`[${vulnMatch[1]}]`);
              vulns.forEach((vuln: any, index: number) => {
                formatted += `${index + 1}. **${vuln.issue || 'Security Issue'}**\n`;
                if (vuln.risk) formatted += `   Risk Level: ${vuln.risk}\n`;
                if (vuln.remediation) formatted += `   Solution: ${vuln.remediation}\n`;
                formatted += '\n';
              });
            } catch {
              formatted += '   (Issues found but details couldn\'t be parsed)\n\n';
            }
          }
        }
        if (rawText.includes('"seo"') || rawText.includes('"seo_recommendations"')) {
          const seoMatch = rawText.match(/"seo":\s*\[(.*?)\]/s);
          if (seoMatch) {
            formatted += '📈 **SEO Recommendations Found:**\n';
            try {
              const seos = JSON.parse(`[${seoMatch[1]}]`);
              seos.forEach((seo: any, index: number) => {
                formatted += `${index + 1}. **${seo.issue || seo.recommendation || 'SEO Recommendation'}**\n`;
                if (seo.priority) formatted += `   Priority: ${seo.priority}\n`;
                if (seo.recommendation) formatted += `   Details: ${seo.recommendation}\n`;
                formatted += '\n';
              });
            } catch {
              formatted += '   (Recommendations found but details couldn\'t be parsed)\n\n';
            }
          }
        }
        if (rawText.includes('"ads"')) {
          formatted += '💰 **Ad Placement Suggestions Found:**\n';
          formatted += '   (Ad recommendations were generated but couldn\'t be fully parsed)\n\n';
        }
        if (formatted === `❌ **Error:** ${report.error}\n\n`) {
          formatted += '📋 **Partial Analysis Available:**\n';
          formatted += 'The analysis was completed but the response was truncated.\n';
          formatted += 'Key findings may be available in the raw output.\n\n';
        }
        return formatted;
      } catch (e) {
        return `❌ **Error:** ${report.error}\n\n📋 The analysis encountered an issue but may have found some insights. Please try again or check if the URL is accessible.`;
      }
    }

    const normalized = normalizeReport(report);
    if (normalized.error && !report.raw_output) {
      return `❌ **Error:** ${normalized.error}`;
    }

    let formatted = '';

    if (normalized.security_vulnerabilities && normalized.security_vulnerabilities.length > 0) {
      formatted += '🔒 **Security Vulnerabilities:**\n';
      normalized.security_vulnerabilities.forEach((v, index) => {
        formatted += `${index + 1}. **${v.issue}**\n`;
        if (v.risk) formatted += `   Risk Level: ${v.risk}\n`;
        if (v.remediation) formatted += `   Solution: ${v.remediation}\n`;
        formatted += '\n';
      });
    }

    if (normalized.seo_recommendations && normalized.seo_recommendations.length > 0) {
      formatted += '📈 **SEO Recommendations:**\n';
      normalized.seo_recommendations.forEach((s, index) => {
        formatted += `${index + 1}. **${s.issue}**\n`;
        if (s.priority) formatted += `   Priority: ${s.priority}\n`;
        if (s.recommendation) formatted += `   Details: ${s.recommendation}\n`;
        formatted += '\n';
      });
    }

    if (normalized.confidence !== undefined) {
      formatted += `🎯 **Confidence Level:** ${normalized.confidence}%\n`;
    }

    if (report.fetch_method) {
      formatted += `\n🔧 **Analysis Method:** ${report.fetch_method === 'playwright' ? 'Full Browser Analysis' : 'Fast HTTP Analysis'}`;
    }

    return formatted || 'Analysis completed but no specific recommendations were generated.';
  };

  const analyzeWebsite = async (url: string) => {
    try {
      const response = await fetch('http://localhost:8000/publisher/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.report;
    } catch (error) {
      throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Check if the input is a URL
    if (isValidUrl(userMessage.content)) {
      try {
        const loadingMessage: Message = {
          id: messages.length + 2,
          type: 'bot',
          content: 'Analyzing your website... This may take a few moments. ⏳',
          timestamp: new Date(),
          isLoading: true
        };

        setMessages(prev => [...prev, loadingMessage]);

        const report = await analyzeWebsite(userMessage.content);
        const normalized = normalizeReport(report);
        const analysisText = formatAnalysisReport(report);

        const botResponse: Message = {
          id: messages.length + 3,
          type: 'bot',
          content: `✅ **Analysis Complete for:** ${userMessage.content}\n\n${analysisText}`,
          timestamp: new Date(),
          report: normalized
        };

        setMessages(prev => prev.slice(0, -1).concat([botResponse]));
      } catch (error) {
        const errorMessage: Message = {
          id: messages.length + 3,
          type: 'bot',
          content: `❌ Sorry, I encountered an error while analyzing the website:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure:\n- The URL is accessible\n- The backend server is running on http://localhost:8000\n- The URL includes http:// or https://`,
          timestamp: new Date()
        };

        setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
      }
    } else {
      // Handle non-URL input
      const botResponse: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: `I need a valid URL to analyze. Please provide a complete URL including http:// or https://\n\nFor example:\n- https://example.com\n- https://www.google.com\n- http://localhost:3000`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
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
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  const renderReportCards = (report?: NormalizedReport) => {
    if (!report) return null;

    const hasSecurity = report.security_vulnerabilities && report.security_vulnerabilities.length > 0;
    const hasSEO = report.seo_recommendations && report.seo_recommendations.length > 0;

    if (!hasSecurity && !hasSEO) return null;

    return (
      <div className="mt-3 grid grid-cols-1 gap-4">
        {hasSecurity && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔒</span>
              <h3 className="font-semibold text-gray-900">Security Vulnerabilities</h3>
            </div>
            <ul className="space-y-2">
              {report.security_vulnerabilities.map((v, idx) => (
                <li key={`sec-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-900 font-medium">{v.issue}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {v.risk && <span className="mr-3"><span className="font-semibold">Risk:</span> {v.risk}</span>}
                    {v.remediation && (
                      <span className="block mt-1"><span className="font-semibold">Remediation:</span> {v.remediation}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasSEO && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📈</span>
              <h3 className="font-semibold text-gray-900">SEO Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {report.seo_recommendations.map((s, idx) => (
                <li key={`seo-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-900 font-medium">{s.issue}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {s.recommendation && (
                      <span className="block"><span className="font-semibold">Recommendation:</span> {s.recommendation}</span>
                    )}
                    {s.priority && (
                      <span className="block mt-1"><span className="font-semibold">Priority:</span> {s.priority}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen font-sans bg-[radial-gradient(1250px_600px_at_50%_-200px,rgba(79,172,254,0.18),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(10,37,64,0.15),transparent)]">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 backdrop-blur-md/0">
        <div className="px-6 py-7 text-center border-b border-gray-100">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            Outcome-first Website Analysis
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Actionable insights across security and SEO, presented clearly.
          </p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex animate-slide-in ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            } w-full px-0`}
          >
            <div className={`
              p-4 md:p-5 rounded-3xl shadow-lg backdrop-blur-sm relative max-w-3xl w-full
              ${message.type === 'user' 
                ? 'bg-gradient-to-r from-chat-primary to-chat-secondary text-white ml-8' 
                : 'bg-white text-gray-900 mr-8 border border-gray-100'
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
                ${message.type === 'user' ? 'text-white/80' : 'text-gray-500'}
              `}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              {message.isLoading && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-chat-primary"></div>
                </div>
              )}

              {/* Structured report cards under bot messages */}
              {message.type === 'bot' && renderReportCards(message.report)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-5 bg-white border-t border-gray-100">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a website URL to analyze (e.g., https://example.com)"
            disabled={isLoading}
            className="
              flex-1 px-6 py-4 border-2 border-gray-200 rounded-full 
              text-base outline-none transition-all duration-300
              bg-white focus:border-chat-primary focus:ring-4 
              focus:ring-chat-primary/10
              disabled:opacity-60 disabled:cursor-not-allowed
              placeholder:text-gray-400
            "
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="
              w-12 h-12 bg-gradient-to-r from-chat-primary to-chat-secondary
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
              <span className="text-xl">🚀</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;