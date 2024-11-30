"use client";

import React, { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function DescriptionExpander({
  description,
  maxLength = 150,
}: {
  description: string;
  maxLength?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description || description.length <= maxLength) {
    return <p className="text-muted-foreground">{description}</p>;
  }

  return (
    <div>
      <p className="text-muted-foreground">
        {isExpanded ? description : `${description.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary text-sm flex items-center gap-1 mt-1 hover:underline"
      >
        {isExpanded ? (
          <>
            Show less <LuChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Show more <LuChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
