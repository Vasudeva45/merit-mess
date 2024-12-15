import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResourcesView({ resources, groupId, onUpdate }) {
  const handleOpenResource = (resource) => {
    // Handle different resource types
    switch(resource.type) {
      case 'link':
        const validUrl = resource.url.startsWith('http') 
          ? resource.url 
          : `https://${resource.url}`;
        window.open(validUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'credentials':
        // Implement secure credential viewing (could be a modal)
        break;
      case 'guide':
        // Could open a modal or download
        break;
    }
  };

  const renderResourceIcon = (type) => {
    switch(type) {
      case 'link': return <LinkIcon className="h-5 w-5" />;
      case 'credentials': return <FileText className="h-5 w-5" />;
      case 'guide': return <FileText className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {resources.length === 0 ? (
        <p className="text-gray-500 text-center">No resources shared</p>
      ) : (
        resources.map((resource, index) => {
          // Safely parse description, with fallback
          let details = {};
          try {
            details = JSON.parse(resource.description || '{}');
          } catch (error) {
            details = {
              type: 'unknown',
              description: 'Invalid resource details',
              url: ''
            };
          }
          
          return (
            <div 
              key={index} 
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div className="flex items-center space-x-4">
                {renderResourceIcon(details.type)}
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {resource.name}
                    <Badge variant="secondary">{details.type || 'Unknown'}</Badge>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {details.description || 'No description available'}
                  </p>
                </div>
              </div>
              {(details.type === 'link' || details.type === 'guide') && (
                <Button 
                  variant="outline"
                  onClick={() => handleOpenResource(details)}
                  className="flex items-center gap-2"
                >
                  Open Resource
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}