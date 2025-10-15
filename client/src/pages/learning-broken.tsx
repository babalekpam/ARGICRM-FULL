import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, BookOpen, Users, Award, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";

export default function LearningPage() {
  const { toast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([1, 2, 3]); // Some courses already enrolled

  const handleCourseAction = (courseIndex: number, courseTitle: string, action: 'start' | 'continue') => {
    if (action === 'start') {
      setEnrolledCourses(prev => [...prev, courseIndex]);
      toast({
        title: "Course Started!",
        description: `You've successfully enrolled in "${courseTitle}". Your learning journey begins now!`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Continuing Course",
        description: `Resuming "${courseTitle}" from where you left off.`,
        duration: 3000,
      });
    }
  };

  const handleResourceAccess = (resourceTitle: string, resourceType: string) => {
    toast({
      title: "Accessing Resource",
      description: `Opening ${resourceType}: "${resourceTitle}"`,
      duration: 3000,
    });
    // In a real implementation, this would open the resource
  };

  const handleBrowseAllCourses = () => {
    toast({
      title: "Course Catalog",
      description: "Loading complete course catalog with 50+ learning paths...",
      duration: 3000,
    });
  };

  const handleGetLearningPlan = () => {
    toast({
      title: "Personalized Learning Plan",
      description: "Creating your custom learning path based on your goals and experience...",
      duration: 3000,
    });
  };


  const courses = [
    {
      title: "Emotional Intelligence Fundamentals",
      description: "Master the basics of emotional intelligence in business contexts",
      duration: "4 hours",
      level: "Beginner",
      progress: 0,
      lessons: 12,
      certificate: true,
      featured: true
    },
    {
      title: "Advanced Customer Psychology",
      description: "Deep dive into customer behavior and emotional triggers",
      duration: "6 hours", 
      level: "Advanced",
      progress: 45,
      lessons: 18,
      certificate: true
    },
    {
      title: "NODE CRM Platform Mastery",
      description: "Complete guide to using all NODE CRM features effectively",
      duration: "3 hours",
      level: "Intermediate",
      progress: 78,
      lessons: 15,
      certificate: true
    },
    {
      title: "Data-Driven Emotional Insights",
      description: "Learn to interpret and act on emotional analytics",
      duration: "5 hours",
      level: "Intermediate", 
      progress: 23,
      lessons: 20,
      certificate: true
    }
  ];

  const resources = [
    {
      type: "Webinar",
      title: "Emotional Intelligence ROI: Measuring Success",
      date: "Live - Next Tuesday",
      attendees: "2,340 registered",
      icon: <Users className="h-5 w-5 text-blue-600" />
    },
    {
      type: "Guide",
      title: "Complete Implementation Checklist",
      date: "Updated this week",
      attendees: "8,456 downloads",
      icon: <BookOpen className="h-5 w-5 text-green-600" />
    },
    {
      type: "Video",
      title: "Customer Success Stories Collection",
      date: "New episodes weekly",
      attendees: "15,789 views",
      icon: <PlayCircle className="h-5 w-5 text-purple-600" />
    }
  ];

  const achievements = [
    { name: "First Course Completed", earned: true },
    { name: "Platform Expert", earned: true },
    { name: "Emotional Intelligence Certified", earned: false },
    { name: "Advanced Analytics User", earned: false }
  ];

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="pt-32 pb-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Learn
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Emotional Intelligence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Master the art and science of emotional intelligence with our comprehensive learning platform. 
              Build skills that transform businesses and drive success.
            </p>
            <div className="flex justify-center items-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">50+</div>
                <div className="text-sm text-gray-600">Expert-Led Courses</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">25,000+</div>
                <div className="text-sm text-gray-600">Students Enrolled</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Learning Progress */}
        <div className="px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-lg mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Journey</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
                  <div className="text-gray-700">Courses In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                  <div className="text-gray-700">Certificates Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">24</div>
                  <div className="text-gray-700">Hours Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">89%</div>
                  <div className="text-gray-700">Overall Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Catalog */}
        <div className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Catalog</h2>
              <p className="text-xl text-gray-600">Comprehensive curriculum designed by industry experts</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course, index) => (
                <Card key={index} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${course.featured ? 'ring-2 ring-purple-500' : ''}`}>
                  {course.featured && (
                    <Badge className="absolute top-4 right-4 bg-purple-600 text-white">
                      Featured
                    </Badge>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900 mb-2">{course.title}</CardTitle>
                        <p className="text-gray-600 text-sm">{course.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} lessons
                      </div>
                      <Badge variant="outline" className={`text-xs ${course.level === 'Beginner' ? 'border-green-200 text-green-700' : course.level === 'Intermediate' ? 'border-blue-200 text-blue-700' : 'border-red-200 text-red-700'}`}>
                        {course.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {course.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {course.certificate && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Award className="h-4 w-4" />
                            Certificate
                          </div>
                        )}
                      </div>
                      <Button 
                        className={`${course.progress > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white`}
                        onClick={() => handleCourseAction(index, course.title, course.progress > 0 ? 'continue' : 'start')}
                      >
                        {course.progress > 0 ? 'Continue' : 'Start Course'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Resources */}
        <div className="bg-white py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Additional Learning Resources</h2>
              <p className="text-xl text-gray-600">Expand your knowledge with these supplementary materials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {resources.map((resource, index) => (
                <Card key={index} className="transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      {resource.icon}
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-900">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div>{resource.date}</div>
                      <div>{resource.attendees}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleResourceAccess(resource.title, resource.type)}
                    >
                      Access Resource
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Achievements</h2>
              <p className="text-xl text-gray-600">Track your progress and celebrate your milestones</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement, index) => (
                <div key={index} className={`text-center p-6 rounded-lg border-2 transition-all ${achievement.earned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${achievement.earned ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {achievement.earned ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <Award className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className={`font-semibold ${achievement.earned ? 'text-green-900' : 'text-gray-600'}`}>
                    {achievement.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Master Emotional Intelligence?</h2>
            <p className="text-xl text-purple-100 mb-8">Start your learning journey today and transform your business capabilities</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={handleBrowseAllCourses}
              >
                Browse All Courses
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-purple-600"
                onClick={handleGetLearningPlan}
              >
                Get Learning Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}