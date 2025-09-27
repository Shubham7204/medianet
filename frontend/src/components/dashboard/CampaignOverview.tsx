import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, DollarSign, Target } from "lucide-react";

interface CampaignOverviewProps {
  campaignData: any;
}

export function CampaignOverview({ campaignData }: CampaignOverviewProps) {
  // Calculate aggregate metrics from keyword data
  const keywordData = campaignData?.keyword_dashboard_data || [];

  const totalRevenue = keywordData.reduce(
    (sum: number, kw: any) => sum + (kw.projected_monthly_revenue || 0),
    0
  );
  const totalSpend = keywordData.reduce(
    (sum: number, kw: any) => sum + (kw.estimated_monthly_cost || 0),
    0
  );
  const totalConversions = keywordData.reduce(
    (sum: number, kw: any) => sum + (kw.projected_monthly_conversions || 0),
    0
  );
  const totalROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalROI = totalROAS > 0 ? totalROAS - 1 : 0;
  const avgCTR = 3.5; // Standard assumption

  return (
    <div className="space-y-6">
      {/* ROI Metrics Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <TrendingUp className="h-5 w-5" />
            ROI Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-sm text-muted-foreground">ROI:</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{totalROI.toFixed(2)}x</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="text-sm text-muted-foreground">ROAS:</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{totalROAS.toFixed(2)}x</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Revenue:</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${Math.round(totalRevenue).toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Conversions:</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(totalConversions)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Company:</span>
              <p className="font-medium text-foreground">
                {campaignData?.campaign_inputs?.company_name || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Target Audience:</span>
              <p className="font-medium text-pretty text-foreground">
                {campaignData?.campaign_inputs?.audience_target_type || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Location:</span>
              <p className="font-medium text-foreground">
                {campaignData?.campaign_inputs?.city || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Website:</span>
              <p className="font-medium text-accent">
                {campaignData?.campaign_inputs?.company_website || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Ad Spend:</span>
              <span className="font-medium text-foreground">
                ${Math.round(totalSpend).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average CTR:</span>
              <span className="font-medium text-foreground">{avgCTR}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost per Conversion:</span>
              <span className="font-medium text-foreground">
                ${totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue per Conversion:</span>
              <span className="font-medium text-green-400">
                ${totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : "0"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Strategy Summary */}
      {campaignData?.ai_driven_strategy && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">AI Strategy Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-pretty leading-relaxed mb-4">
              {campaignData.ai_driven_strategy.executive_summary}
            </p>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Key Recommendations:</h4>
              <ul className="space-y-2">
                {campaignData.ai_driven_strategy.strategic_recommendations?.map(
                  (rec: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-accent"
                    >
                      {rec}
                    </li>
                  )
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
