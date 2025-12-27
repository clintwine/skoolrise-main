import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield, 
  MessageSquare, 
  CheckCircle,
  BarChart3,
  Bell,
  Sparkles,
  Building2,
  ArrowRight,
  Calendar,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function LandingPage() {
  const features = [
    {
      icon: DollarSign,
      title: "Fees & Revenue Control",
      description: "Track fees by student, class, term, and session. Know who has paid, who hasn't — instantly.",
      benefits: [
        "Reduce leakages and excuses",
        "Support partial payments",
        "Never lose track of school fees again"
      ],
      color: "bg-green-50 text-green-600"
    },
    {
      icon: Shield,
      title: "Look Organized. Build Trust",
      description: "Clean report cards, SMS notifications, and digital records instead of scattered files.",
      benefits: [
        "Parents see your school as serious and modern",
        "SMS notifications for results & payments",
        "Professional digital records"
      ],
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Clock,
      title: "Save Time & Reduce Stress",
      description: "Less paperwork. More peace of mind. Stop rewriting registers every term.",
      benefits: [
        "Generate results in minutes, not days",
        "No more missing files or calculation errors",
        "Works with basic computer knowledge"
      ],
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const capabilities = [
    { icon: Users, text: "Supports large and small schools" },
    { icon: Building2, text: "Ready for multiple branches" },
    { icon: Database, text: "Maintain accurate history across years" },
    { icon: TrendingUp, text: "Add new classes and students easily" },
    { icon: Shield, text: "Multiple staff roles with proper access" },
    { icon: MessageSquare, text: "Works well with limited internet setups" }
  ];

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('PublicApplicationForm')}>
                <Button variant="ghost">Apply Now</Button>
              </Link>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Trusted by Forward-Thinking Nigerian Schools
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Run Your School Better.<br />
              <span className="text-blue-600">Grow With Confidence.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              SkoolRise gives Nigerian school owners full control of fees, records, results, and communication — all in one smart system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('PublicApplicationForm')}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={scrollToFeatures}
              >
                See How It Works
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ No credit card required  ✓ Setup in minutes  ✓ Works offline
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-xl text-gray-600">
              Fees, results, records, and communication — in one simple system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-lg ${feature.color} flex items-center justify-center mb-6`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Nigerian Schools
            </h2>
            <p className="text-xl text-gray-600">
              From small schools to growing institutions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-gray-900 font-medium">{capability.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Schools Choose SkoolRise
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Never Lose Track of Fees Again
                    </h3>
                    <p className="text-gray-600">
                      Track every payment, partial payment, and outstanding balance. Reduce leakages and know your real revenue at any time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Professional Reports in Minutes
                    </h3>
                    <p className="text-gray-600">
                      Generate clean, professional report cards and results instantly. No more manual calculations or formatting errors.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Keep Parents Informed
                    </h3>
                    <p className="text-gray-600">
                      Automated SMS notifications for results, payments, and important updates. Build trust through better communication.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Maintain Complete History
                    </h3>
                    <p className="text-gray-600">
                      Keep records across sessions, terms, and years. No more lost files or missing student information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
              <h3 className="text-2xl sm:text-3xl font-bold mb-6">
                Ready to Transform Your School?
              </h3>
              <p className="text-blue-100 mb-8 text-lg">
                Join hundreds of Nigerian schools that are saving time, reducing stress, and earning parent trust with SkoolRise.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <span>Setup in 15 minutes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <span>Free trial - no credit card needed</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <span>Works with basic computer skills</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <span>Nigerian school-specific features</span>
                </li>
              </ul>
              <Link to={createPageUrl('PublicApplicationForm')}>
                <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-gray-100 text-lg py-6">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Stop Losing Money. Start Growing.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get the system that gives you control, saves you time, and builds parent trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('PublicApplicationForm')}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" variant="outline" className="text-gray-900 bg-white hover:bg-gray-100 text-lg px-8 py-6">
                Login to Your School
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise Logo" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 SkoolRise. Smart School Management for Nigerian Schools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}