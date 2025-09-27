import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { BarChart3, Target, TrendingUp, Shield, Zap, Bot, Smartphone, Globe, Eye } from 'lucide-react';
import RAGChatBot from './RAGChatBot';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
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
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Zap className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
              MediaNet Analytics <span className="text-accent">Suite</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
              Your complete digital advertising analytics platform with AI-powered insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Start Building
                <TrendingUp className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground mb-8">Trusted by leading publishers and advertisers</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
            <div className="text-center font-semibold text-lg">AdTech Pro</div>
            <div className="text-center font-semibold text-lg">PublishMax</div>
            <div className="text-center font-semibold text-lg">RevBoost</div>
            <div className="text-center font-semibold text-lg">MediaFlow</div>
            <div className="text-center font-semibold text-lg">AdInsight</div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Complete Analytics Platform</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Everything you need to optimize your digital advertising performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold">Publisher Analytics</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-pretty">
                  Track your website's revenue, RPM, impressions, and geographic performance with our intelligent
                  chatbot assistant.
                </p>
                <Link to="/publisher">
                  <Button variant="outline">
                    View Analytics
                    <TrendingUp className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold">Advertiser Dashboard</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-pretty">
                  Monitor your ad campaigns, track conversions, analyze costs, and optimize ROI with real-time insights.
                </p>
                <Link to="/advertiser">
                  <Button variant="outline">
                    View Campaigns
                    <Eye className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold">Marketing Predictor</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-pretty">
                  Get AI-powered marketing predictions, trend analysis, and future forecasts to optimize your campaigns.
                </p>
                <Link to="/predict">
                  <Button variant="outline">
                    View Predictions
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-accent mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Faster insights</div>
                <div className="text-xs text-muted-foreground mt-1">with AI analysis</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-accent mb-2">300%</div>
                <div className="text-sm text-muted-foreground">ROI increase</div>
                <div className="text-xs text-muted-foreground mt-1">average improvement</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-accent mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Real-time data</div>
                <div className="text-xs text-muted-foreground mt-1">continuous monitoring</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-accent mb-2">5x</div>
                <div className="text-sm text-muted-foreground">Faster setup</div>
                <div className="text-xs text-muted-foreground mt-1">than competitors</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">AI-Powered Intelligence</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Advanced chatbot assistants that understand your data and provide actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <Shield className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground text-pretty">
                  Bank-level encryption and compliance with industry standards to keep your data safe.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <Zap className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">Real-time Updates</h3>
                <p className="text-muted-foreground text-pretty">
                  Get instant notifications and live data updates as your campaigns perform.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <Bot className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">Knowledge Assistant</h3>
                <p className="text-muted-foreground text-pretty">
                  AI-powered chatbot that answers questions from your documentation and knowledge base. Try the assistant in the bottom-right corner!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to transform your analytics?</h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Join thousands of publishers and advertisers who trust MediaNet Analytics Suite
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
              <TrendingUp className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              Schedule Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Global Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Mobile Responsive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">MediaNet Analytics Suite</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2025 MediaNet Analytics Suite. Built for the hackathon with ❤️</p>
          </div>
        </div>
      </footer>

      {/* RAG AI Assistant - Side Popup */}
      <RAGChatBot />
    </div>
  );
};

export default LandingPage;