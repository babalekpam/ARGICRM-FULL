import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Play,
  Download,
  Copy,
  Eye,
  ThumbsUp,
  Send,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiTiktok, SiYoutube } from 'react-icons/si';

interface MockupData {
  platform: string;
  username: string;
  handle: string;
  profileImage: string;
  postText: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  postImage?: string;
  isVideo?: boolean;
  isVerified?: boolean;
}

const defaultMockupData: MockupData = {
  platform: 'instagram',
  username: 'Your Business',
  handle: '@yourbusiness',
  profileImage: 'https://via.placeholder.com/150x150/6366f1/ffffff?text=YB',
  postText: 'Excited to share our latest product with you! 🚀',
  hashtags: ['#business', '#innovation', '#growth'],
  likes: 124,
  comments: 23,
  shares: 8,
  isVerified: true
};

const platformConfigs = {
  instagram: {
    name: 'Instagram',
    icon: SiInstagram,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    maxChars: 2200
  },
  facebook: {
    name: 'Facebook',
    icon: SiFacebook,
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-50',
    maxChars: 63206
  },
  twitter: {
    name: 'Twitter/X',
    icon: SiX,
    color: 'from-gray-800 to-black',
    bgColor: 'bg-gray-50',
    maxChars: 280
  },
  linkedin: {
    name: 'LinkedIn',
    icon: SiLinkedin,
    color: 'from-blue-600 to-blue-800',
    bgColor: 'bg-blue-50',
    maxChars: 3000
  },
  tiktok: {
    name: 'TikTok',
    icon: SiTiktok,
    color: 'from-pink-500 to-red-500',
    bgColor: 'bg-gradient-to-br from-pink-50 to-red-50',
    maxChars: 300
  },
  youtube: {
    name: 'YouTube',
    icon: SiYoutube,
    color: 'from-red-600 to-red-700',
    bgColor: 'bg-red-50',
    maxChars: 5000
  }
};

