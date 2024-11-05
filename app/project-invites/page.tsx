"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProjectInvitesPage = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvites, setProcessingInvites] = useState({});

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/project-invites');
      if (!response.ok) throw new Error('Failed to fetch invites');
      const data = await response.json();
      setInvites(data);
    } catch (err) {
      setError('Failed to load project invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (groupId, memberId, status) => {
    setProcessingInvites(prev => ({ ...prev, [memberId]: true }));
    try {
      const response = await fetch('/api/project-invites/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, memberId, status }),
      });
      
      if (!response.ok) throw new Error('Failed to update invitation status');
      
      // Remove the processed invite from the list
      setInvites(prev => prev.filter(invite => invite.id !== memberId));
    } catch (err) {
      setError('Failed to process invitation');
    } finally {
      setProcessingInvites(prev => ({ ...prev, [memberId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Project Invitations</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {invites.length === 0 && !error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No pending invitations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <CardHeader>
                <CardTitle>{invite.group.form.name}</CardTitle>
                <CardDescription>
                  {invite.group.form.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    Invited on: {new Date(invite.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    onClick={() => handleInviteResponse(invite.group.id, invite.id, 'rejected')}
                    variant="outline"
                    disabled={processingInvites[invite.id]}
                  >
                    {processingInvites[invite.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="ml-2">Decline</span>
                  </Button>
                  <Button
                    onClick={() => handleInviteResponse(invite.group.id, invite.id, 'accepted')}
                    disabled={processingInvites[invite.id]}
                  >
                    {processingInvites[invite.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="ml-2">Accept</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectInvitesPage;