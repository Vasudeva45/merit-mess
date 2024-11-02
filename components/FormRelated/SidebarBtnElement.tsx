import React from "react";
import { FormElement } from "./FormElements";
import { Button } from "../ui/button";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";

function SidebarBtnElement({
  formElement,
}: Readonly<{ formElement: FormElement }>) {
  const { label, icon: Icon } = formElement.designerBtnELement;
  const draggable = useDraggable({
    id: `designer-btn-${formElement.type}`,
    data: {
      type: formElement.type,
      isDesignerBtnElement: true,
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={draggable.setNodeRef}
            variant="ghost"
            className={cn(
              "group relative flex flex-col items-center justify-center",
              "h-[120px] w-[120px] rounded-xl border-2 border-dashed",
              "transition-all duration-300 ease-in-out",
              "hover:border-primary hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              draggable.isDragging 
                ? "ring-2 ring-primary scale-105 shadow-lg" 
                : "hover:scale-105",
              "cursor-grab active:cursor-grabbing"
            )}
            {...draggable.listeners}
            {...draggable.attributes}
          >
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
            
            <Icon 
              className={cn(
                "h-10 w-10 mb-3 text-muted-foreground",
                "group-hover:text-primary",
                "transition-colors duration-300"
              )} 
            />
            
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              {label}
            </p>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <p>Drag to add {label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SidebarBtnElementDragOverlay({
  formElement,
}: Readonly<{ formElement: FormElement }>) {
  const { label, icon: Icon } = formElement.designerBtnELement;

  return (
    <Button
      variant="ghost"
      className="flex flex-col items-center justify-center h-[120px] w-[120px] rounded-xl border-2 border-primary"
    >
      <Icon className="h-10 w-10 mb-3 text-primary" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </Button>
  );
}

export default SidebarBtnElement;