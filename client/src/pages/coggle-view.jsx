import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import { Link } from "wouter";

export function CoggleView() {
  const [aspectRatio, setAspectRatio] = React.useState(16/9);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAspectRatio(16/9)}
            className={aspectRatio === 16/9 ? "bg-blue-50 border-blue-200" : ""}
          >
            16:9
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAspectRatio(4/3)}
            className={aspectRatio === 4/3 ? "bg-blue-50 border-blue-200" : ""}
          >
            4:3
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAspectRatio(1)}
            className={aspectRatio === 1 ? "bg-blue-50 border-blue-200" : ""}
          >
            Square
          </Button>
        </div>
      </div>
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
        <CardContent 
          className="p-0 h-0 relative bg-slate-50 dark:bg-gray-950 transition-all duration-300"
          style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
        >
          <iframe 
            src="https://embed.coggle.it/diagram/YVjUEgDOVWev5Dk-/tZDf9srGCAhC7uxSKxdFS-n_6sbuH1rE0HHUKYaqo4s" 
            title="Coggle Mind Map"
            frameBorder="0" 
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
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
