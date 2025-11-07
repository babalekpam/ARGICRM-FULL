import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, BookOpen, CheckCircle, Clock, Users, Award, ArrowLeft, Download, Volume2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

export default function CourseViewerPage() {
  const { courseId } = useParams();
  const [currentLesson, setCurrentLesson] = useState(1);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  // Course data based on courseId
  const courseData: Record<string, any> = {
    "crm-fundamentals": {
      title: "CRM Fundamentals Masterclass",
      description: "Complete introduction to customer relationship management with hands-on examples",
      instructor: "Sarah Johnson",
      duration: "6 hours",
      totalLessons: 15,
      level: "Beginner",
      progress: 0,
      enrolled: true,
      lessons: [
        { id: 1, title: "CRM Strategy & Planning", duration: "25 min", type: "video" },
        { id: 2, title: "Customer Data Management", duration: "30 min", type: "video" },
        { id: 3, title: "Sales Pipeline Optimization", duration: "20 min", type: "interactive" },
        { id: 4, title: "Customer Segmentation Techniques", duration: "15 min", type: "quiz" },
        { id: 5, title: "ROI Measurement Methods", duration: "20 min", type: "video" },
        { id: 6, title: "Implementation Best Practices", duration: "25 min", type: "video" },
        { id: 7, title: "CRM Tool Selection Guide", duration: "18 min", type: "reading" },
        { id: 8, title: "Data Integration Strategies", duration: "22 min", type: "video" },
        { id: 9, title: "Customer Journey Mapping", duration: "20 min", type: "interactive" },
        { id: 10, title: "Performance Analytics", duration: "15 min", type: "quiz" },
        { id: 11, title: "Team Training & Adoption", duration: "18 min", type: "video" },
        { id: 12, title: "Advanced CRM Features", duration: "25 min", type: "video" },
        { id: 13, title: "Case Study: CRM Success Stories", duration: "20 min", type: "reading" },
        { id: 14, title: "Final Assessment", duration: "30 min", type: "quiz" },
        { id: 15, title: "Certification Project", duration: "45 min", type: "project" }
      ]
    },
    "emotional-intelligence": {
      title: "Emotional Intelligence in Business",
      description: "Master the art of understanding and leveraging emotional insights for business success",
      instructor: "Dr. Sarah Chen",
      duration: "8 hours",
      totalLessons: 12,
      level: "Intermediate",
      progress: 0,
      enrolled: true,
      lessons: [
        { id: 1, title: "Introduction to Emotional Intelligence", duration: "20 min", type: "video" },
        { id: 2, title: "Emotion Recognition Techniques", duration: "25 min", type: "video" },
        { id: 3, title: "Customer Sentiment Analysis", duration: "30 min", type: "interactive" },
        { id: 4, title: "Emotional Trigger Identification", duration: "15 min", type: "quiz" },
        { id: 5, title: "Empathy-Driven Communication", duration: "25 min", type: "video" },
        { id: 6, title: "Emotional Data Interpretation", duration: "20 min", type: "video" },
        { id: 7, title: "AI-Powered Insights Workshop", duration: "35 min", type: "interactive" },
        { id: 8, title: "Real-World Application Cases", duration: "25 min", type: "reading" },
        { id: 9, title: "Building Emotional Awareness", duration: "20 min", type: "video" },
        { id: 10, title: "Practice Scenarios", duration: "30 min", type: "interactive" },
        { id: 11, title: "Advanced Techniques Assessment", duration: "25 min", type: "quiz" },
        { id: 12, title: "Implementation & Certification", duration: "40 min", type: "project" }
      ]
    },
    "sales-automation": {
      title: "Sales Automation Excellence",
      description: "Streamline your sales processes with intelligent automation workflows",
      instructor: "Mark Thompson",
      duration: "4 hours",
      totalLessons: 10,
      level: "Intermediate",
      progress: 0,
      enrolled: true,
      lessons: [
        { id: 1, title: "Workflow Design Principles", duration: "20 min", type: "video" },
        { id: 2, title: "Lead Scoring Automation", duration: "25 min", type: "video" },
        { id: 3, title: "Email Sequence Creation", duration: "30 min", type: "interactive" },
        { id: 4, title: "Task Automation Setup", duration: "15 min", type: "quiz" },
        { id: 5, title: "Performance Monitoring", duration: "20 min", type: "video" },
        { id: 6, title: "Integration Strategies", duration: "25 min", type: "video" },
        { id: 7, title: "Advanced Automation Rules", duration: "20 min", type: "interactive" },
        { id: 8, title: "ROI Analysis & Optimization", duration: "18 min", type: "reading" },
        { id: 9, title: "Troubleshooting Common Issues", duration: "15 min", type: "quiz" },
        { id: 10, title: "Automation Mastery Project", duration: "35 min", type: "project" }
      ]
    },
    "analytics-mastery": {
      title: "Advanced Analytics & Reporting",
      description: "Transform data into actionable insights with advanced analytics techniques",
      instructor: "Dr. Emily Rodriguez",
      duration: "10 hours",
      totalLessons: 16,
      level: "Advanced",
      progress: 0,
      enrolled: true,
      lessons: [
        { id: 1, title: "Data Visualization Fundamentals", duration: "25 min", type: "video" },
        { id: 2, title: "Predictive Analytics Introduction", duration: "30 min", type: "video" },
        { id: 3, title: "Custom Report Building", duration: "35 min", type: "interactive" },
        { id: 4, title: "KPI Dashboard Creation", duration: "20 min", type: "quiz" },
        { id: 5, title: "Trend Analysis Techniques", duration: "25 min", type: "video" }
      ]
    },
    "customer-success": {
      title: "Customer Success Strategies",
      description: "Build lasting customer relationships and maximize lifetime value",
      instructor: "Jennifer Davis",
      duration: "5 hours",
      totalLessons: 12,
      level: "Intermediate",
      progress: 0,
      enrolled: true,
      lessons: [
        { id: 1, title: "Customer Onboarding Excellence", duration: "20 min", type: "video" },
        { id: 2, title: "Retention Strategy Development", duration: "25 min", type: "video" },
        { id: 3, title: "Upselling & Cross-selling", duration: "30 min", type: "interactive" },
        { id: 4, title: "Customer Health Scoring", duration: "15 min", type: "quiz" },
        { id: 5, title: "Churn Prevention Strategies", duration: "25 min", type: "video" }
      ]
    }
  };

  const course = courseData[courseId || ""] || courseData["crm-fundamentals"];

  const handleLessonComplete = (lessonId: number) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
    if (lessonId < course.totalLessons) {
      setCurrentLesson(lessonId + 1);
    }
  };

  const handleGoBack = () => {
    // Navigate directly to learning page
    window.location.href = '/learning';
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return PlayCircle;
      case 'quiz': return CheckCircle;
      case 'reading': return BookOpen;
      case 'interactive': return Users;
      case 'project': return Award;
      default: return PlayCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Learning
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">{course.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Lesson */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Lesson {currentLesson}: {course.lessons[currentLesson - 1]?.title}
                  </CardTitle>
                  <Badge variant="outline">
                    {course.lessons[currentLesson - 1]?.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.lessons[currentLesson - 1]?.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.instructor}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Player Placeholder */}
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-semibold mb-2">
                      {course.lessons[currentLesson - 1]?.title}
                    </h3>
                    <p className="text-gray-300">
                      Duration: {course.lessons[currentLesson - 1]?.duration}
                    </p>
                    <Button className="mt-4" size="lg">
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Lesson
                    </Button>
                  </div>
                </div>

                {/* Lesson Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Audio
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Resources
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleLessonComplete(currentLesson)}
                    disabled={completedLessons.includes(currentLesson)}
                  >
                    {completedLessons.includes(currentLesson) ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>

                {/* Lesson Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Lesson Overview</h4>
                  <p className="text-gray-600">
                    In this lesson, you'll learn the core concepts of emotional intelligence and how to apply them in business contexts. We'll cover practical techniques for reading emotions and building stronger customer relationships.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round((completedLessons.length / course.totalLessons) * 100)}%</span>
                </div>
                <Progress value={(completedLessons.length / course.totalLessons) * 100} />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{completedLessons.length}</div>
                    <div className="text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{course.totalLessons - completedLessons.length}</div>
                    <div className="text-gray-600">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson List */}
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.lessons.map((lesson: any, index: number) => {
                  const LessonIcon = getLessonIcon(lesson.type);
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = currentLesson === lesson.id;
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isCurrent ? 'bg-purple-50 border-purple-200' :
                        isCompleted ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentLesson(lesson.id)}
                    >
                      <div className="flex items-center gap-3">
                        <LessonIcon className={`h-4 w-4 ${
                          isCompleted ? 'text-green-600' : 
                          isCurrent ? 'text-purple-600' : 'text-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {lesson.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lesson.duration} • {lesson.type}
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Level</span>
                  <Badge variant={course.level === 'Beginner' ? 'secondary' : 'default'}>
                    {course.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-medium">{course.totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Instructor</span>
                  <span className="font-medium">{course.instructor}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}