import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import ServiceMatchingChatbot from './service-matching-chatbot';

const ChatbotTrigger: React.FC = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isChatbotOpen && (
        <div className="fixed bottom-20 right-6 z-[9998]">
          <Button
            onClick={() => setIsChatbotOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </div>
          </Button>
          
          {/* Tooltip/Hint */}
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9997]">
            Need help finding the right service?
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Chatbot Component */}
      <ServiceMatchingChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onMinimize={() => setIsMinimized(!isMinimized)}
        isMinimized={isMinimized}
      />
    </>
  );
};

export default ChatbotTrigger;