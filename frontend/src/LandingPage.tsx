import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🚀 MediaNet Analytics Suite
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your complete digital advertising analytics platform with AI-powered insights
          </p>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="font-semibold text-gray-800">Website Analysis</h3>
              <p className="text-sm text-gray-600">AI-powered security, SEO & monetization insights</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-800">Publisher Analytics</h3>
              <p className="text-sm text-gray-600">Revenue, RPM, impressions & geographic data</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-800">Advertiser Insights</h3>
              <p className="text-sm text-gray-600">Campaign performance, CPC, ROI & conversions</p>
            </div>
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Website Analyzer */}
          <Link 
            to="/website-analyzer"
            className="group bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🤖
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Website Analyzer
            </h2>
            <p className="text-gray-600 mb-6">
              Get comprehensive analysis of any website including security vulnerabilities, SEO opportunities, and ad placement suggestions.
            </p>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">
              Analyze Website →
            </div>
          </Link>

          {/* Publisher Dashboard */}
          <Link 
            to="/publisher"
            className="group bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
              📊
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Publisher Analytics
            </h2>
            <p className="text-gray-600 mb-6">
              Track your website's revenue, RPM, impressions, and geographic performance with our intelligent chatbot assistant.
            </p>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-full font-semibold group-hover:from-indigo-500 group-hover:to-blue-500 transition-all duration-300">
              View Analytics →
            </div>
          </Link>

          {/* Advertiser Dashboard */}
          <Link 
            to="/advertiser"
            className="group bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🎯
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Advertiser Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Monitor your ad campaigns, track conversions, analyze costs, and optimize ROI with real-time insights.
            </p>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full font-semibold group-hover:from-teal-500 group-hover:to-cyan-500 transition-all duration-300">
              View Campaigns →
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
          <p className="text-gray-600 mb-4">
            Powered by AI and advanced analytics • Real-time data • Secure & Private
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>🔒 Enterprise Security</span>
            <span>⚡ Real-time Updates</span>
            <span>🤖 AI-Powered Insights</span>
            <span>📱 Mobile Responsive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;