export default function SocialMediaMockupCreator() {
  const [mockupData, setMockupData] = useState<MockupData>(defaultMockupData);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const mockupRef = useRef<HTMLDivElement>(null);

  const updateMockupData = (field: keyof MockupData, value: any) => {
    setMockupData(prev => ({ ...prev, [field]: value }));
  };

  const addHashtag = (hashtag: string) => {
    if (hashtag && !mockupData.hashtags.includes(hashtag)) {
      setMockupData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtag]
      }));
    }
  };

  const removeHashtag = (hashtag: string) => {
    setMockupData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== hashtag)
    }));
  };

  const generateMockupForPlatform = (platform: string) => {
    const config = platformConfigs[platform as keyof typeof platformConfigs];
    const data = { ...mockupData, platform };

    switch (platform) {
      case 'instagram':
        return <InstagramMockup data={data} config={config} />;
      case 'facebook':
        return <FacebookMockup data={data} config={config} />;
      case 'twitter':
        return <TwitterMockup data={data} config={config} />;
      case 'linkedin':
        return <LinkedInMockup data={data} config={config} />;
      case 'tiktok':
        return <TikTokMockup data={data} config={config} />;
      case 'youtube':
        return <YouTubeMockup data={data} config={config} />;
      default:
        return null;
    }
  };

  const downloadMockup = async (platform: string) => {
    // In a real implementation, you'd use html2canvas or similar
    alert(`Downloading ${platform} mockup... (Feature will capture the preview as an image)`);
  };

  const copyMockupText = () => {
    const text = `${mockupData.postText} ${mockupData.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    alert('Post text copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Social Media Mockup Creator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create realistic social media post previews in seconds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(platformConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedPlatforms.includes(key);
                    return (
                      <Button
                        key={key}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPlatforms(prev => prev.filter(p => p !== key));
                          } else {
                            setSelectedPlatforms(prev => [...prev, key]);
                          }
                        }}
                        className="justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {config.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <Input
                  value={mockupData.username}
                  onChange={(e) => updateMockupData('username', e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Handle/Username</label>
                <Input
                  value={mockupData.handle}
                  onChange={(e) => updateMockupData('handle', e.target.value)}
                  placeholder="@yourbusiness"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Post Text</label>
                <Textarea
                  value={mockupData.postText}
                  onChange={(e) => updateMockupData('postText', e.target.value)}
                  placeholder="Write your post content..."
                  rows={4}
                />
                <div className="text-xs text-gray-500">
                  {mockupData.postText.length} characters
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hashtags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {mockupData.hashtags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeHashtag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add hashtag (without #)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      addHashtag(`#${value}`);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Likes</label>
                  <Input
                    type="number"
                    value={mockupData.likes}
                    onChange={(e) => updateMockupData('likes', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments</label>
                  <Input
                    type="number"
                    value={mockupData.comments}
                    onChange={(e) => updateMockupData('comments', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shares</label>
                  <Input
                    type="number"
                    value={mockupData.shares}
                    onChange={(e) => updateMockupData('shares', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={copyMockupText} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Text
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedPlatforms[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  {Object.entries(platformConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        disabled={!selectedPlatforms.includes(key)}
                        className="flex items-center space-x-1"
                      >
                        <Icon className="w-4 h-4" />
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.keys(platformConfigs).map((platform) => (
                  <TabsContent key={platform} value={platform} className="mt-4">
                    {selectedPlatforms.includes(platform) && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">
                            {platformConfigs[platform as keyof typeof platformConfigs].name} Preview
                          </h3>
                          <Button
                            onClick={() => downloadMockup(platform)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <div 
                          ref={mockupRef}
                          className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
                        >
                          {generateMockupForPlatform(platform)}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Individual platform mockup components
function InstagramMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center p-3 border-b">
        <img
          src={data.profileImage}
          alt="Profile"
          className="w-8 h-8 rounded-full mr-3"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-semibold text-sm">{data.handle}</span>
            {data.isVerified && (
              <div className="w-3 h-3 bg-blue-500 rounded-full ml-1 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </div>

      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
            <Send className="w-6 h-6" />
          </div>
          <Bookmark className="w-6 h-6" />
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold">{data.likes.toLocaleString()} likes</span>
        </div>

        <div className="text-sm">
          <span className="font-semibold">{data.handle}</span>{' '}
          {data.postText}
        </div>

        <div className="text-sm text-blue-900 mt-1">
          {data.hashtags.join(' ')}
        </div>

        <div className="text-sm text-gray-500 mt-2">
          View all {data.comments} comments
        </div>
      </div>
    </div>
  );
}

function FacebookMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center p-4">
        <img
          src={data.profileImage}
          alt="Profile"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-semibold">{data.username}</span>
            {data.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full ml-2 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">2 hours ago • 🌍</div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-sm">{data.postText}</p>
        <div className="text-sm text-blue-600 mt-1">
          {data.hashtags.join(' ')}
        </div>
      </div>

      {/* Image placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="flex -space-x-1 mr-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            {data.likes} others
          </div>
          <div>{data.comments} comments • {data.shares} shares</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center px-4 py-2">
        <div className="flex-1 flex items-center justify-center py-2 hover:bg-gray-50 rounded">
          <ThumbsUp className="w-5 h-5 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Like</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-2 hover:bg-gray-50 rounded">
          <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Comment</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-2 hover:bg-gray-50 rounded">
          <Share className="w-5 h-5 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Share</span>
        </div>
      </div>
    </div>
  );
}

function TwitterMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex p-4">
        <img
          src={data.profileImage}
          alt="Profile"
          className="w-12 h-12 rounded-full mr-3"
        />
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="font-bold text-sm">{data.username}</span>
            {data.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full ml-2 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <span className="text-gray-500 text-sm ml-2">{data.handle}</span>
            <span className="text-gray-500 text-sm ml-2">• 2h</span>
          </div>

          <div className="text-sm mb-3">
            {data.postText}
            <div className="text-blue-500 mt-1">
              {data.hashtags.join(' ')}
            </div>
          </div>

          {/* Image placeholder */}
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-3 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>

          {/* Stats */}
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <span className="mr-4">{data.comments} replies</span>
            <span className="mr-4">{data.shares} reposts</span>
            <span>{data.likes} likes</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <div className="flex items-center text-gray-500 hover:text-blue-500 cursor-pointer">
              <MessageCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{data.comments}</span>
            </div>
            <div className="flex items-center text-gray-500 hover:text-green-500 cursor-pointer">
              <Share className="w-5 h-5 mr-2" />
              <span className="text-sm">{data.shares}</span>
            </div>
            <div className="flex items-center text-gray-500 hover:text-red-500 cursor-pointer">
              <Heart className="w-5 h-5 mr-2" />
              <span className="text-sm">{data.likes}</span>
            </div>
            <div className="flex items-center text-gray-500 hover:text-blue-500 cursor-pointer">
              <Share className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center p-4">
        <img
          src={data.profileImage}
          alt="Profile"
          className="w-12 h-12 rounded-full mr-3"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-semibold text-sm">{data.username}</span>
            {data.isVerified && (
              <div className="w-4 h-4 bg-blue-600 rounded-full ml-2 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">CEO at Company • 1st</div>
          <div className="text-xs text-gray-500">2h • 🌍</div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm mb-2">{data.postText}</p>
        <div className="text-sm text-blue-600">
          {data.hashtags.join(' ')}
        </div>
      </div>

      {/* Image placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{data.likes} reactions • {data.comments} comments</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around border-t border-gray-100 pt-2">
          <div className="flex items-center text-gray-600 hover:bg-gray-50 px-4 py-2 rounded cursor-pointer">
            <ThumbsUp className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Like</span>
          </div>
          <div className="flex items-center text-gray-600 hover:bg-gray-50 px-4 py-2 rounded cursor-pointer">
            <MessageCircle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Comment</span>
          </div>
          <div className="flex items-center text-gray-600 hover:bg-gray-50 px-4 py-2 rounded cursor-pointer">
            <Share className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-black text-white aspect-[9/16] relative overflow-hidden">
      {/* Video placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
        <Play className="w-16 h-16 text-white opacity-50" />
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-full mb-1 flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-xs">{data.likes > 1000 ? `${(data.likes/1000).toFixed(1)}K` : data.likes}</span>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-full mb-1 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-black" />
          </div>
          <span className="text-xs">{data.comments}</span>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-full mb-1 flex items-center justify-center">
            <Share className="w-6 h-6 text-black" />
          </div>
          <span className="text-xs">{data.shares}</span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center mb-2">
          <img
            src={data.profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full mr-2"
          />
          <span className="font-semibold text-sm">{data.handle}</span>
          {data.isVerified && (
            <div className="w-4 h-4 bg-blue-500 rounded-full ml-2 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <p className="text-sm mb-2">{data.postText}</p>
        <div className="text-sm text-white/80">
          {data.hashtags.join(' ')}
        </div>
      </div>
    </div>
  );
}

function YouTubeMockup({ data, config }: { data: MockupData; config: any }) {
  return (
    <div className="bg-white">
      {/* Video thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 relative flex items-center justify-center">
        <Play className="w-16 h-16 text-red-600" />
        <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-1 rounded">
          5:42
        </div>
      </div>

      {/* Video info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
          {data.postText}
        </h3>
        
        <div className="flex items-center mb-2">
          <img
            src={data.profileImage}
            alt="Channel"
            className="w-8 h-8 rounded-full mr-3"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-sm font-medium">{data.username}</span>
              {data.isVerified && (
                <div className="w-3 h-3 bg-gray-600 rounded-full ml-1 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-600">1.2M subscribers</div>
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          {data.likes.toLocaleString()} views • 2 hours ago
        </div>

        <div className="text-xs text-blue-600">
          {data.hashtags.join(' ')}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="text-xs">{data.likes}</span>
            </div>
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{data.comments}</span>
            </div>
            <Share className="w-4 h-4" />
          </div>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}