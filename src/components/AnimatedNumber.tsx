import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: string | number;
  duration?: number; // ms
}

export function AnimatedNumber({ value, duration = 650 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const lastValueRef = useRef<string | number>('');

  useEffect(() => {
    // If reduced motion is preferred, render static value immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(String(value));
      lastValueRef.current = value;
      return;
    }

    const valueStr = String(value);
    
    // Prevent animation on identical values or unrelated renders
    if (lastValueRef.current === valueStr) {
      setDisplayValue(valueStr);
      return;
    }

    // Parse numeric characters, decimal points, and preserve formatting
    const numericMatch = valueStr.match(/[\d,.]+/);
    if (!numericMatch) {
      // Not a numeric string, render statically
      setDisplayValue(valueStr);
      lastValueRef.current = valueStr;
      return;
    }

    const numberText = numericMatch[0];
    const isCurrency = valueStr.includes('$');
    const isPercentage = valueStr.includes('%');
    
    // Clean string to parse as a float (remove commas)
    const targetValue = parseFloat(numberText.replace(/,/g, ''));
    if (isNaN(targetValue)) {
      setDisplayValue(valueStr);
      lastValueRef.current = valueStr;
      return;
    }

    // Determine decimal places from the raw text
    const hasDecimal = numberText.includes('.');
    const decimalPlaces = hasDecimal ? numberText.split('.')[1].length : 0;

    // Set starting number
    let startValue = 0;
    if (lastValueRef.current) {
      const lastStr = String(lastValueRef.current);
      const lastMatch = lastStr.match(/[\d,.]+/);
      if (lastMatch) {
        startValue = parseFloat(lastMatch[0].replace(/,/g, '')) || 0;
      }
    }

    let startTime: number | null = null;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Use easeOutQuad for smooth ending
      const easePercentage = percentage * (2 - percentage);
      
      const currentValue = startValue + (targetValue - startValue) * easePercentage;
      
      // Format current number
      let formattedNum = currentValue.toFixed(decimalPlaces);
      if (!hasDecimal) {
        if (numberText.includes(',') || targetValue >= 1000) {
          formattedNum = Math.floor(currentValue).toLocaleString('en-US');
        }
      } else {
        const parts = formattedNum.split('.');
        if (numberText.includes(',') || targetValue >= 1000) {
          parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
        }
        formattedNum = parts.join('.');
      }

      // Reconstruct final string with prefix/suffix
      let result = formattedNum;
      if (isCurrency) result = '$' + result;
      if (isPercentage) result = result + '%';
      
      const finalResult = valueStr.replace(/[\d,.]+/, result);
      setDisplayValue(finalResult);

      if (percentage < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(valueStr); // Ensure exact final value matching database
        lastValueRef.current = valueStr;
      }
    };

    requestAnimationFrame(animateCount);
  }, [value, duration]);

  return <span>{displayValue || String(value)}</span>;
}
