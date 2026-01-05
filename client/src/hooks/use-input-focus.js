
import { useRef, useCallback } from 'react';

export function useInputFocus() {
  const activeInputRef = useRef(null);

  const scrollToInput = useCallback((element, offset = 20) => {
    if (!element) return;

    // Wait for keyboard to appear
    setTimeout(() => {
      const elementRect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const keyboardHeight = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
      
      // Calculate if element is hidden behind keyboard
      const availableHeight = viewportHeight - keyboardHeight;
      const elementBottom = elementRect.bottom;
      
      if (elementBottom > availableHeight - offset) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 300); // Wait for keyboard animation
  }, []);

  const handleInputFocus = useCallback((event) => {
    const input = event.target;
    activeInputRef.current = input;
    
    // Add focused class for styling
    input.classList.add('input-focused');
    
    // Set appropriate input mode for better mobile keyboards
    if (input.type === 'number' || input.name === 'priority' || input.name === 'estimatedTime') {
      input.setAttribute('inputmode', 'numeric');
    } else if (input.type === 'email') {
      input.setAttribute('inputmode', 'email');
    } else {
      input.setAttribute('inputmode', 'text');
    }
    
    scrollToInput(input);
  }, [scrollToInput]);

  const handleInputBlur = useCallback((event) => {
    const input = event.target;
    input.classList.remove('input-focused');
    
    if (activeInputRef.current === input) {
      activeInputRef.current = null;
    }
  }, []);

  const focusNextInput = useCallback(() => {
    if (!activeInputRef.current) return;
    
    const form = activeInputRef.current.closest('form');
    if (!form) return;
    
    const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
    const currentIndex = inputs.indexOf(activeInputRef.current);
    const nextInput = inputs[currentIndex + 1];
    
    if (nextInput) {
      nextInput.focus();
    }
  }, []);

  const focusPreviousInput = useCallback(() => {
    if (!activeInputRef.current) return;
    
    const form = activeInputRef.current.closest('form');
    if (!form) return;
    
    const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
    const currentIndex = inputs.indexOf(activeInputRef.current);
    const previousInput = inputs[currentIndex - 1];
    
    if (previousInput) {
      previousInput.focus();
    }
  }, []);

  return {
    activeInputRef,
    handleInputFocus,
    handleInputBlur,
    focusNextInput,
    focusPreviousInput,
    scrollToInput,
  };
}
