import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Search, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'dialog' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showFlag = true, 
  showNativeName = true,
  className = ""
}: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, getAvailableLanguages, getCurrentLanguageConfig, t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const languages = getAvailableLanguages();
  const currentConfig = getCurrentLanguageConfig();

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsDialogOpen(false);
    setSearchQuery("");
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 ${className}`}
        onClick={() => {
          const currentIndex = languages.findIndex(lang => lang.code === currentLanguage);
          const nextIndex = (currentIndex + 1) % languages.length;
          changeLanguage(languages[nextIndex].code);
        }}
      >
        {showFlag && <span className="mr-1">{currentConfig.flag}</span>}
        <span className="text-xs font-medium">{currentConfig.code.toUpperCase()}</span>
      </Button>
    );
  }

  if (variant === 'dialog') {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Globe className="h-4 w-4" />
            {showFlag && <span>{currentConfig.flag}</span>}
            <span>{showNativeName ? currentConfig.nativeName : currentConfig.name}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('selectLanguage', 'Select Language')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('searchLanguages', 'Search languages...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredLanguages.map((language) => (
                <div
                  key={language.code}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    language.code === currentLanguage 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{language.flag}</span>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      <div className="text-sm text-gray-600">{language.nativeName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {language.rtl && (
                      <Badge variant="secondary" className="text-xs">RTL</Badge>
                    )}
                    {language.code === currentLanguage && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className={`gap-2 ${className}`}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {showFlag && <span>{currentConfig.flag}</span>}
            <span>{showNativeName ? currentConfig.nativeName : currentConfig.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-3 w-full">
              <span>{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                <div className="text-xs text-gray-600">{language.nativeName}</div>
              </div>
              {language.rtl && (
                <Badge variant="secondary" className="text-xs">RTL</Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}