import React, { useState } from 'react';
import { 
  Car, Bus, PersonStanding, Clock, Users, Shield, Bell, Check, X,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Smartphone,
  QrCode, MessageSquare, Zap, TrendingDown, Lock, Globe, ArrowRight,
  Play, Star, Building, GraduationCap, Heart, Timer, MapPin, Eye
} from 'lucide-react';

// Utility Components
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', onClick, className = '' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    dark: 'bg-gray-900 text-white hover:bg-gray-800',
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

// Main Marketing Page
export default function GoPilotMarketing() {
  const [studentCount, setStudentCount] = useState(500);
  const [showDemo, setShowDemo] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Pricing calculation
  const basePrice = 400;
  const perStudent = 2.00;
  const totalPrice = basePrice + (studentCount * perStudent);
  const monthlyPrice = (totalPrice / 12).toFixed(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">GoPilot</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
              <Button variant="primary" size="sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="green" className="mb-4">
              <Zap className="w-4 h-4 mr-1" />
              Now Available
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              School Dismissal,<br />
              <span className="text-indigo-600">Made Safe & Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Real-time parent check-in, instant teacher notifications, and verified pickups. 
              Streamline your car line while keeping every student safe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setShowDemo(true)}>
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: 'Real-time', label: 'Parent Check-in', icon: MapPin },
              { value: 'Verified', label: 'Pickup System', icon: Shield },
              { value: '3 Ways', label: 'To Check In', icon: Smartphone },
              { value: 'Instant', label: 'Teacher Alerts', icon: Bell },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dismissal Shouldn't Be This Hard</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every day, schools face the same challenges at pickup time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: '30+ Minute Car Lines',
                description: 'Parents idling in endless lines, teachers managing chaos, and everyone frustrated.',
              },
              {
                icon: AlertTriangle,
                title: 'Safety Concerns',
                description: 'Last-minute changes, unauthorized pickups, and no verification system in place.',
              },
              {
                icon: Users,
                title: 'Communication Gaps',
                description: 'Teachers don\'t know who\'s coming, office staff overwhelmed with calls.',
              },
            ].map((problem, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-6">
                <problem.icon className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-gray-400">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution / Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="blue" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Safe, Fast Dismissals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              GoPilot connects parents, teachers, and office staff in real-time.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: 'Multiple Check-in Methods',
                description: 'Parents choose: app tap, SMS text, or QR code. Whatever works best for your families.',
                color: 'indigo',
              },
              {
                icon: Bell,
                title: 'Instant Teacher Alerts',
                description: 'Teachers get notified the moment a parent arrives. One tap to dismiss.',
                color: 'green',
              },
              {
                icon: Shield,
                title: 'Verified Pickups',
                description: 'Authorized pickup lists, photo ID matching, and custody alert flags.',
                color: 'red',
              },
              {
                icon: Timer,
                title: 'Real-time Queue',
                description: 'Parents see their position and wait time. No more guessing.',
                color: 'yellow',
              },
              {
                icon: Bus,
                title: 'Bus & Walker Support',
                description: 'Not just car riders. Manage all dismissal types from one dashboard.',
                color: 'blue',
              },
              {
                icon: TrendingDown,
                title: 'Analytics & Reports',
                description: 'Track dismissal times, identify bottlenecks, and prove efficiency gains.',
                color: 'purple',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="green" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple for Everyone
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Parent Arrives', description: 'Tap "I\'m Here" in the app, text a code, or show QR tag', icon: MapPin },
              { step: 2, title: 'Added to Queue', description: 'Parent sees position and estimated wait time', icon: Users },
              { step: 3, title: 'Teacher Notified', description: 'Instant alert with one-tap dismiss button', icon: Bell },
              { step: 4, title: 'Safe Pickup', description: 'Staff verifies and confirms pickup complete', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="purple" className="mb-4">Transparent Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Affordable Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. No per-teacher charges. No sales calls required.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pricing Calculator */}
            <div className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Calculate Your Price</h3>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Students
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>100</span>
                  <span className="font-semibold text-indigo-600 text-lg">{studentCount} students</span>
                  <span>2,000</span>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Annual Price</p>
                    <p className="text-4xl font-bold text-indigo-600">${totalPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Per Month</p>
                    <p className="text-2xl font-semibold text-gray-900">${monthlyPrice}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>$400 base + ${perStudent.toFixed(2)}/student</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Unlimited teachers & staff accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>All three check-in methods included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Parent app for iOS & Android</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Google Workspace integration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Email & chat support</span>
                </div>
              </div>

              <Button variant="primary" size="lg" className="w-full">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Value Highlights */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why Schools Choose GoPilot</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Transparent Pricing</p>
                    <p className="text-sm text-gray-400">See your exact price instantly – no sales calls required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Per-Student Pricing</p>
                    <p className="text-sm text-gray-400">Pay for what you use – scales with your school</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No Hardware Required</p>
                    <p className="text-sm text-gray-400">Works on any device – phones, tablets, computers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Quick Setup</p>
                    <p className="text-sm text-gray-400">Connect Google Workspace and go live in under 30 minutes</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                <p className="text-green-400 text-sm font-medium mb-1">Affordable for Any School</p>
                <p className="text-2xl font-bold text-green-400">Starting at $500/year</p>
                <p className="text-green-400/80 text-sm">for schools with 50 students</p>
              </div>
            </div>
          </div>

          {/* Skip Trial Offer */}
          <div className="mt-12 bg-indigo-600 rounded-3xl p-8 text-white text-center max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Ready to Commit?</h3>
            <p className="text-indigo-100 mb-6">
              Skip the trial and get <span className="font-bold">2 months free</span> when you sign up for an annual plan today.
            </p>
            <Button variant="dark" size="lg">
              Get 2 Months Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="blue" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How long does setup take?',
                a: 'Most schools are up and running within 30 minutes. Connect Google Workspace, create homerooms, set dismissal types, and you\'re ready. We also offer free onboarding support.',
              },
              {
                q: 'Do we need special hardware?',
                a: 'No! GoPilot works on any device with a web browser. Teachers can use their phones, tablets, or classroom computers. Parents use our free iOS/Android app.',
              },
              {
                q: 'What if parents don\'t have smartphones?',
                a: 'No problem. We offer three check-in methods: app, SMS text message, or QR code tags. Schools can enable whichever methods work for their community.',
              },
              {
                q: 'How do custody alerts work?',
                a: 'Administrators can flag specific individuals who are not allowed to pick up a student. If they check in, the system immediately alerts office staff and blocks the pickup.',
              },
              {
                q: 'Can we try before we buy?',
                a: 'Absolutely! We offer a 30-day free trial with full features. No credit card required. You can also get 2 months free if you commit to an annual plan.',
              },
              {
                q: 'Is our data secure?',
                a: 'Yes. GoPilot is SOC 2 compliant, uses 256-bit encryption, and never sells student data. We comply with FERPA and all applicable privacy regulations.',
              },
            ].map((faq, i) => (
              <div 
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready for Safer, Faster Dismissals?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            See why schools are switching to GoPilot for their dismissal management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="dark" size="lg">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="secondary" size="lg">
              Schedule Demo
            </Button>
          </div>
          <p className="text-indigo-200 text-sm mt-6">
            Questions? Email us at hello@gopilot.com or call (555) 123-4567
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">GoPilot</span>
              </div>
              <p className="text-sm">
                Safe, simple school dismissal management for K-8 schools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">FERPA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>© 2025 GoPilot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
