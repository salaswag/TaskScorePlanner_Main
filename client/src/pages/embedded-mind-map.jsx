import * as React from "react";
import { MindMapView } from "@/components/mind-map-view";

export default function EmbeddedMindMap() {
  return (
    <div className="w-full h-screen bg-background p-4">
      <div className="flex flex-col h-full gap-4">
        <h1 className="text-2xl font-bold">Embedded Mind Map</h1>
        <div className="flex-1 overflow-hidden border rounded-xl shadow-lg bg-card">
          <MindMapView />
        </div>
      </div>
    </div>
  );
}
