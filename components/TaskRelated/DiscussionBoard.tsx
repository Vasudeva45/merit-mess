"use client";

import React, { useState, useRef, useEffect } from "react";
import { createDiscussion, addComment } from "@/actions/task";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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

const DiscussionBoard = ({ discussions, groupId, onUpdate }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
  });
  const [commentText, setCommentText] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeDiscussion?.comments]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await createDiscussion(groupId, newDiscussion);
      setIsCreateOpen(false);
      setNewDiscussion({ title: "", content: "" });
      onUpdate();
    } catch (error) {
      console.error("Failed to create discussion:", error);
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!commentText.trim()) return;
    try {
      await addComment({
        content: commentText,
        discussionId,
      });
      setCommentText("");
      onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(activeDiscussion.id);
    }
  };

  const filteredDiscussions = discussions.filter((discussion) =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Discussions List */}
      <div className="w-[380px] flex flex-col border-r">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Discussions</h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
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
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Discussion
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

        {/* Discussions List */}
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
              <p className="text-sm text-muted-foreground line-clamp-1">
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

      {/* Right Side - Messages */}
      <div className="flex-1 flex flex-col">
        {activeDiscussion ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{activeDiscussion.title}</h3>
              <p className="text-sm text-muted-foreground">
                Started{" "}
                {formatDistanceToNow(new Date(activeDiscussion.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Initial Discussion Message */}
              <div className="flex items-start gap-2 mb-6">
                <div className="flex-1">
                  <div className="bg-accent rounded-lg p-4 inline-block max-w-2xl">
                    <p className="text-sm font-medium mb-1">
                      Discussion Starter
                    </p>
                    <p className="text-sm">{activeDiscussion.content}</p>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {activeDiscussion.comments?.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 mb-4">
                  <div className="flex-1">
                    <div className="border rounded-lg p-4 shadow-sm inline-block max-w-2xl">
                      <div className="flex items-baseline justify-between gap-4 mb-1">
                        <p className="text-sm font-medium">
                          {comment.author.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAddComment(activeDiscussion.id)}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Empty State
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
