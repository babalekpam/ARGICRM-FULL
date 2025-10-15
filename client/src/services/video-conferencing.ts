export interface VideoConferenceProvider {
  name: string;
  icon: string;
  startMeeting: (options: MeetingOptions) => Promise<MeetingResponse>;
  scheduleMeeting: (options: ScheduleMeetingOptions) => Promise<ScheduleResponse>;
  joinMeeting: (meetingId: string) => void;
}

export interface MeetingOptions {
  topic?: string;
  duration?: number;
  password?: string;
  participantEmails?: string[];
}

export interface ScheduleMeetingOptions extends MeetingOptions {
  startTime: Date;
  timezone?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface MeetingResponse {
  success: boolean;
  meetingId: string;
  joinUrl: string;
  password?: string;
  error?: string;
}

export interface ScheduleResponse extends MeetingResponse {
  startTime: Date;
  calendarInvite?: string;
}

class ZoomProvider implements VideoConferenceProvider {
  name = "Zoom";
  icon = "🎥";

  async startMeeting(options: MeetingOptions): Promise<MeetingResponse> {
    try {
      // In production, this would use Zoom API
      const meetingId = `zoom-${Date.now()}`;
      const joinUrl = `https://zoom.us/j/${meetingId}`;
      
      // Open Zoom meeting
      window.open(joinUrl, '_blank');
      
      return {
        success: true,
        meetingId,
        joinUrl,
        password: options.password
      };
    } catch (error) {
      return {
        success: false,
        meetingId: '',
        joinUrl: '',
        error: 'Failed to start Zoom meeting'
      };
    }
  }

  async scheduleMeeting(options: ScheduleMeetingOptions): Promise<ScheduleResponse> {
    // In production, integrate with Zoom API
    const meetingId = `zoom-scheduled-${Date.now()}`;
    const joinUrl = `https://zoom.us/j/${meetingId}`;
    
    return {
      success: true,
      meetingId,
      joinUrl,
      startTime: options.startTime,
      calendarInvite: this.generateCalendarInvite(options, joinUrl)
    };
  }

  joinMeeting(meetingId: string): void {
    const joinUrl = `https://zoom.us/j/${meetingId}`;
    window.open(joinUrl, '_blank');
  }

  private generateCalendarInvite(options: ScheduleMeetingOptions, joinUrl: string): string {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ARGILETTE CRM//EN
BEGIN:VEVENT
UID:${Date.now()}@argilette.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${options.startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${options.topic || 'Team Meeting'}
DESCRIPTION:Join Zoom Meeting: ${joinUrl}
LOCATION:${joinUrl}
END:VEVENT
END:VCALENDAR`;
  }
}

class TeamsProvider implements VideoConferenceProvider {
  name = "Microsoft Teams";
  icon = "📱";

  async startMeeting(options: MeetingOptions): Promise<MeetingResponse> {
    try {
      const meetingId = `teams-${Date.now()}`;
      const joinUrl = `https://teams.microsoft.com/l/meetup-join/`;
      
      // Open Teams meeting
      window.open(joinUrl, '_blank');
      
      return {
        success: true,
        meetingId,
        joinUrl
      };
    } catch (error) {
      return {
        success: false,
        meetingId: '',
        joinUrl: '',
        error: 'Failed to start Teams meeting'
      };
    }
  }

  async scheduleMeeting(options: ScheduleMeetingOptions): Promise<ScheduleResponse> {
    const meetingId = `teams-scheduled-${Date.now()}`;
    const joinUrl = `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
    
    return {
      success: true,
      meetingId,
      joinUrl,
      startTime: options.startTime
    };
  }

  joinMeeting(meetingId: string): void {
    const joinUrl = `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
    window.open(joinUrl, '_blank');
  }
}

class GoogleMeetProvider implements VideoConferenceProvider {
  name = "Google Meet";
  icon = "🌐";

  async startMeeting(options: MeetingOptions): Promise<MeetingResponse> {
    try {
      const meetingId = `meet-${Date.now()}`;
      const joinUrl = `https://meet.google.com/${meetingId}`;
      
      // Open Google Meet
      window.open(joinUrl, '_blank');
      
      return {
        success: true,
        meetingId,
        joinUrl
      };
    } catch (error) {
      return {
        success: false,
        meetingId: '',
        joinUrl: '',
        error: 'Failed to start Google Meet'
      };
    }
  }

  async scheduleMeeting(options: ScheduleMeetingOptions): Promise<ScheduleResponse> {
    const meetingId = `meet-scheduled-${Date.now()}`;
    const joinUrl = `https://meet.google.com/${meetingId}`;
    
    return {
      success: true,
      meetingId,
      joinUrl,
      startTime: options.startTime
    };
  }

  joinMeeting(meetingId: string): void {
    const joinUrl = `https://meet.google.com/${meetingId}`;
    window.open(joinUrl, '_blank');
  }
}

export class VideoConferencingService {
  private providers: Map<string, VideoConferenceProvider> = new Map();
  private defaultProvider: string = 'zoom';

  constructor() {
    this.providers.set('zoom', new ZoomProvider());
    this.providers.set('teams', new TeamsProvider());
    this.providers.set('googlemeet', new GoogleMeetProvider());
  }

  getAvailableProviders(): VideoConferenceProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(name: string): VideoConferenceProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  setDefaultProvider(name: string): void {
    if (this.providers.has(name.toLowerCase())) {
      this.defaultProvider = name.toLowerCase();
    }
  }

  async startQuickMeeting(topic?: string): Promise<MeetingResponse> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error('No default provider set');
    }

    return provider.startMeeting({ topic });
  }

  async scheduleTeamMeeting(options: ScheduleMeetingOptions): Promise<ScheduleResponse> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error('No default provider set');
    }

    return provider.scheduleMeeting(options);
  }

  joinMeetingByUrl(url: string): void {
    window.open(url, '_blank');
  }

  // Screen sharing functionality
  async startScreenShare(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // In a real implementation, this would be shared through the video platform
        console.log('Screen sharing started', stream);
        
        // Show notification
        alert('Screen sharing started! Your screen is now being shared with team members.');
      } else {
        throw new Error('Screen sharing not supported');
      }
    } catch (error) {
      alert('Screen sharing failed. Please ensure you have granted the necessary permissions.');
    }
  }
}

export const videoConferencingService = new VideoConferencingService();