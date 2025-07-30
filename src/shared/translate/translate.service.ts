import { Injectable, Scope, Inject } from '@nestjs/common';
import * as fs from 'fs';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class Lts {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  // Method to generate the file path based on the language
  private getLanguageFilePath(lang: string): string {
    let langPath = `${process.cwd()}/src/locales/${lang}.json`;
    if(process.env.NODE_ENV==='production' || process.env.NODE_ENV==='staging'){
      langPath = `${process.cwd()}/dist/locales/${lang}.json`;
    }
    return langPath;
  }

  // Helper function to access nested properties in the translation object
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.'); // Split the key by dot to handle nested properties
    let result = obj;
    
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return null; // Return null if the key is not found
      }
    }

    return result;
  }

  async told(key: string): Promise<string> {
    const lang = this.request['language'] || 'en'; // Get language from the request or fallback to 'en'
    const filePath = this.getLanguageFilePath(lang);

    try {
      // Check if the language file exists
      if (!fs.existsSync(filePath)) {
        return key; // Return the key itself if the file doesn't exist
      }

      // Read the file
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(rawData);

      // First try to access the value as a nested key
      const translation = this.getNestedValue(translations, key);

      if (translation !== null) {
        return translation; // Return the translation if found
      }

      // If the key isn't found as a nested key, check if it's a top-level key
      if (translations[key] !== undefined) {
        return translations[key]; // Return the top-level translation if found
      }

      // If neither nested nor top-level key is found, return the key itself
      return key;

    } catch (error) {
      console.error(`Error reading language file for ${lang}:`, error);
      return key; // Fallback to the key itself if an error occurs
    }
  }

  async t(key: string, params?: Record<string, string>): Promise<string> {
    const lang = this.request['language'] || 'en';
    const filePath = this.getLanguageFilePath(lang);
  
    try {
      if (!fs.existsSync(filePath)) {
        return key;
      }
  
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(rawData);
  
      let translation = this.getNestedValue(translations, key) || translations[key];
  
      if (!translation) return key;
      
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          const regex = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
          translation = translation.replace(regex, paramValue);
        }
      }
  
      return translation;
    } catch (error) {
      console.error(`Error reading language file for ${lang}:`, error);
      return key;
    }
  }
  
}
