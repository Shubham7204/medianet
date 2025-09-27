import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  BarChart3,
  Send,
  Loader2,
  Bot,
  User,
  Globe,
  Shield,
  TrendingUp,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import ChartRenderer from "./components/ChartRenderer";

interface Message {
  id: number;
  type: "user" | "bot";
  content: string | JSX.Element;
  timestamp: Date;
  isLoading?: boolean;
  chartData?: any;
}

// Add new interface for competitive analysis data
interface CompetitiveAnalysisData {
  service: string;
  url: string;
  comparison: {
    input_site: { url: string; [key: string]: any };
    competitors: { url: string; [key: string]: any }[];
  };
  insights: { competitor_strengths: string[]; optimizations: string[] };
  chart_data: {
    impressions_revenue?: any;
    geography?: any;
    rpm_ctr?: any;
  };
}

const PublisherChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content: (
        <div className="prose prose-sm max-w-none">
          <p>
            Hello! I&apos;m your Publisher Analytics Assistant. I can help you track revenue, RPM,
            impressions, and analyze websites for security and SEO insights.
          </p>
          <p>
            🔍 <strong>New!</strong> Use the search button (🔍) for AI-powered content strategy
            analysis!
          </p>
          <p>What would you like to know? 🚀</p>
        </div>
      ),
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [isCompAnalysisOpen, setIsCompAnalysisOpen] = useState(false);
  const [myWebsiteUrl, setMyWebsiteUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState([""]);
  const [isCompIntelligenceOpen, setIsCompIntelligenceOpen] = useState(false);
  const [myWebsiteUrlCI, setMyWebsiteUrlCI] = useState("");
  const [competitorWebsiteCI, setCompetitorWebsiteCI] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addCompetitorUrl = () => {
    setCompetitorUrls([...competitorUrls, ""]);
  };

  const removeCompetitorUrl = (index: number) => {
    if (competitorUrls.length > 1) {
      setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
    }
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const newUrls = [...competitorUrls];
    newUrls[index] = value;
    setCompetitorUrls(newUrls);
  };

  const handleCompetitiveAnalysis = async () => {
    if (!myWebsiteUrl.trim()) {
      alert("Please enter your website URL");
      return;
    }

    const validCompetitorUrls = competitorUrls.filter(url => url.trim() !== "");
    if (validCompetitorUrls.length === 0) {
      alert("Please enter at least one competitor URL");
      return;
    }

    // Close dialog
    setIsCompAnalysisOpen(false);

    // Create user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `🔍 Competitive Analysis: ${myWebsiteUrl} vs ${validCompetitorUrls.join(", ")}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing websites and comparing metrics... ⏳",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      const response = await fetch(
        "http://localhost:8000/publisher/competitive-analysis-multiple",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            my_website: myWebsiteUrl,
            competitor_urls: validCompetitorUrls,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: JSX.Element;
      if (data.error) {
        responseContent = (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ <strong>Error:</strong> {data.error}
            </p>
            <p>Please make sure all URLs are valid and accessible.</p>
          </div>
        );
      } else {
        responseContent = formatMetricData(data);
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
        content: (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ Sorry, competitive analysis failed:
              <br />
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <p>Please make sure the backend server is running.</p>
          </div>
        ),
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);

    // Reset form
    setMyWebsiteUrl("");
    setCompetitorUrls([""]);
  };

  const handleCompetitiveIntelligence = async () => {
    if (!myWebsiteUrlCI.trim()) {
      alert("Please enter your website URL");
      return;
    }

    if (!competitorWebsiteCI.trim()) {
      alert("Please enter competitor website URL");
      return;
    }

    // Close dialog
    setIsCompIntelligenceOpen(false);

    // Create user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `📊 Competitive Intelligence: ${myWebsiteUrlCI} vs ${competitorWebsiteCI}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Analyzing competitive intelligence between websites... ⏳",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/advertiser/competitive-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `competitive analysis between ${myWebsiteUrlCI} and ${competitorWebsiteCI}`,
          my_website: myWebsiteUrlCI,
          competitor_website: competitorWebsiteCI,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: JSX.Element;
      if (data.error) {
        responseContent = (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ <strong>Error:</strong> {data.error}
            </p>
            <p>Please make sure both URLs are valid and accessible.</p>
          </div>
        );
      } else {
        responseContent = formatCompetitiveIntelligence(data);
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
        content: (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ Sorry, competitive intelligence analysis failed:
              <br />
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <p>Please make sure the backend server is running.</p>
          </div>
        ),
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);

    // Reset form
    setMyWebsiteUrlCI("");
    setCompetitorWebsiteCI("");
  };

  interface CompetitiveAnalysisData {
    service: string;
    url: string;
    comparison: {
      input_site: { url: string; [key: string]: any };
      competitors: { url: string; [key: string]: any }[];
    };
    insights: { competitor_strengths: string[]; optimizations: string[] };
    chart_data: {
      impressions_revenue?: any;
      geography?: any;
      rpm_ctr?: any;
    };
  }

  const formatMetricData = (data: any): JSX.Element => {
    if (
      data.service === "competitive_analysis" ||
      data.service === "competitive_analysis_multiple"
    ) {
      const { comparison, insights, url, my_website } = data as CompetitiveAnalysisData & {
        my_website?: string;
      };
      const displayUrl = my_website || url;

      return (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold text-blue-600">
            🔍 Competitive Analysis for: {displayUrl}
          </h3>

          {/* Comparison Table */}
          <div className="mb-4">
            <h4 className="text-md font-medium">📊 Comparative Metrics</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Metric
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      {comparison.input_site.url || displayUrl}
                    </th>
                    {comparison.competitors.map((comp, index) => (
                      <th
                        key={index}
                        className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground"
                      >
                        {comp.url}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      key: "impressions",
                      label: "Impressions (monthly)",
                      format: (v: number) => v.toLocaleString(),
                    },
                    { key: "ctr", label: "CTR (%)", format: (v: number) => v.toFixed(2) },
                    {
                      key: "revenue",
                      label: "Revenue ($ monthly)",
                      format: (v: number) => v.toFixed(2),
                    },
                    { key: "rpm", label: "RPM ($)", format: (v: number) => v.toFixed(2) },
                    {
                      key: "ad_density",
                      label: "Ad Density (%)",
                      format: (v: number) => v.toFixed(2),
                    },
                    { key: "ad_count", label: "Ad Placements", format: (v: number) => v },
                    { key: "word_count", label: "Word Count", format: (v: number) => v },
                    { key: "link_count", label: "Link Count", format: (v: number) => v },
                    { key: "image_count", label: "Image Count", format: (v: number) => v },
                  ].map((metric, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                        {metric.label}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {metric.format(comparison.input_site[metric.key] || 0)}
                      </td>
                      {comparison.competitors.map((comp, index) => (
                        <td
                          key={index}
                          className="border border-border px-4 py-2 text-sm text-foreground"
                        >
                          {metric.format(comp[metric.key] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-background">
                    <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                      Geography (US %)
                    </td>
                    <td className="border border-border px-4 py-2 text-sm text-foreground">
                      {comparison.input_site.geography?.US || 0}
                    </td>
                    {comparison.competitors.map((comp, index) => (
                      <td
                        key={index}
                        className="border border-border px-4 py-2 text-sm text-foreground"
                      >
                        {comp.geography?.US || 0}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                      Device (Mobile %)
                    </td>
                    <td className="border border-border px-4 py-2 text-sm text-foreground">
                      {comparison.input_site.device?.Mobile || 0}
                    </td>
                    {comparison.competitors.map((comp, index) => (
                      <td
                        key={index}
                        className="border border-border px-4 py-2 text-sm text-foreground"
                      >
                        {comp.device?.Mobile || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          {insights && (
            <div className="mb-4">
              <h4 className="text-md font-medium">💡 Actionable Insights</h4>
              <div className="border border-border p-4 bg-card rounded text-foreground">
                <h5 className="text-sm font-semibold">Competitor Strengths:</h5>
                <ul className="list-disc pl-5">
                  {insights.competitor_strengths?.map((strength: string, index: number) => (
                    <li key={index} className="text-sm">
                      {strength}
                    </li>
                  ))}
                </ul>
                <h5 className="text-sm font-semibold mt-2">Optimizations:</h5>
                <ul className="list-disc pl-5">
                  {insights.optimizations?.map((opt: string, index: number) => (
                    <li key={index} className="text-sm">
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (data.type === "website_analysis") {
      const analysis = data.analysis;
      if (analysis.error) {
        return (
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-red-600">
              🔍 Website Analysis Results for: {data.url}
            </h3>
            <p className="text-red-500">
              ❌ <strong>Error:</strong> {analysis.error}
            </p>
            {analysis.raw_output && (
              <div>
                {analysis.raw_output.includes('"vulns"') && (
                  <p>
                    🔒 <strong>Security Issues Found</strong> (partial results)
                  </p>
                )}
                {analysis.raw_output.includes('"seo"') && (
                  <p>
                    📈 <strong>SEO Issues Found</strong> (partial results)
                  </p>
                )}
                {analysis.raw_output.includes('"ads"') && (
                  <p>
                    💰 <strong>Ad Opportunities Found</strong> (partial results)
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold text-blue-600">
            🔍 Website Analysis for: {data.url}
          </h3>
          {analysis.vulns && analysis.vulns.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium">🔒 Security Vulnerabilities</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Issue
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Risk Level
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Remediation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.vulns.map((vuln: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {vuln.issue || "Security Issue"}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              vuln.risk === "High"
                                ? "bg-red-100 text-red-800"
                                : vuln.risk === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {vuln.risk || "N/A"}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {vuln.remediation || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {analysis.seo && analysis.seo.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium">📈 SEO Recommendations</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Issue
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Priority
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.seo.map((seo: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {seo.issue || seo.recommendation || "SEO Issue"}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              seo.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : seo.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {seo.priority || "N/A"}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {seo.recommendation || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {analysis.ads && analysis.ads.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium">💰 Ad Placement Opportunities</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Location
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Format
                      </th>
                      <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                        Reasoning
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.ads.map((ad: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {ad.location || "Ad Placement"}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {ad.format || "N/A"}
                        </td>
                        <td className="border border-border px-4 py-2 text-sm text-foreground">
                          {ad.reasoning || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {analysis.confidence && (
            <p className="text-sm text-foreground">
              🎯 <strong>Confidence Level:</strong> {analysis.confidence}%
            </p>
          )}
        </div>
      );
    }

    // Handle publisher metrics
    return (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-lg font-semibold text-blue-600">
          📊 {data.metric || "Publisher Data"}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <tbody>
              {data.value !== undefined && (
                <tr className="bg-background">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Value
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    {data.value}
                  </td>
                </tr>
              )}
              {data.daily !== undefined && (
                <tr className="bg-muted/20">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Daily
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    ${data.daily}
                  </td>
                </tr>
              )}
              {data.monthly !== undefined && (
                <tr className="bg-background">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Monthly
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    ${data.monthly}
                  </td>
                </tr>
              )}
              {data.ctr !== undefined && (
                <tr className="bg-muted/20">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    CTR
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    {(data.ctr * 100).toFixed(2)}%
                  </td>
                </tr>
              )}
              {data.ecpm !== undefined && (
                <tr className="bg-background">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    eCPM
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    ${data.ecpm}
                  </td>
                </tr>
              )}
              {data.breakdown && (
                <tr className="bg-muted/20">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Breakdown
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    {Object.entries(data.breakdown).map(([key, value]) => (
                      <div key={key}>
                        • {key}: {value}%
                      </div>
                    ))}
                  </td>
                </tr>
              )}
              {data.site_wise && (
                <tr className="bg-background">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Site-wise Revenue
                  </td>
                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                    {Object.entries(data.site_wise).map(([site, revenue]) => (
                      <div key={site}>
                        • {site}: ${revenue}
                      </div>
                    ))}
                  </td>
                </tr>
              )}
              {data.description && (
                <tr className="bg-muted/20">
                  <td className="border border-border px-4 py-2 text-sm font-medium text-foreground">
                    Description
                  </td>
                  <td className="border border-border px-4 py-2 text-sm italic">
                    {data.description}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const formatExaResults = (data: any): JSX.Element => {
    let insights: any = {};
    if (data.ai_insights && typeof data.ai_insights === "string") {
      try {
        insights = JSON.parse(data.ai_insights);
      } catch (e) {
        insights = { error: data.ai_insights };
      }
    } else {
      insights = data.ai_insights || {};
    }

    return (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-lg font-semibold text-blue-600">
          🔍 Content Strategy Analysis for: &quot;{data.query}&quot;
        </h3>
        {insights.error ? (
          <p className="text-red-500">
            💡 <strong>AI Insights:</strong> {insights.error}
          </p>
        ) : (
          <>
            {insights.article_ideas && insights.article_ideas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">📝 Content Ideas</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Idea
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.article_ideas.map((idea: string, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {idea}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.seo_keywords && insights.seo_keywords.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🔑 SEO Keywords</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Keyword
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.seo_keywords.map((keyword: string, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {keyword}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.target_audience && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🎯 Target Audience</h4>
                <div className="border border-border p-4 bg-card rounded text-foreground">
                  {insights.target_audience}
                </div>
              </div>
            )}
            {insights.content_formats && insights.content_formats.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">📊 Content Formats</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Format
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.content_formats.map((format: string, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {format}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.monetization_opportunities &&
              insights.monetization_opportunities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium">💰 Monetization Ideas</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                            Opportunity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {insights.monetization_opportunities.map((opp: string, index: number) => (
                          <tr
                            key={index}
                            className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                          >
                            <td className="border border-border px-4 py-2 text-sm text-foreground">
                              {opp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </>
        )}
        {data.top_keywords && data.top_keywords.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium">🏷️ Trending Keywords</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Keyword
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Frequency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_keywords.slice(0, 8).map((kw: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {kw.keyword}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {kw.frequency}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data.trending_content && data.trending_content.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium">📈 Trending Content</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Title
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Snippet
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.trending_content.slice(0, 3).map((content: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {content.title}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {content.snippet ? `${content.snippet.substring(0, 100)}...` : "N/A"}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Read more
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatCompetitiveIntelligence = (data: any): JSX.Element => {
    let insights: any = {};
    if (data.ai_insights && typeof data.ai_insights === "string") {
      try {
        insights = JSON.parse(data.ai_insights);
      } catch (e) {
        insights = { error: data.ai_insights };
      }
    } else {
      insights = data.ai_insights || {};
    }

    return (
      <div className="prose prose-sm max-w-none">
        <h3 className="text-lg font-semibold text-blue-600">
          📊 Competitive Intelligence Analysis
        </h3>

        {/* Gemini Analysis Status */}
        {data.gemini_analysis && data.gemini_analysis.error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              🤖 <strong>Gemini AI:</strong> {data.gemini_analysis.error}
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Using basic competitive analysis instead.
            </p>
          </div>
        )}

        {/* Gemini AI Strategic Analysis */}
        {data.gemini_analysis &&
          data.gemini_analysis.gemini_insights &&
          !data.gemini_analysis.error && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-purple-600 mb-4">
                🤖 Gemini AI Strategic Analysis
              </h4>

              {/* Competitive Position Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-700">Position</h5>
                  <p className="text-lg font-bold text-blue-800">
                    {data.gemini_analysis.gemini_insights.competitive_position || "Analyzing..."}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-700">Overall Score</h5>
                  <p className="text-lg font-bold text-green-800">
                    {data.gemini_analysis.gemini_insights.overall_score || "N/A"}/100
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                  <h5 className="font-semibold text-amber-700">Priority Actions</h5>
                  <p className="text-lg font-bold text-amber-800">
                    {data.gemini_analysis.gemini_insights.strategic_recommendations?.filter(
                      (r: any) => r.priority === "High"
                    ).length || 0}{" "}
                    High
                  </p>
                </div>
              </div>

              {/* Strategic Recommendations Table */}
              {data.gemini_analysis.gemini_insights.strategic_recommendations && (
                <div className="mb-4">
                  <h5 className="text-md font-semibold mb-2">📋 Strategic Recommendations</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-50 to-purple-100">
                          <th className="border border-border px-3 py-2 text-left text-sm font-semibold text-purple-800">
                            Priority
                          </th>
                          <th className="border border-border px-3 py-2 text-left text-sm font-semibold text-purple-800">
                            Action Required
                          </th>
                          <th className="border border-border px-3 py-2 text-left text-sm font-semibold text-purple-800">
                            Expected Impact
                          </th>
                          <th className="border border-border px-3 py-2 text-left text-sm font-semibold text-purple-800">
                            Effort Level
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gemini_analysis.gemini_insights.strategic_recommendations
                          .slice(0, 5)
                          .map((rec: any, index: number) => (
                            <tr
                              key={index}
                              className={index % 2 === 0 ? "bg-white" : "bg-purple-25"}
                            >
                              <td className="border border-border px-3 py-2 text-sm">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    rec.priority === "High"
                                      ? "bg-red-100 text-red-800"
                                      : rec.priority === "Medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                              </td>
                              <td className="border border-border px-3 py-2 text-sm font-medium">
                                {rec.action}
                              </td>
                              <td className="border border-border px-3 py-2 text-sm">
                                {rec.impact}
                              </td>
                              <td className="border border-border px-3 py-2 text-sm">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs ${
                                    rec.effort === "High"
                                      ? "bg-red-50 text-red-700"
                                      : rec.effort === "Medium"
                                      ? "bg-yellow-50 text-yellow-700"
                                      : "bg-green-50 text-green-700"
                                  }`}
                                >
                                  {rec.effort}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline Recommendations */}
              {data.gemini_analysis.gemini_insights.timeline_recommendations && (
                <div className="mb-4">
                  <h5 className="text-md font-semibold mb-2">⏰ Implementation Timeline</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h6 className="font-semibold text-red-700 mb-2">🚨 Immediate (This Week)</h6>
                      <ul className="text-sm text-red-600 space-y-1">
                        {data.gemini_analysis.gemini_insights.timeline_recommendations.immediate?.map(
                          (action: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              {action}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h6 className="font-semibold text-yellow-700 mb-2">📅 30 Days</h6>
                      <ul className="text-sm text-yellow-600 space-y-1">
                        {data.gemini_analysis.gemini_insights.timeline_recommendations[
                          "30_days"
                        ]?.map((action: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h6 className="font-semibold text-green-700 mb-2">🎯 90 Days</h6>
                      <ul className="text-sm text-green-600 space-y-1">
                        {data.gemini_analysis.gemini_insights.timeline_recommendations[
                          "90_days"
                        ]?.map((action: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini Strengths & Weaknesses Analysis */}
              {data.gemini_analysis.gemini_insights.key_strengths && (
                <div className="mb-4">
                  <h5 className="text-md font-medium text-green-700">
                    💪 Key Strengths (Gemini Analysis)
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-green-200">
                      <thead>
                        <tr className="bg-gradient-to-r from-green-50 to-green-100">
                          <th className="border border-green-200 px-4 py-2 text-left text-sm font-semibold text-green-800">
                            Competitive Strength
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gemini_analysis.gemini_insights.key_strengths.map(
                          (strength: string, index: number) => (
                            <tr
                              key={index}
                              className={index % 2 === 0 ? "bg-green-25" : "bg-white"}
                            >
                              <td className="border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                {strength}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.gemini_analysis.gemini_insights.critical_weaknesses && (
                <div className="mb-4">
                  <h5 className="text-md font-medium text-red-700">
                    ⚠️ Critical Weaknesses (Gemini Analysis)
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-red-200">
                      <thead>
                        <tr className="bg-gradient-to-r from-red-50 to-red-100">
                          <th className="border border-red-200 px-4 py-2 text-left text-sm font-semibold text-red-800">
                            Area for Improvement
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gemini_analysis.gemini_insights.critical_weaknesses.map(
                          (weakness: string, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-red-25" : "bg-white"}>
                              <td className="border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center">
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                {weakness}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Enhanced Website Comparison Table */}
        {data.website_comparison && data.website_comparison.metrics && (
          <div className="mb-4">
            <h4 className="text-md font-medium">🆚 Detailed Website Metrics Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-blue-800">
                      Category
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-blue-800">
                      Metric
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-blue-800">
                      My Website
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-blue-800">
                      Competitor
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-blue-800">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.website_comparison.metrics.map((metric: any, index: number) => {
                    const isWinning = metric.my_site > metric.competitor;
                    const isTie = metric.my_site === metric.competitor;
                    const category = metric.category || "General";

                    // Category color mapping
                    const categoryColors: { [key: string]: string } = {
                      "Content Quality": "bg-purple-50",
                      "Content Structure": "bg-blue-50",
                      "SEO Optimization": "bg-green-50",
                      "Link Profile": "bg-yellow-50",
                      "Media & Images": "bg-pink-50",
                      "Social Media": "bg-indigo-50",
                      "Technical Performance": "bg-red-50",
                      Monetization: "bg-emerald-50",
                      "User Experience": "bg-orange-50",
                    };

                    return (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-25"
                        } hover:bg-blue-25 transition-colors`}
                      >
                        <td
                          className={`border border-border px-4 py-3 text-xs font-medium text-gray-600 ${
                            categoryColors[category] || "bg-gray-50"
                          }`}
                        >
                          {category}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm font-medium text-gray-800">
                          {metric.metric}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm font-semibold text-blue-700">
                          {typeof metric.my_site === "number"
                            ? metric.my_site.toLocaleString()
                            : metric.my_site}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm font-semibold text-purple-700">
                          {typeof metric.competitor === "number"
                            ? metric.competitor.toLocaleString()
                            : metric.competitor}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                                isTie
                                  ? "bg-yellow-100 text-yellow-800"
                                  : isWinning
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isTie ? "🤝 Tie" : isWinning ? "🟢 Leading" : "🔴 Behind"}
                            </span>
                            {!isTie && (
                              <span className="text-xs text-gray-500 ml-2">
                                {Math.abs(
                                  ((metric.my_site - metric.competitor) /
                                    Math.max(metric.competitor, 1)) *
                                    100
                                ).toFixed(1)}
                                %
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {insights.error ? (
          <p className="text-red-500">
            💡 <strong>AI Insights:</strong> {insights.error}
          </p>
        ) : (
          <>
            {insights.market_gaps && insights.market_gaps.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🔍 Market Gaps</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Market Gap
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.market_gaps.map((gap: string, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {gap}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.bidding_strategy && (
              <div className="mb-4">
                <h4 className="text-md font-medium">💸 Bidding Strategy</h4>
                <div className="border border-border p-4 bg-card rounded text-foreground">
                  {insights.bidding_strategy}
                </div>
              </div>
            )}
            {insights.key_differentiators && insights.key_differentiators.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🌟 Key Differentiators</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Differentiator
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.key_differentiators.map((diff: string, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.target_audience && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🎯 Target Audience</h4>
                <div className="border border-border p-4 bg-card rounded text-foreground">
                  {insights.target_audience}
                </div>
              </div>
            )}
            {insights.campaign_angles && insights.campaign_angles.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium">📣 Campaign Angles</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                          Angle
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.campaign_angles.map((angle: string, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                          <td className="border border-border px-4 py-2 text-sm text-foreground">
                            {angle}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insights.competitive_advantage && (
              <div className="mb-4">
                <h4 className="text-md font-medium">🏆 Competitive Advantage</h4>
                <div className="border border-border p-4 bg-card rounded text-foreground">
                  {insights.competitive_advantage}
                </div>
              </div>
            )}
          </>
        )}
        {data.top_competitors && data.top_competitors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium">🏅 Top Competitors</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Domain
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Mentions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_competitors.map((comp: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {comp.domain}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {comp.mentions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data.competitor_analysis && data.competitor_analysis.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium">🔎 Competitor Analysis</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Title
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Snippet
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitor_analysis.slice(0, 3).map((content: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {content.title}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {content.snippet ? `${content.snippet.substring(0, 100)}...` : "N/A"}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Read more
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data.market_trends && data.market_trends.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium">📈 Market Trends</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Trend
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Snippet
                    </th>
                    <th className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.market_trends.slice(0, 3).map((trend: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {trend.title}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        {trend.snippet ? `${trend.snippet.substring(0, 100)}...` : "N/A"}
                      </td>
                      <td className="border border-border px-4 py-2 text-sm text-foreground">
                        <a
                          href={trend.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Read more
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleExaSearch = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: `🔍 Web Search: ${inputValue.trim()}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const searchQuery = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const loadingMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "Searching the web for content strategy insights... 🌐",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      const response = await fetch("http://localhost:8000/publisher/exa-content-strategy", {
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

      let responseContent: JSX.Element;
      if (data.error) {
        responseContent = (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ <strong>Error:</strong> {data.error}
            </p>
            <p>Please make sure the Exa API is configured properly.</p>
          </div>
        );
      } else {
        responseContent = formatExaResults(data);
      }

      const botResponse: Message = {
        id: messages.length + 3,
        type: "bot",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([botResponse]));
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ Sorry, web search failed:
              <br />
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <p>Please make sure the backend server is running and Exa API is configured.</p>
          </div>
        ),
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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
        content: "Analyzing your request... ⏳",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages(prev => [...prev, loadingMessage]);

      const urlPattern = /https?:\/\/[^\s]+/;
      const isCompetitiveAnalysis =
        urlPattern.test(inputValue) &&
        (inputValue.toLowerCase().includes("competitor") ||
          inputValue.toLowerCase().includes("competitive"));
      const endpoint = isCompetitiveAnalysis
        ? "http://localhost:8000/publisher/competitive-analysis"
        : inputValue.toLowerCase().includes("competitor") ||
          inputValue.toLowerCase().includes("competitive")
        ? "http://localhost:8000/publisher/competitive-intelligence"
        : "http://localhost:8000/publisher/query";

      const body = isCompetitiveAnalysis
        ? { url: inputValue.match(urlPattern)?.[0] }
        : { query: userMessage.content };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseContent: JSX.Element;
      if (data.error) {
        responseContent = (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ <strong>Error:</strong> {data.error}
            </p>
            <p>
              Try asking about:
              <ul>
                <li>Revenue and earnings</li>
                <li>Impressions</li>
                <li>Clicks and CTR</li>
                <li>RPM/eCPM</li>
                <li>Geography breakdown</li>
                <li>Competitive intelligence</li>
              </ul>
            </p>
          </div>
        );
      } else {
        responseContent =
          data.service === "competitive_analysis"
            ? formatMetricData(data)
            : inputValue.toLowerCase().includes("competitor") ||
              inputValue.toLowerCase().includes("competitive")
            ? formatCompetitiveIntelligence(data)
            : formatMetricData(data);
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
        content: (
          <div className="prose prose-sm max-w-none">
            <p className="text-red-500">
              ❌ Sorry, I encountered an error:
              <br />
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <p>Please make sure the backend server is running.</p>
          </div>
        ),
        timestamp: new Date(),
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isWebSearchMode) {
        handleExaSearch();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
                <span className="text-accent font-medium">Publisher</span>
                <Link
                  to="/advertiser"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Advertiser
                </Link>
                <Link
                  to="/predict"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Predict
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

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-hidden p-4">
          <div className="max-w-4xl mx-auto h-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-2xl h-full">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-6">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === "user" ? "justify-end" : "justify-start"
                          }`}
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
                                  {typeof message.content === "string" ? (
                                    <div
                                      className="leading-relaxed whitespace-pre-wrap break-words"
                                      dangerouslySetInnerHTML={{
                                        __html: message.content
                                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                          .replace(/\n/g, "<br />"),
                                      }}
                                    />
                                  ) : (
                                    message.content
                                  )}
                                  {message.chartData && (
                                    <div className="mt-4">
                                      {message.chartData.primary ? (
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
                                        <ChartRenderer
                                          chartData={message.chartData}
                                          width={350}
                                          height={250}
                                          className="w-full"
                                        />
                                      )}
                                    </div>
                                  )}
                                  <div
                                    className={`text-xs mt-2 ${
                                      message.type === "user"
                                        ? "text-accent-foreground/70"
                                        : "text-muted-foreground"
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
                                      <span className="text-sm text-foreground">Processing...</span>
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

                <div className="border-t border-border/40 p-4 bg-card/30 backdrop-blur-sm">
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                          isWebSearchMode
                            ? "🔍 Web Search Mode: Enter topic for content strategy analysis..."
                            : "Ask about revenue, impressions, RPM, or paste a URL to analyze..."
                        }
                        disabled={isLoading}
                        className={isWebSearchMode ? "border-blue-500 bg-blue-50/20" : ""}
                      />
                      {isWebSearchMode && (
                        <div className="absolute -top-6 left-0 text-xs text-blue-600 font-medium">
                          🔍 Web Search Active
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setIsWebSearchMode(!isWebSearchMode);
                        if (!isWebSearchMode) {
                          setInputValue("");
                        }
                      }}
                      size="icon"
                      variant={isWebSearchMode ? "default" : "outline"}
                      title="Toggle Web Search Mode"
                    >
                      <Search className={`h-4 w-4 ${isWebSearchMode ? "text-white" : ""}`} />
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

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Show me today's revenue")}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Revenue
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("What's my RPM this month?")}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" />
                      RPM
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => setInputValue("Geography breakdown")}
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      Geography
                    </Badge>
                    <Dialog open={isCompAnalysisOpen} onOpenChange={setIsCompAnalysisOpen}>
                      <DialogTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent/20 transition-colors"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          Competitive Analysis
                        </Badge>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Competitive Analysis Setup</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Your Website URL
                            </label>
                            <Input
                              placeholder="https://your-website.com"
                              value={myWebsiteUrl}
                              onChange={e => setMyWebsiteUrl(e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Competitor URLs
                            </label>
                            <div className="space-y-2">
                              {competitorUrls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    placeholder={`https://competitor-${index + 1}.com`}
                                    value={url}
                                    onChange={e => updateCompetitorUrl(index, e.target.value)}
                                    className="flex-1"
                                  />
                                  {competitorUrls.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => removeCompetitorUrl(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCompetitorUrl}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Competitor
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCompAnalysisOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCompetitiveAnalysis}>Analyze Competition</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent/20 transition-colors"
                      onClick={() => {
                        setIsWebSearchMode(true);
                        setInputValue("AI content marketing trends 2025");
                      }}
                    >
                      <Search className="mr-1 h-3 w-3" />
                      Web Search
                    </Badge>
                    <Dialog open={isCompIntelligenceOpen} onOpenChange={setIsCompIntelligenceOpen}>
                      <DialogTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent/20 transition-colors"
                        >
                          <Search className="mr-1 h-3 w-3" />
                          Competitive Intelligence
                        </Badge>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Competitive Intelligence Analysis</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Your Website URL
                            </label>
                            <Input
                              placeholder="https://your-website.com"
                              value={myWebsiteUrlCI}
                              onChange={e => setMyWebsiteUrlCI(e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Competitor Website URL
                            </label>
                            <Input
                              placeholder="https://competitor-website.com"
                              value={competitorWebsiteCI}
                              onChange={e => setCompetitorWebsiteCI(e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsCompIntelligenceOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCompetitiveIntelligence}>
                              Analyze Intelligence
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
