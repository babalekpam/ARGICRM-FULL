import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export function BrandedFooter() {
  const { settings } = useWhiteLabel();

  return (
    <footer className="border-t bg-white dark:bg-gray-900 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              {settings.customFooter ? (
                <span className="text-sm text-gray-600 dark:text-gray-400">{settings.customFooter}</span>
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400">© 2025 {settings.companyName}. All rights reserved.</span>
              )}
            </div>
            {!settings.removeBranding && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Powered by ARGILETTE
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              {settings.privacyPolicyUrl && (
                <a 
                  href={settings.privacyPolicyUrl}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              )}
              {settings.termsOfServiceUrl && (
                <a 
                  href={settings.termsOfServiceUrl}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Contact Us</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a 
                  href="mailto:info@argilette.org" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  info@argilette.org
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <a 
                  href="mailto:support@argilette.org" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  support@argilette.org
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              General: info@argilette.org • Support: support@argilette.org • Sales: sales@argilette.org • Billing: billing@argilette.org
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}