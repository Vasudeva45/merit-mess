"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileUp,
  Download,
  File,
  Loader2,
  Eye,
  Link,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectFilesProps {
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
    viewUrl: string;
  }>;
  groupId: number;
  onUpdate: () => void;
}

const ProjectFiles: React.FC<ProjectFilesProps> = ({ files, groupId, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<null | {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
    viewUrl: string;
  }>(null);
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
      formData.append("file", file);
      formData.append("groupId", groupId.toString());

      // Upload file
      const response = await fetch("/api/upload-project-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
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
        fileInputRef.current.value = "";
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

  const copyViewUrl = async (viewUrl: string) => {
    try {
      const fullUrl = `${window.location.origin}/files/${viewUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Success",
        description: "View URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const isViewableFile = (type: string) => {
    return (
      type.startsWith("image/") ||
      type === "application/pdf" ||
      type.startsWith("text/") ||
      type === "application/json"
    );
  };

  const renderFilePreview = (file: { id: string; name: string; type: string; size: number; uploadedAt: string; url: string; viewUrl: string }) => {
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full h-auto max-h-[70vh] object-contain"
        />
      );
    } else if (file.type === "application/pdf") {
      return (
        <iframe src={file.url} className="w-full h-[70vh]" title={file.name} />
      );
    } else if (
      file.type.startsWith("text/") ||
      file.type === "application/json"
    ) {
      return (
        <iframe
          src={file.url}
          className="w-full h-[70vh] bg-white"
          title={file.name}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <File className="h-16 w-16 text-gray-400" />
          <p className="text-gray-500">This file type cannot be previewed</p>
          <Button asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              Open File <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold">Project Files</h2>
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
            <Button asChild disabled={uploading} className="w-full sm:w-auto">
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
          {/* Desktop Table View */}
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
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
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} download title={`Download ${file.name}`}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyViewUrl(file.viewUrl)}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
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

          {/* Mobile List View */}
          <div className="sm:hidden">
            {files.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                No files uploaded yet
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center p-4 border-b hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(file.uploadedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={file.url} download>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => copyViewUrl(file.viewUrl)}
                      >
                        <Link className="mr-2 h-4 w-4" /> Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFile(file)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedFile}
        onOpenChange={(open) => !open && setSelectedFile(null)}
      >
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <File className="h-5 w-5" />
              <span>{selectedFile?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedFile && renderFilePreview(selectedFile)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectFiles;
