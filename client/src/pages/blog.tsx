import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Lightbulb, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const blogPosts = [
  {
    title: "The Future of AI in CRM: AI-Powered Insights Revolution",
    excerpt: "Discover how AI-powered analytics is transforming customer relationship management and driving better business outcomes.",
    date: "September 15, 2025",
    author: "NODE CRM Team",
    category: "AI & Technology",
    readTime: "5 min read",
    featured: true
  },
  {
    title: "10 CRM Best Practices for Small Business Growth",
    excerpt: "Essential strategies every small business needs to implement for effective customer relationship management.",
    date: "September 10, 2025",
    author: "Marketing Team",
    category: "Best Practices",
    readTime: "7 min read",
    featured: false
  },
  {
    title: "Global Business Expansion: Managing CRM Across 195+ Countries",
    excerpt: "Learn how to scale your customer relationships internationally with multi-language and multi-currency support.",
    date: "September 5, 2025",
    author: "Global Operations",
    category: "International Business",
    readTime: "6 min read",
    featured: false
  },
  {
    title: "E-commerce Integration: Building Your Online Store with CRM",
    excerpt: "Step-by-step guide to creating a successful e-commerce platform integrated with your customer data.",
    date: "August 30, 2025",
    author: "E-commerce Team",
    category: "E-commerce",
    readTime: "8 min read",
    featured: false
  }
];

export default function BlogPage() {
  return (
    <>
      <SEO 
        title="NODE CRM Blog - Business Insights, CRM Tips & AI Innovation"
        description="Stay updated with the latest CRM insights, AI innovations, and business growth strategies from NODE CRM experts. Learn how to optimize your customer relationships."
        canonical="https://argilette.org/blog"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">NODE CRM</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">NODE CRM Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Business Insights & <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CRM Innovation
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover the latest insights on customer relationship management, AI innovation, and business growth strategies from our experts.
            </p>
          </div>

          {/* Featured Categories */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">AI & Innovation</h3>
                <p className="text-sm text-gray-600">Latest trends in artificial intelligence and AI-powered analytics for business</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Growth Strategies</h3>
                <p className="text-sm text-gray-600">Proven methods to scale your business and improve customer relationships</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Best Practices</h3>
                <p className="text-sm text-gray-600">Expert tips and industry best practices for effective CRM implementation</p>
              </CardContent>
            </Card>
          </div>

          {/* Featured Post */}
          {blogPosts.filter(post => post.featured).map((post, index) => (
            <Card key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-12">
              <CardContent className="p-8 md:p-12">
                <Badge variant="secondary" className="bg-white text-blue-600 mb-4">Featured Post</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h2>
                <p className="text-xl mb-6 opacity-90">{post.excerpt}</p>
                <div className="flex items-center space-x-6 text-sm opacity-80 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <span>{post.readTime}</span>
                </div>
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Recent Posts */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.filter(post => !post.featured).map((post, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3 text-xs">{post.category}</Badge>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{post.date}</span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-xl mb-8 opacity-90">
                Get the latest CRM insights, AI innovations, and business tips delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Subscribe to Newsletter
                </Button>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 w-full sm:w-auto">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}