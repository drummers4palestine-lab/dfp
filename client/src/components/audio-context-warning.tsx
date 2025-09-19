import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AudioContextWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile browser (likely to have audio context restrictions)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = navigator.userAgent.includes('Chrome');
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    
    // Show warning on mobile browsers or browsers known to have audio restrictions
    if ((isMobile || isChrome || isSafari) && !dismissed) {
      setShowWarning(true);
    }
  }, [dismissed]);

  if (!showWarning) return null;

  return (
    <Card className="bg-yellow-900/20 border-yellow-600 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Audio Notice for Mobile Users
            </h4>
            <p className="text-yellow-200 text-sm mb-3">
              Some mobile browsers (Chrome, Safari) require you to click the play button to enable audio. 
              If you don't hear sound initially, try:
            </p>
            <ul className="text-yellow-200 text-sm space-y-1 mb-3 ml-4">
              <li>• Click play and wait a moment for audio to load</li>
              <li>• Check your device volume is turned up</li>
              <li>• Try switching to Firefox if issues persist</li>
              <li>• Enable auto-play in your browser settings</li>
            </ul>
            <p className="text-yellow-300 text-xs">
              This is due to browser security policies that require user interaction before playing audio.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDismissed(true);
              setShowWarning(false);
            }}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}