import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Languages, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'button';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showLabel = true,
  className,
  variant = 'default'
}) => {
  const { currentLanguage, setLanguage, supportedLanguages, isLoading, error } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };

  if (variant === 'button') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {currentLanguage.flag} {compact ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
          </span>
        </Button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-md border shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2 border-b">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Select Language
              </h3>
            </div>
            <div className="py-1">
              {supportedLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3",
                    currentLanguage.code === language.code && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  )}
                >
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {language.region}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Globe className="h-4 w-4 text-gray-500" />
        <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-auto min-w-[100px] h-8">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.code.toUpperCase()}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  <span className="text-sm">{language.nativeName}</span>
                  <Badge variant="outline" className="text-xs">
                    {language.region}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Language
        </label>
      )}
      
      <div className="relative">
        <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-3">
                <span className="text-lg">{currentLanguage.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{currentLanguage.nativeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{currentLanguage.name}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentLanguage.region}
                </Badge>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {supportedLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {language.region}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      {!compact && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {supportedLanguages.length} languages supported • Real-time translation enabled
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;