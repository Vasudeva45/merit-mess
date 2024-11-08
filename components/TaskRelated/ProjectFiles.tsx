"use client";

import React, { useState } from "react";
import { createFileRecord } from "@/actions/task";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUp, Download, File, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ProjectFiles = ({ files, groupId, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId.toString());

      // Upload file
      const response = await fetch('/api/upload-project-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      
      onUpdate();
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Files</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Upload File"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span>{file.name}</span>
                  </TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(file.uploadedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 h-32"
                  >
                    No files uploaded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectFiles;