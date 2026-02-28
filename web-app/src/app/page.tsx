'use client';

import Link from 'next/link';
import { Warehouse, TrendingUp, Shield, Zap, BarChart3, Radio, Package, Users, Bell, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Warehouse className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Smart Warehouse
            </span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className={`text-center mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Next-Gen IoT Inventory Management
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            Transform Your
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Warehouse Operations
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Real-time inventory tracking with IoT sensors, smart shelves, and AI-powered analytics. 
            Streamline operations and boost efficiency by up to 50%.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center space-x-2"
            >
              <span>Get Started Free</span>
              <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-xl font-bold text-lg hover:border-blue-600 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Activity className="w-5 h-5" />
              <span>Live Demo</span>
            </Link>
          </div>

          {/* Trusted By Badge */}
          <div className="mt-12 flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Trusted by leading enterprises worldwide</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <StatsCard number="99.9%" label="Uptime SLA" icon={<Activity className="w-8 h-8" />} />
          <StatsCard number="<2s" label="Real-time Sync" icon={<Zap className="w-8 h-8" />} />
          <StatsCard number="50%" label="Efficiency Boost" icon={<TrendingUp className="w-8 h-8" />} />
          <StatsCard number="24/7" label="IoT Monitoring" icon={<Radio className="w-8 h-8" />} />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to manage your warehouse efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Radio className="w-10 h-10" />}
            title="Real-time IoT Tracking"
            description="Monitor inventory levels instantly with IoT sensors and smart shelves. Get accurate stock counts 24/7."
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={<Bell className="w-10 h-10" />}
            title="Smart Alerts & Notifications"
            description="Automated alerts for low stock, sensor failures, temperature anomalies, and critical events."
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            icon={<BarChart3 className="w-10 h-10" />}
            title="Advanced Analytics"
            description="Comprehensive dashboards with insights on inventory trends, turnover rates, and forecasting."
            gradient="from-orange-500 to-red-500"
          />
          <FeatureCard
            icon={<Shield className="w-10 h-10" />}
            title="Role-Based Access Control"
            description="Secure multi-level access for admins, managers, staff, and viewers with granular permissions."
            gradient="from-green-500 to-emerald-500"
          />
          <FeatureCard
            icon={<Package className="w-10 h-10" />}
            title="Inventory Management"
            description="Complete product lifecycle tracking from receiving to shipping with barcode scanning support."
            gradient="from-indigo-500 to-blue-500"
          />
          <FeatureCard
            icon={<Users className="w-10 h-10" />}
            title="Multi-Warehouse Support"
            description="Manage multiple warehouses from a single dashboard with centralized control and reporting."
            gradient="from-pink-500 to-rose-500"
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            See what our customers say about transforming their warehouse operations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="Smart Warehouse reduced our inventory errors by 95% and increased efficiency dramatically. The ROI was evident within the first month."
            author="Sarah Johnson"
            role="Operations Director"
            company="LogiTech Solutions"
            rating={5}
          />
          <TestimonialCard
            quote="The real-time IoT tracking is a game-changer. We can now monitor all our warehouses from a single dashboard with complete visibility."
            author="Michael Chen"
            role="Supply Chain Manager"
            company="Global Distributors Inc."
            rating={5}
          />
          <TestimonialCard
            quote="Implementation was seamless and the support team is outstanding. The analytics dashboard provides insights we never had before."
            author="Emily Rodriguez"
            role="Warehouse Manager"
            company="FastShip Logistics"
            rating={5}
          />
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Leveraging the best tools for performance, security, and scalability
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <TechBadge name="Next.js" color="bg-black dark:bg-white dark:text-black" />
            <TechBadge name="Firebase" color="bg-yellow-500" />
            <TechBadge name="TypeScript" color="bg-blue-600" />
            <TechBadge name="Tailwind CSS" color="bg-cyan-500" />
            <TechBadge name="IoT Sensors" color="bg-green-600" />
            <TechBadge name="Cloud Functions" color="bg-purple-600" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about Smart Warehouse
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <FAQItem
            question="How does the IoT integration work?"
            answer="Smart Warehouse integrates with various IoT sensors including weight sensors, RFID readers, and environmental monitors. Data is transmitted in real-time to our cloud platform where it's processed and displayed on your dashboard instantly."
          />
          <FAQItem
            question="Can I manage multiple warehouses?"
            answer="Yes! Smart Warehouse supports unlimited warehouses. You can manage all locations from a single centralized dashboard with role-based access control for different teams and locations."
          />
          <FAQItem
            question="What kind of alerts can I set up?"
            answer="You can configure alerts for low stock levels, temperature anomalies, unauthorized access, sensor failures, inventory discrepancies, and much more. Notifications are sent via email, SMS, and push notifications."
          />
          <FAQItem
            question="Is my data secure?"
            answer="Absolutely. We use Firebase's enterprise-grade security with encryption at rest and in transit. Role-based access control ensures only authorized personnel can access sensitive data. We're compliant with industry security standards."
          />
          <FAQItem
            question="How long does implementation take?"
            answer="Most customers are up and running within 1-2 weeks. Our team provides comprehensive onboarding, sensor installation support, and training to ensure a smooth transition."
          />
          <FAQItem
            question="Do you offer API access?"
            answer="Yes! We provide a comprehensive REST API and real-time database access for custom integrations with your existing ERP, WMS, or other business systems."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-12 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Warehouse?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join leading enterprises using Smart Warehouse to optimize inventory management and boost efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Free Trial
            </Link>
            <a
              href="mailto:rk8766323@gmail.com"
              className="px-10 py-4 bg-transparent text-white border-2 border-white rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Smart Warehouse
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Next-generation IoT-driven warehouse management system.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Dashboard</Link></li>
              <li><Link href="/analytics" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Analytics</Link></li>
              <li><Link href="/devices" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">IoT Devices</Link></li>
              <li><Link href="/inventory" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Inventory</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">About Us</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Contact</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Privacy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Terms</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>📧 rk8766323@gmail.com</li>
              <li>📧 arshbabar0@gmail.com</li>
              <li>🔗 GitHub Repository</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Smart Warehouse System. All rights reserved. Built with ❤️ using Next.js & Firebase.</p>
        </div>
      </footer>
    </main>
  );
}

function StatsCard({ number, label, icon }: { number: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
      <div className="flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2 text-center">{number}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 border border-gray-100 dark:border-gray-700">
      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

function TechBadge({ name, color }: { name: string; color: string }) {
  return (
    <div className={`${color} text-white rounded-xl px-6 py-4 text-center font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
      {name}
    </div>
  );
}

function TestimonialCard({ quote, author, role, company, rating }: { quote: string; author: string; role: string; company: string; rating: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">"{quote}"</p>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="font-bold text-gray-900 dark:text-white">{author}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">{company}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-8">{question}</h3>
        <svg
          className={`w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`px-6 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 py-4' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
