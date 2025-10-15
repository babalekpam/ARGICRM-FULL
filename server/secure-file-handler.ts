/**
 * Secure File Handler - Safe file processing for uploads
 * 
 * This module provides secure file handling capabilities to replace
 * the vulnerable xlsx package with safer alternatives.
 */

import { parse as csvParse } from '@fast-csv/parse';
import nodeXlsx from 'node-xlsx';
import fs from 'fs/promises';
import path from 'path';
import { InputSecurity } from './security.js';

interface FileProcessingResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
}

export class SecureFileHandler {
  
  /**
   * Safely process CSV files
   */
  static async processCSV(filePath: string): Promise<FileProcessingResult> {
    try {
      const data: any[] = [];
      const fileBuffer = await fs.readFile(filePath);
      
      return new Promise((resolve, reject) => {
        const stream = csvParse({ headers: true })
          .on('data', (row) => {
            // Sanitize each row to prevent XSS and injection
            const sanitizedRow = InputSecurity.sanitizeObject(row);
            data.push(sanitizedRow);
          })
          .on('end', () => {
            resolve({
              success: true,
              data,
              rowCount: data.length
            });
          })
          .on('error', (error) => {
            reject({
              success: false,
              error: `CSV parsing error: ${error.message}`
            });
          });
        
        stream.write(fileBuffer);
        stream.end();
      });
    } catch (error) {
      return {
        success: false,
        error: `File read error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Safely process Excel files using node-xlsx (safer than xlsx)
   */
  static async processExcel(filePath: string): Promise<FileProcessingResult> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Parse using node-xlsx which is safer than the vulnerable xlsx package
      const workbook = nodeXlsx.parse(fileBuffer);
      
      if (!workbook || workbook.length === 0) {
        return {
          success: false,
          error: 'Excel file is empty or corrupted'
        };
      }
      
      // Process the first worksheet
      const worksheet = workbook[0];
      const rows = worksheet.data;
      
      if (rows.length === 0) {
        return {
          success: false,
          error: 'Excel worksheet is empty'
        };
      }
      
      // Convert to objects using first row as headers
      const headers = rows[0] as string[];
      const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return InputSecurity.sanitizeObject(obj);
      });
      
      return {
        success: true,
        data,
        rowCount: data.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Excel processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Main entry point for secure file processing
   */
  static async processFile(filePath: string, mimeType: string): Promise<FileProcessingResult> {
    try {
      // Verify file exists and is readable
      await fs.access(filePath);
      
      switch (mimeType) {
        case 'text/csv':
          return await this.processCSV(filePath);
          
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return await this.processExcel(filePath);
          
        default:
          return {
            success: false,
            error: `Unsupported file type: ${mimeType}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `File access error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean up temporary files securely
   */
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }
}