import html2canvas, { Options } from 'html2canvas';

/**
 * Converts OKLCH colors to standard sRGB representation (rgb or rgba)
 */
export function oklchToRgb(l: number, c: number, h: number, alpha: number = 1): string {
  // Clamp input values
  l = Math.max(0, Math.min(1, l));
  c = Math.max(0, c);
  
  // Convert hue to radians
  const hRad = (h * Math.PI) / 180;
  
  // OKLCH to OKLAB
  const okl_a = c * Math.cos(hRad);
  const okl_b = c * Math.sin(hRad);
  
  // OKLAB to LMS
  const l_ = l + 0.3963377774 * okl_a + 0.2158037573 * okl_b;
  const m_ = l - 0.1055613458 * okl_a - 0.0638541728 * okl_b;
  const s_ = l - 0.0894841775 * okl_a - 1.2914855480 * okl_b;
  
  // Cube LMS
  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;
  
  // LMS to linear RGB
  let r_linear = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  let g_linear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  let b_linear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;
  
  // Clamp linear RGB
  r_linear = Math.max(0, Math.min(1, r_linear));
  g_linear = Math.max(0, Math.min(1, g_linear));
  b_linear = Math.max(0, Math.min(1, b_linear));
  
  // Gamma correction
  const f = (val: number) => {
    return val <= 0.0031308 ? 12.92 * val : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
  };
  
  const r = Math.round(f(r_linear) * 255);
  const g = Math.round(f(g_linear) * 255);
  const b = Math.round(f(b_linear) * 255);
  
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Parses and replaces oklch(...) expressions inside a string with standard rgb(...) or rgba(...) format
 */
export const replaceOklchInString = (str: string): string => {
  if (!str) return str;
  // Match oklch(L C H) or oklch(L C H / A)
  return str.replace(/oklch\s*\(\s*([^,)\s]+)\s+([^,)\s]+)\s+([^,)\s/]+)(?:\s*\/\s*([^,)\s]+))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) l /= 100;
      
      let c = parseFloat(cStr);
      if (cStr.includes('%')) c /= 100;
      
      let h = parseFloat(hStr);
      if (hStr.includes('deg')) h = parseFloat(hStr.replace('deg', ''));
      else if (hStr.includes('rad')) h = parseFloat(hStr.replace('rad', '')) * (180 / Math.PI);
      else if (hStr.includes('turn')) h = parseFloat(hStr.replace('turn', '')) * 360;

      let alpha = 1;
      if (aStr) {
        let a = parseFloat(aStr);
        if (aStr.includes('%')) a /= 100;
        alpha = a;
      }

      if (isNaN(l) || isNaN(c) || isNaN(h)) return match;
      return oklchToRgb(l, c, h, alpha);
    } catch (e) {
      return match;
    }
  });
};

/**
 * Replaces color-mix(...) expressions with approximate solid fallback colors
 */
export const replaceColorMixInString = (str: string): string => {
  if (!str) return str;
  // Simple heuristic color mix resolver that extracts the primary color component
  return str.replace(/color-mix\s*\(\s*in\s+[a-z0-9]+\s*,\s*([^,]+?)(?:\s+\d+%?)?\s*,\s*([^,]+?)(?:\s+\d+%?)?\s*\)/gi, (match, col1, col2) => {
    const isCol1Trans = col1.trim().toLowerCase() === 'transparent';
    const isCol2Trans = col2.trim().toLowerCase() === 'transparent';
    const activeCol = isCol1Trans ? col2 : col1;
    return activeCol.trim();
  });
};

/**
 * Deeply strips/replaces any unsupported CSS color function expressions from CSS text.
 * Covers oklch(), oklab(), color-mix(), lab(), lch(), hwb(), light-dark()
 */
export const deepCleanCssText = (css: string): string => {
  if (!css) return css;
  let cleaned = css;
  
  // First convert all OKLCH colors to standard RGB/RGBA values
  cleaned = replaceOklchInString(cleaned);
  
  // Then replace color-mix with fallback colors
  cleaned = replaceColorMixInString(cleaned);

  let prev = '';
  let iterations = 0;

  // Loop to handle any remaining nested function calls
  while (cleaned !== prev && iterations < 5) {
    prev = cleaned;
    iterations++;
    cleaned = cleaned
      .replace(/color-mix\s*\([^;}]*\)/gi, '#4f46e5')
      .replace(/oklch\s*\([^;}]*\)/gi, '#111111')
      .replace(/oklab\s*\([^;}]*\)/gi, '#111111')
      .replace(/lab\s*\([^;}]*\)/gi, '#111111')
      .replace(/lch\s*\([^;}]*\)/gi, '#111111')
      .replace(/hwb\s*\([^;}]*\)/gi, '#111111')
      .replace(/light-dark\s*\([^;}]*\)/gi, '#111111');
  }
  return cleaned;
};

/**
 * Converts any element node and its children into an isolated export-safe DOM tree
 * with computed styles and zero unsupported CSS color functions or stylesheet dependencies.
 */
