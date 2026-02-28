import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Smart Warehouse System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            IoT-driven warehouse management with real-time inventory tracking, 
            smart shelves, and role-based access control
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon="📊"
            title="Real-time Tracking"
            description="Monitor inventory levels in real-time with IoT sensors and smart shelves"
          />
          <FeatureCard
            icon="🔔"
            title="Smart Alerts"
            description="Automated notifications for low stock, sensor failures, and anomalies"
          />
          <FeatureCard
            icon="📱"
            title="Multi-Platform"
            description="Access from web and mobile devices with seamless synchronization"
          />
          <FeatureCard
            icon="👥"
            title="Role-Based Access"
            description="Secure access control for admins, managers, staff, and viewers"
          />
          <FeatureCard
            icon="📈"
            title="Analytics Dashboard"
            description="Comprehensive insights and reports on inventory trends"
          />
          <FeatureCard
            icon="🌐"
            title="Cloud Integration"
            description="Powered by Firebase for scalability and reliability"
          />
        </div>

        {}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatItem number="99.9%" label="Uptime" />
            <StatItem number="<2s" label="Real-time Latency" />
            <StatItem number="50%" label="Efficiency Gain" />
            <StatItem number="24/7" label="Monitoring" />
          </div>
        </div>

        {}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Powered By Modern Technology
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <TechBadge name="Next.js" />
            <TechBadge name="Firebase" />
            <TechBadge name="TypeScript" />
            <TechBadge name="Tailwind CSS" />
            <TechBadge name="IoT Sensors" />
            <TechBadge name="Vercel" />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{number}</div>
      <div className="text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
      {name}
    </span>
  );
}
