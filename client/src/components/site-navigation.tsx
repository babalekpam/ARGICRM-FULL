import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";

interface SiteNavigationProps {
  showAuthButtons?: boolean;
  className?: string;
}

export default function SiteNavigation({ showAuthButtons = true, className = "" }: SiteNavigationProps) {
  return (
    <div className={`bg-white border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo size="sm" />
            <span className="text-xl font-bold text-gray-900">ARGILETTE</span>
          </Link>

          {/* Main Navigation - Two Row Layout */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-3 flex-1">
            {/* First Row */}
            <div className="flex items-center justify-center space-x-8">
              <Link href="/products" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Products
              </Link>
              <Link href="/industries" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Industries
              </Link>
              <Link href="/customers" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Customers
              </Link>
              <Link href="/learning" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Learning
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Support
              </Link>
            </div>
            {/* Second Row */}
            <div className="flex items-center justify-center space-x-8">
              <Link href="/overview" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Overview
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Services
              </Link>

              <Link href="/what-is-crm" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                What is CRM
              </Link>
              <Link href="/solutions" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Solutions
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Pricing
              </Link>
            </div>
          </div>

          {/* Auth Buttons */}
          {showAuthButtons && (
            <div className="hidden lg:flex flex-col items-center space-y-2">
              <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Login
              </Link>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2">
                <Link href="/adaptive-signup">
                  Start Free Trial
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}