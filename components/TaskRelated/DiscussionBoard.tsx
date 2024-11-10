import React, { useState, useRef, useEffect } from "react";
import { createDiscussion, addComment } from "@/actions/task";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Send, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getPusherClient } from "@/lib/pusher";

const DiscussionBoard = ({
  discussions: initialDiscussions,
  groupId,
  onUpdate,
}) => {
  const { user } = useUser();
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
  });
  const [commentText, setCommentText] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const pusherClientRef = useRef(null);
  const channelRef = useRef(null);

  const generateTempId = () => `temp-${Date.now()}-${Math.random()}`;

  useEffect(() => {
    setDiscussions(initialDiscussions);
  }, [initialDiscussions]);

  useEffect(() => {
    if (activeDiscussion) {
      const updatedDiscussion = discussions.find(
        (d) => d.id === activeDiscussion.id
      );
      if (updatedDiscussion) {
        setActiveDiscussion(updatedDiscussion);
      }
    }
  }, [discussions]);

  // Initialize Pusher client
  useEffect(() => {
    pusherClientRef.current = getPusherClient();
    return () => {
      if (pusherClientRef.current) {
        pusherClientRef.current.disconnect();
      }
    };
  }, []);

  // Handle Pusher subscriptions and events
  useEffect(() => {
    if (!activeDiscussion || !pusherClientRef.current) return;

    // Unsubscribe from previous channel if exists
    if (channelRef.current) {
      pusherClientRef.current.unsubscribe(channelRef.current.name);
    }

    // Subscribe to new channel
    const channelName = `discussion-${activeDiscussion.id}`;
    channelRef.current = pusherClientRef.current.subscribe(channelName);

    // Handle new comments
    channelRef.current.bind("new-comment", (newComment) => {
      if (newComment.author?.sub !== user?.sub) {
        setDiscussions((prev) =>
          prev.map((discussion) => {
            if (discussion.id === activeDiscussion.id) {
              return {
                ...discussion,
                comments: [...(discussion.comments || []), newComment],
              };
            }
            return discussion;
          })
        );
        scrollToBottom();
      }
    });

    // Handle typing indicators
    channelRef.current.bind("typing", (data) => {
      if (data.userId !== user?.sub) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherClientRef.current.unsubscribe(channelName);
      }
    };
  }, [activeDiscussion, user?.sub]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeDiscussion?.comments]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const createdDiscussion = await createDiscussion(groupId, newDiscussion);
      setDiscussions((prev) => [
        ...prev,
        {
          ...createdDiscussion,
          comments: [],
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsCreateOpen(false);
      setNewDiscussion({ title: "", content: "" });
      onUpdate();
    } catch (error) {
      console.error("Failed to create discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!commentText.trim() || !channelRef.current) return;

    const tempId = generateTempId();
    const optimisticComment = {
      id: tempId,
      content: commentText,
      createdAt: new Date().toISOString(),
      author: {
        name: user?.name || "You",
        sub: user?.sub,
      },
      isPending: true,
    };

    // Update UI immediately with optimistic comment
    setDiscussions((prev) =>
      prev.map((discussion) => {
        if (discussion.id === discussionId) {
          return {
            ...discussion,
            comments: [...(discussion.comments || []), optimisticComment],
          };
        }
        return discussion;
      })
    );

    setCommentText("");
    scrollToBottom();

    try {
      const savedComment = await addComment({
        content: optimisticComment.content,
        discussionId,
      });

      // Update discussions with the saved comment
      setDiscussions((prev) =>
        prev.map((discussion) => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              comments: discussion.comments.map((comment) =>
                comment.id === tempId
                  ? { ...savedComment, isPending: false }
                  : comment
              ),
            };
          }
          return discussion;
        })
      );
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Remove optimistic comment on error
      setDiscussions((prev) =>
        prev.map((discussion) => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              comments: discussion.comments.filter(
                (comment) => comment.id !== tempId
              ),
            };
          }
          return discussion;
        })
      );
    }
  };

  const handleTyping = () => {
    if (activeDiscussion && channelRef.current) {
      channelRef.current.trigger("client-typing", {
        userId: user?.sub,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(activeDiscussion.id);
    } else {
      handleTyping();
    }
  };

  const filteredDiscussions = discussions.filter((discussion) =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderComment = (comment, index) => (
    <div key={comment.id || index} className="flex items-start gap-2 mb-4">
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author.name}`}
        />
        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div
          className={`border rounded-lg p-4 shadow-sm inline-block max-w-2xl ${
            comment.isPending ? "opacity-70" : ""
          }`}
        >
          <div className="flex items-baseline justify-between gap-4 mb-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {comment.author.name}
              {comment.isPending && (
                <span className="text-xs text-muted-foreground">
                  (Sending...)
                </span>
              )}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex">
      {/* Sidebar with discussions list */}
      <div className="w-[380px] flex flex-col border-r">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Discussions</h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Discussion</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDiscussion} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newDiscussion.title}
                      onChange={(e) =>
                        setNewDiscussion({
                          ...newDiscussion,
                          title: e.target.value,
                        })
                      }
                      placeholder="Discussion title..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={newDiscussion.content}
                      onChange={(e) =>
                        setNewDiscussion({
                          ...newDiscussion,
                          content: e.target.value,
                        })
                      }
                      placeholder="What would you like to discuss?"
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Discussion"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              className={`p-4 border-b cursor-pointer transition-colors duration-200 ${
                activeDiscussion?.id === discussion.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setActiveDiscussion(discussion)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium line-clamp-1">{discussion.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(discussion.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {discussion.content}
              </p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mr-1" />
                {discussion.comments?.length || 0} messages
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main discussion area */}
      <div className="flex-1 flex flex-col">
        {activeDiscussion ? (
          <>
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{activeDiscussion.title}</h3>
              <p className="text-sm text-muted-foreground">
                Started{" "}
                {formatDistanceToNow(new Date(activeDiscussion.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start gap-2 mb-6">
                <div className="flex-1">
                  <div className="bg-accent rounded-lg p-4 inline-block max-w-2xl">
                    <p className="text-sm font-medium mb-1">
                      Discussion Starter
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {activeDiscussion.content}
                    </p>
                  </div>
                </div>
              </div>

              {activeDiscussion?.comments?.map((comment, index) =>
                renderComment(comment, index)
              )}
              {isTyping && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <div className="flex space-x-1">
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce" />
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Someone is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={() => handleAddComment(activeDiscussion.id)}
                  disabled={!commentText.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No Discussion Selected</h3>
              <p className="text-muted-foreground">
                Choose a discussion from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionBoard;
