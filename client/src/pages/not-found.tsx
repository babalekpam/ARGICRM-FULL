import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

export default function NotFound() {
  const [, setLocation] = useLocation();
  
  console.log('NotFound component rendering - this should not happen for root route');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="colored" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">404 - Page Not Found</CardTitle>
          <CardDescription className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500">
              Don't worry, you can get back on track:
            </p>
            
            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => setLocation('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}