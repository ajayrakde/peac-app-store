import React from "react";
import { MatchingEngine } from "./MatchingEngine";

export const AdminCompatibilityEngine: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Compatibility Engine</h1>
      <MatchingEngine />
    </div>
  );
};
