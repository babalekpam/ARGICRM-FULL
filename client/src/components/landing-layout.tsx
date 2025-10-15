import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "./logo";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <Logo size="md" variant="colored" />
              </Link>
            </div>

            {/* Navigation Links - Center */}
            <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
              <Link to="/products" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Products
              </Link>
              <Link to="/industries" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Industries
              </Link>
              <Link to="/customers" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Customers
              </Link>
              <Link to="/learning" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Learning
              </Link>
              <Link to="/support" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Support
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Pricing
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-purple-600 transition-colors whitespace-nowrap">
                Services
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link to="/login">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="md" variant="transparent" />
              </div>
              <p className="text-gray-400 max-w-md">
                The World's First Emotional Intelligence CRM. Beyond Data. Beyond CRM. Beyond Expectations. Transform customer relationships through revolutionary emotional intelligence technology.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/industries" className="hover:text-white transition-colors">Industries</Link></li>
                <li><Link to="/customers" className="hover:text-white transition-colors">Customers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/learning" className="hover:text-white transition-colors">Learning</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><a href="mailto:support@argilette.org" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 NODE CRM – Powered by Argilette Lab</p>
          </div>
        </div>
      </footer>
    </div>
  );
}