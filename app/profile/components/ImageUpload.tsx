import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  imageUrl?: string;
  profileName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, imageUrl, profileName }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      try {
        await onUpload(file);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="relative w-32 h-32 mx-auto">
      <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/10 bg-primary/5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">
              {profileName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-0 right-0 rounded-full shadow-lg"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;
