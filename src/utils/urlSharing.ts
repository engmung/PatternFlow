/**
 * URL Sharing Utilities for PatternFlow
 * 
 * Enables sharing patterns via URL by encoding preset data into URL-safe strings.
 * Uses LZ compression for efficient URL length.
 */

import LZString from 'lz-string';
import { Node, Connection, ColorRampStop } from '../studio/types';

// Shareable preset structure
export interface ShareablePreset {
  nodes: Node[];
  connections: Connection[];
  colorRamp: ColorRampStop[];
  gridResolution?: number;
  name?: string;
}

// URL parameter key
const URL_PARAM_KEY = 'pattern';

/**
 * Encode a preset into a URL-safe compressed string
 */
export function encodePreset(preset: ShareablePreset): string {
  try {
    const json = JSON.stringify(preset);
    // Compress and encode to URL-safe base64
    const compressed = LZString.compressToEncodedURIComponent(json);
    return compressed;
  } catch (error) {
    console.error('Failed to encode preset:', error);
    return '';
  }
}

/**
 * Decode a URL parameter back into a preset object
 */
export function decodePreset(encoded: string): ShareablePreset | null {
  try {
    // Decompress from URL-safe base64
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    
    const preset = JSON.parse(json) as ShareablePreset;
    
    // Basic validation
    if (!preset.nodes || !Array.isArray(preset.nodes)) return null;
    if (!preset.connections || !Array.isArray(preset.connections)) return null;
    if (!preset.colorRamp || !Array.isArray(preset.colorRamp)) return null;
    
    return preset;
  } catch (error) {
    console.error('Failed to decode preset:', error);
    return null;
  }
}

/**
 * Generate a full shareable URL for the landing page with preset data
 */
export function generateShareUrl(preset: ShareablePreset): string {
  const encoded = encodePreset(preset);
  if (!encoded) return '';
  
  // Always point to landing page (root) for sharing
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/`
    : '';
  
  return `${baseUrl}?${URL_PARAM_KEY}=${encoded}#process`;
}

/**
 * Extract preset from current URL if present
 */
export function getPresetFromUrl(): ShareablePreset | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get(URL_PARAM_KEY);
  
  if (!encoded) return null;
  
  return decodePreset(encoded);
}

/**
 * Clear the pattern parameter from URL without page reload
 */
export function clearPatternFromUrl(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.delete(URL_PARAM_KEY);
  
  window.history.replaceState({}, '', url.toString());
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
