import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  Shield, 
  Bell,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  BarChart3,
  Calendar,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';

export default function LandingPage() {

  const features = [
    {
      icon: DollarSign,
      title: "Fees & Revenue Control",
      description: "Track every payment, partial payment, and outstanding balance effortlessly.",
    },
    {
      icon: FileText,
      title: "Smart Results Management",
      description: "Generate professional report cards and results in minutes, not days.",
    },
    {
      icon: Bell,
      title: "Automated Notifications",
      description: "Keep parents informed with SMS alerts for results, payments, and updates.",
    },
    {
      icon: Calendar,
      title: "Complete Records",
      description: "Maintain accurate history across sessions, terms, and years.",
    }
  ];

  const stats = [
    { value: "500+", label: "Nigerian Schools", icon: Users },
    { value: "100K+", label: "Students Managed", icon: BookOpen },
    { value: "₦5B+", label: "Fees Processed", icon: DollarSign },
    { value: "98%", label: "Parent Satisfaction", icon: Star }
  ];

  const testimonials = [
    {
      quote: "SkoolRise transformed how we track school fees. No more leakages or missing records. It's a game-changer!",
      author: "Mrs. Adewale",
      role: "School Administrator",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Adewale"
    },
    {
      quote: "Generating results used to take us 3 weeks. Now it takes 30 minutes. Parents are impressed with the professionalism.",
      author: "Mr. Okafor",
      role: "Headteacher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Okafor"
    },
    {
      quote: "The SMS notifications alone saved us countless phone calls. Parents now receive updates instantly.",
      author: "Dr. Ibrahim",
      role: "School Owner",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim"
    }
  ];

  const problems = [
    "Fee leakages",
    "Missing records",
    "Manual calculations",
    "Late reports",
    "Poor communication",
    "Lost files",
    "Parent complaints",
    "Staff overwhelm"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise" 
                className="h-10 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-gray-700"
                onClick={() => base44.auth.redirectToLogin()}
              >
                Login
              </Button>
              <Link to={createPageUrl('PublicApplicationForm')}>
                <Button className="bg-black hover:bg-gray-800 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            200K+ Students Managed Daily with SkoolRise
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            School Management<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-purple-600">
              Made Simple and Powerful
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take full control of fees, records, results, and communication. Built specifically for Nigerian school owners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to={createPageUrl('PublicApplicationForm')}>
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-full">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="flex -space-x-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <span>4.9 rating</span>
            <span className="text-gray-400">Based on 500+ Schools</span>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white bg-white">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-xl font-bold">₦45.2M</p>
                        </div>
                      </div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +12.5% this term
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">Students</p>
                          <p className="text-xl font-bold">1,247</p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        98% attendance
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">Reports</p>
                          <p className="text-xl font-bold">342</p>
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Generated today
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to<br />Manage Your School
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for Nigerian schools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave Goodbye Section */}
      <section className="py-20 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">Wave goodbye to</h2>
          <div className="flex gap-6 animate-scroll">
            {[...problems, ...problems].map((problem, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="px-8 py-4 bg-white/10 rounded-full backdrop-blur-sm">
                  <span className="text-xl font-semibold whitespace-nowrap">{problem}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-0">Testimonials</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              What School Owners<br />Are Saying About Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-0">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Start free, upgrade as you grow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-gray-600 mb-6">Perfect for small schools</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Up to 100 students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Basic reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Email support</span>
                  </li>
                </ul>
                <Link to={createPageUrl('PublicApplicationForm')}>
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-4 border-purple-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-gray-600 mb-6">Ideal for growing schools</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₦25,000</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Up to 500 students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">SMS notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Priority support</span>
                  </li>
                </ul>
                <Link to={createPageUrl('PublicApplicationForm')}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">For large institutions</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unlimited students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Multiple branches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Custom integrations</span>
                  </li>
                </ul>
                <Link to={createPageUrl('PublicApplicationForm')}>
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-600 to-orange-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Transform<br />Your School?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join hundreds of Nigerian schools saving time and earning parent trust
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('PublicApplicationForm')}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-full">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/80 mt-6">
              ✓ No credit card required  ✓ Setup in 15 minutes  ✓ Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise" 
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm">
                Smart School Management for Nigerian Schools
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={createPageUrl('PublicApplicationForm')} className="text-gray-400 hover:text-white transition-colors">
                    Apply Now
                  </Link>
                </li>
                <li>
                  <button onClick={() => base44.auth.redirectToLogin()} className="text-gray-400 hover:text-white transition-colors">
                    Login
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={createPageUrl('PrivacyPolicy')} className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('TermsOfService')} className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © 2025 SkoolRise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}