export const makeElementExportSafe = (element: HTMLElement): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'export-safe-root';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${element.offsetWidth || 800}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111111';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  const clonedNode = element.cloneNode(true) as HTMLElement;

  const cleanRecursively = (origNode: Element, cloneNode: Element) => {
    if (cloneNode instanceof HTMLElement || cloneNode instanceof SVGElement) {
      // KEEP classes so stylesheet rules can still resolve
      // Sanitize existing inline style attribute
      const inlineStyle = (cloneNode as any).getAttribute('style') || '';
      if (inlineStyle) {
        (cloneNode as any).setAttribute('style', deepCleanCssText(inlineStyle));
      }

      // Extract and apply computed styles from original node
      if (origNode instanceof HTMLElement || origNode instanceof SVGElement) {
        try {
          const comp = window.getComputedStyle(origNode);
          const cloneStyle = (cloneNode as any).style;

          const sanitizeColor = (val: string, fallback: string): string => {
            if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') return fallback;
            if (/oklch|oklab|color-mix|lab\(|lch\(|hwb\(|light-dark\(/i.test(val)) {
              return deepCleanCssText(val);
            }
            return val;
          };

          // Basic Layout & Positioning
          cloneStyle.display = comp.display;
          cloneStyle.position = comp.position;
          if (comp.position !== 'static') {
            cloneStyle.top = comp.top;
            cloneStyle.left = comp.left;
            cloneStyle.right = comp.right;
            cloneStyle.bottom = comp.bottom;
            cloneStyle.zIndex = comp.zIndex;
          }

          // Box Sizing
          cloneStyle.width = comp.width;
          cloneStyle.height = comp.height;
          cloneStyle.minWidth = comp.minWidth;
          cloneStyle.minHeight = comp.minHeight;
          cloneStyle.maxWidth = comp.maxWidth;
          cloneStyle.maxHeight = comp.maxHeight;
          cloneStyle.boxSizing = comp.boxSizing;

          // Flexbox properties
          cloneStyle.flexDirection = comp.flexDirection;
          cloneStyle.flexWrap = comp.flexWrap;
          cloneStyle.flexGrow = comp.flexGrow;
          cloneStyle.flexShrink = comp.flexShrink;
          cloneStyle.flexBasis = comp.flexBasis;

          // Grid properties
          cloneStyle.gridTemplateColumns = comp.gridTemplateColumns;
          cloneStyle.gridTemplateRows = comp.gridTemplateRows;
          cloneStyle.gridColumn = comp.gridColumn;
          cloneStyle.gridRow = comp.gridRow;
          cloneStyle.gridArea = comp.gridArea;
          cloneStyle.gap = comp.gap;
          cloneStyle.columnGap = comp.columnGap;
          cloneStyle.rowGap = comp.rowGap;

          // Alignment properties
          cloneStyle.justifyContent = comp.justifyContent;
          cloneStyle.alignItems = comp.alignItems;
          cloneStyle.alignContent = comp.alignContent;
          cloneStyle.justifyItems = comp.justifyItems;
          cloneStyle.alignSelf = comp.alignSelf;
          cloneStyle.justifySelf = comp.justifySelf;

          // Spacing
          cloneStyle.padding = comp.padding;
          cloneStyle.paddingTop = comp.paddingTop;
          cloneStyle.paddingRight = comp.paddingRight;
          cloneStyle.paddingBottom = comp.paddingBottom;
          cloneStyle.paddingLeft = comp.paddingLeft;
          
          cloneStyle.margin = comp.margin;
          cloneStyle.marginTop = comp.marginTop;
          cloneStyle.marginRight = comp.marginRight;
          cloneStyle.marginBottom = comp.marginBottom;
          cloneStyle.marginLeft = comp.marginLeft;

          // Typography
          cloneStyle.color = sanitizeColor(comp.color, '#111111');
          cloneStyle.fontSize = comp.fontSize;
          cloneStyle.fontWeight = comp.fontWeight;
          cloneStyle.fontFamily = comp.fontFamily;
          cloneStyle.lineHeight = comp.lineHeight;
          cloneStyle.letterSpacing = comp.letterSpacing;
          cloneStyle.textAlign = comp.textAlign;
          cloneStyle.textTransform = comp.textTransform;
          cloneStyle.textDecoration = comp.textDecoration;
          cloneStyle.whiteSpace = comp.whiteSpace;
          cloneStyle.wordBreak = comp.wordBreak;
          cloneStyle.overflowWrap = comp.overflowWrap;
          cloneStyle.textOverflow = comp.textOverflow;

          // Borders & Backgrounds
          cloneStyle.backgroundColor = sanitizeColor(comp.backgroundColor, '#ffffff');
          if (comp.background) cloneStyle.background = sanitizeColor(comp.background, '');
          if (comp.backgroundImage) cloneStyle.backgroundImage = sanitizeColor(comp.backgroundImage, '');
          
          cloneStyle.border = comp.border;
          cloneStyle.borderWidth = comp.borderWidth;
          cloneStyle.borderStyle = comp.borderStyle;
          cloneStyle.borderColor = sanitizeColor(comp.borderColor, '#E5E7EB');

          cloneStyle.borderTop = comp.borderTop;
          cloneStyle.borderTopWidth = comp.borderTopWidth;
          cloneStyle.borderTopStyle = comp.borderTopStyle;
          cloneStyle.borderTopColor = sanitizeColor(comp.borderTopColor, '#E5E7EB');

          cloneStyle.borderRight = comp.borderRight;
          cloneStyle.borderRightWidth = comp.borderRightWidth;
          cloneStyle.borderRightStyle = comp.borderRightStyle;
          cloneStyle.borderRightColor = sanitizeColor(comp.borderRightColor, '#E5E7EB');

          cloneStyle.borderBottom = comp.borderBottom;
          cloneStyle.borderBottomWidth = comp.borderBottomWidth;
          cloneStyle.borderBottomStyle = comp.borderBottomStyle;
          cloneStyle.borderBottomColor = sanitizeColor(comp.borderBottomColor, '#E5E7EB');

          cloneStyle.borderLeft = comp.borderLeft;
          cloneStyle.borderLeftWidth = comp.borderLeftWidth;
          cloneStyle.borderLeftStyle = comp.borderLeftStyle;
          cloneStyle.borderLeftColor = sanitizeColor(comp.borderLeftColor, '#E5E7EB');

          cloneStyle.borderRadius = comp.borderRadius;
          cloneStyle.borderTopLeftRadius = comp.borderTopLeftRadius;
          cloneStyle.borderTopRightRadius = comp.borderTopRightRadius;
          cloneStyle.borderBottomLeftRadius = comp.borderBottomLeftRadius;
          cloneStyle.borderBottomRightRadius = comp.borderBottomRightRadius;

          // Visual / Other
          cloneStyle.opacity = comp.opacity;
          cloneStyle.visibility = comp.visibility;
          cloneStyle.transform = comp.transform;
          cloneStyle.transformOrigin = comp.transformOrigin;
          cloneStyle.verticalAlign = comp.verticalAlign;
          
          if (cloneNode instanceof SVGElement) {
            cloneStyle.fill = comp.fill;
            cloneStyle.stroke = comp.stroke;
            cloneStyle.strokeWidth = comp.strokeWidth;
          }

          // Strip complex shadows that might reference oklch or cause artifacts
          cloneStyle.boxShadow = 'none';
          cloneStyle.textShadow = 'none';
        } catch (e) {
          // Ignore computed style errors
        }
      }
    }

    const origChildren = Array.from(origNode.children);
    const cloneChildren = Array.from(cloneNode.children);
    for (let i = 0; i < origChildren.length; i++) {
      if (cloneChildren[i]) {
        cleanRecursively(origChildren[i], cloneChildren[i]);
      }
    }
  };

  cleanRecursively(element, clonedNode);
  container.appendChild(clonedNode);
  return container;
};

/**
 * Sanitizes a cloned DOM document before html2canvas parses its CSS rules.
 */
export const sanitizeClonedDocForHtml2Canvas = (clonedDoc: Document): void => {
  try {
    // 1. Sanitize all <style> tags in the cloned document
    const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
    styleElements.forEach((style) => {
      if (style.textContent) {
        style.textContent = deepCleanCssText(style.textContent);
      }
    });

    // 2. Remove or disable <link rel="stylesheet"> elements in cloned document
    const linkElements = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
    linkElements.forEach((link) => {
      link.setAttribute('media', 'not all');
      link.remove();
    });

    // 3. Inject explicit export-safe style override into head
    const exportOverrideStyle = clonedDoc.createElement('style');
    exportOverrideStyle.textContent = `
      *, *::before, *::after {
        box-shadow: none !important;
        text-shadow: none !important;
      }
    `;
    clonedDoc.head.appendChild(exportOverrideStyle);

    // 4. Traverse all elements in cloned document and clean inline style attributes
    const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
    allElements.forEach((htmlEl) => {
      if (htmlEl.style) {
        try {
          const styleAttr = htmlEl.getAttribute('style');
          if (styleAttr && /oklch|oklab|color-mix|lab\(|lch\(|hwb\(|light-dark\(/i.test(styleAttr)) {
            htmlEl.setAttribute('style', deepCleanCssText(styleAttr));
          }
        } catch (e) {
          // Ignore
        }
      }
    });
  } catch (err) {
    console.warn('[html2canvasSanitizer] Warning during DOM sanitization:', err);
  }
};

/**
 * Safe wrapper around html2canvas that applies sanitization in the onclone callback.
 */
export const safeHtml2Canvas = async (
  element: HTMLElement,
  options: Partial<Options> = {}
): Promise<HTMLCanvasElement> => {
  const customOnClone = options.onclone;

  const mergedOptions: Partial<Options> = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    ...options,
    onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
      sanitizeClonedDocForHtml2Canvas(clonedDoc);
      if (customOnClone) {
        customOnClone(clonedDoc, clonedElement);
      }
    }
  };

  return await html2canvas(element, mergedOptions);
};
