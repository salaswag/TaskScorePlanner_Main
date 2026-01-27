import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

export function CoggleView() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Coggle Mind Map Integration
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Embed your favorite Coggle diagrams directly into your workspace. 
          While you can view and interact with the embed below, full programmatic 
          manipulation requires a Coggle API key.
        </p>
      </div>

      <Card className="w-full border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden shadow-2xl">
        <CardContent className="p-0 h-[700px] relative bg-slate-50 dark:bg-gray-950">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://coggle.it" 
            title="Coggle Mind Map"
            frameBorder="0" 
            allowFullScreen
            className="w-full h-full"
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start gap-4">
        <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pro Tip: How to embed your own</h3>
          <p className="text-sm text-blue-800/80 dark:text-blue-200/80">
            To show your specific Coggle diagram here:
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Open your diagram on Coggle.it</li>
              <li>Click the share icon (top right)</li>
              <li>Select "Embed in a Website"</li>
              <li>Copy the URL from the iframe src and replace the one in this project's code!</li>
            </ol>
          </p>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <a href="https://coggle.it" target="_blank" rel="noopener noreferrer">
              Go to Coggle <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
