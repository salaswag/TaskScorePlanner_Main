
import * as React from 'react';
const { useState, useEffect } = React;

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
    if (window.visualViewport) {
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
      // Fallback for browsers without visual viewport API
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }, []);

  return {
    isKeyboardVisible,
    viewportHeight,
    keyboardHeight,
  };
}
