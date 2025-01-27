"use client";

import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { ExternalLink } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  creatorProfile: {
    name: string;
  };
  meetLink?: string;
}

interface MeetingsViewProps {
  meetings: Meeting[];
  groupId: string;
  onUpdate: () => void;
}

export default function MeetingsView({ meetings, groupId, onUpdate }: MeetingsViewProps) {
  const handleJoinMeeting = (meetLink: string) => {
    // Ensure the link is a valid external URL
    const validUrl = meetLink.startsWith('http') ? meetLink : `https://${meetLink}`;
    window.open(validUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {meetings.length === 0 ? (
        <p className="text-gray-500 text-center">No meetings scheduled</p>
      ) : (
        meetings.map((meeting) => (
          <div 
            key={meeting.id} 
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{meeting.title}</h3>
              <p className="text-sm text-gray-500">
                {meeting.description}
              </p>
              <p className="text-xs text-gray-400">
                Scheduled {formatDistance(new Date(meeting.scheduledFor), new Date(), { addSuffix: true })}
                {" "}by {meeting.creatorProfile.name}
              </p>
            </div>
            {meeting.meetLink && (
              <Button 
                variant="outline"
                onClick={() => handleJoinMeeting(meeting.meetLink)}
                className="flex items-center gap-2"
              >
                Join Meeting
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}