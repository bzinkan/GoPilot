import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Shield, Bell, Smartphone, Bus, Clock, ArrowRight, Check
} from 'lucide-react';

export default function GoPilotMarketing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-6">
                <Car className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                GoPilot
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                School Dismissal, Made Safe & Simple
              </p>
              <p className="text-lg mb-12 opacity-80 max-w-2xl mx-auto">
                Real-time parent check-in, instant teacher notifications, and verified pickups.
                Streamline your car line while keeping every student safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 shadow-lg"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition duration-200"
              >
                Log In
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <Clock className="w-8 h-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
                <p className="text-sm opacity-80">Know exactly when parents arrive and where every student is</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <Shield className="w-8 h-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Verified Pickups</h3>
                <p className="text-sm opacity-80">Authorized pickup lists and custody alert flags for every student</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <Bell className="w-8 h-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Instant Alerts</h3>
                <p className="text-sm opacity-80">Teachers notified the moment a parent checks in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Everything You Need for Safe Dismissals
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              GoPilot connects parents, teachers, and office staff in real-time
              to make dismissal smooth and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: 'Multiple Check-in Methods',
                description: 'Parents choose: app tap, SMS text, or QR code. Whatever works best for your families.',
                color: 'bg-indigo-500',
              },
              {
                icon: Bell,
                title: 'Instant Teacher Alerts',
                description: 'Teachers get notified the moment a parent arrives. One tap to dismiss the student.',
                color: 'bg-green-500',
              },
              {
                icon: Shield,
                title: 'Verified Pickups',
                description: 'Authorized pickup lists, photo ID matching, and custody alert flags.',
                color: 'bg-red-500',
              },
              {
                icon: Clock,
                title: 'Real-time Queue',
                description: 'Parents see their position and wait time. No more guessing or endless car lines.',
                color: 'bg-yellow-500',
              },
              {
                icon: Bus,
                title: 'Bus & Walker Support',
                description: 'Not just car riders. Manage all dismissal types from one dashboard.',
                color: 'bg-blue-500',
              },
              {
                icon: Car,
                title: 'Google Workspace Integration',
                description: 'Import students, teachers, and homerooms directly from Google Workspace.',
                color: 'bg-purple-500',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition duration-300">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Dismissal Process?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join schools already using GoPilot to create safer, faster dismissals.
            Set up in under 30 minutes with Google Workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 shadow-lg inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition duration-200"
            >
              Log In
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm opacity-80">
            <span className="flex items-center gap-1"><Check className="w-4 h-4" /> No credit card required</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4" /> 30-day free trial</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">GoPilot</span>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Safe, simple school dismissal management for K-8 schools.
            </p>

            <div className="mb-8">
              <a
                href="mailto:support@gopilotapp.com"
                className="text-indigo-400 hover:text-indigo-300"
              >
                support@gopilotapp.com
              </a>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <p className="text-sm text-gray-400">&copy; 2025 GoPilot. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
