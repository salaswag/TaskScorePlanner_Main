
import { useState, useEffect } from 'react';

// Detect Brave browser
const isBrave = () => {
  return (navigator.brave && navigator.brave.isBrave) || false;
};

export function useKeyboardAware() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const initialHeight = window.innerHeight;
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        
        // Keyboard is likely visible if height decreased by more than 100px
        const keyboardVisible = heightDifference > 100;
        
        setIsKeyboardVisible(keyboardVisible);
        setViewportHeight(currentHeight);
        setKeyboardHeight(keyboardVisible ? heightDifference : 0);
      }, 100);
    };

    // Handle visual viewport API if available (modern browsers)
    // For Brave, be more lenient with keyboard detection
    if (window.visualViewport && !isBrave()) {
      const handleVisualViewportChange = () => {
        const keyboardVisible = window.visualViewport.height < window.innerHeight;
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        
        setIsKeyboardVisible(keyboardVisible);
        setViewportHeight(window.visualViewport.height);
        setKeyboardHeight(keyboardHeight);
      };

      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      
      return () => {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        clearTimeout(resizeTimeout);
      };
    } else {
      // Fallback for browsers without visual viewport API or Brave browser
      if (isBrave()) {
        console.log('🦁 Brave browser detected - using simplified keyboard detection');
        // For Brave, use a more lenient approach to keyboard detection
        const braveHandleResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialHeight - currentHeight;
            
            // Be more lenient for Brave - only consider keyboard visible if significant height change
            const keyboardVisible = heightDifference > 150;
            
            setIsKeyboardVisible(keyboardVisible);
            setViewportHeight(currentHeight);
            setKeyboardHeight(keyboardVisible ? heightDifference : 0);
          }, 200); // Longer timeout for Brave
        };
        
        window.addEventListener('resize', braveHandleResize);
        
        return () => {
          window.removeEventListener('resize', braveHandleResize);
          clearTimeout(resizeTimeout);
        };
      } else {
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          clearTimeout(resizeTimeout);
        };
      }
    }
  }, []);

  return {
    isKeyboardVisible,
    viewportHeight,
    keyboardHeight,
  };
}
