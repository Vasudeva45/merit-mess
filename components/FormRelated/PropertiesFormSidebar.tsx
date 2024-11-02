  import React from "react";
  import useDesigner from "./hooks/useDesigner";
  import { FormElements } from "./FormElements";
  import { Button } from "../ui/button";
  import { AiOutlineClose } from "react-icons/ai";
import { Separator } from "../ui/separator";

  function PropertiesFormSidebar() {
    const { selectedElement, setSelectedElement } = useDesigner();
    
    if (!selectedElement) return null;

    const PropertiesForm = FormElements[selectedElement?.type].propertiesComponent;

    return (
      <div 
        className="flex flex-col p-2"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex justify-between items-center">
          <p className="text-sm text-foreground/70">Element properties</p>
          <Button 
            size={"icon"} 
            variant={"ghost"} 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement(null);
            }}
          >
            <AiOutlineClose />
          </Button>
        </div>
        <Separator className="mb-4 "/>
        <PropertiesForm elementInstance={selectedElement} />
      </div>
    );
  }

  export default PropertiesFormSidebar;