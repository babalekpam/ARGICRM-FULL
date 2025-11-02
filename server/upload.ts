import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { storage } from './storage.js';
import type { InsertContact } from '@shared/schema';
import { DatabaseStorage } from './database-storage.js';
import { SecureFileHandler } from './secure-file-handler.js';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB field size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  bio?: string;
  linkedin?: string;
  companyWebsite?: string;
  numberOfEmployees?: string;
  leadSource?: string;
  status?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  duplicates: number;
}

// Field mapping for flexible column names
const fieldMappings: Record<string, string[]> = {
  name: ['name', 'full name', 'fullname', 'contact name', 'first name', 'firstname'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  phone: ['phone', 'phone number', 'telephone', 'mobile', 'cell'],
  company: ['company', 'organization', 'business', 'firm', 'corp'],
  jobTitle: ['job title', 'title', 'position', 'role', 'designation'],
  location: ['location', 'address', 'city', 'region', 'area'],
  bio: ['bio', 'biography', 'description', 'about', 'notes', 'summary'],
  linkedin: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin link'],
  companyWebsite: ['company website', 'website', 'company url', 'web', 'site'],
  numberOfEmployees: ['number of employees', 'employees', 'employee count', 'staff count', 'team size'],
  leadSource: ['lead source', 'source', 'origin', 'channel'],
  status: ['status', 'lead status', 'contact status']
};

// Normalize field names to match our schema
function normalizeFieldName(header: string): string | null {
  const normalized = header.toLowerCase().trim();
  
  for (const [field, variations] of Object.entries(fieldMappings)) {
    if (variations.includes(normalized)) {
      return field;
    }
  }
  
  return null;
}

// Parse CSV file
async function parseCSV(filePath: string): Promise<ParsedContact[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedContact[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const contact: ParsedContact = {};
        
        // Map headers to our fields
        Object.keys(row).forEach(header => {
          const field = normalizeFieldName(header);
          if (field && row[header]?.trim()) {
            (contact as any)[field] = row[header].trim();
          }
        });
        
        // Only add if has at least name or email
        if (contact.name || contact.email) {
          results.push(contact);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Parse Excel file
function parseExcel(filePath: string): ParsedContact[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  
  if (jsonData.length < 2) {
    throw new Error('Excel file must have at least a header row and one data row');
  }
  
  const headers = jsonData[0];
  const results: ParsedContact[] = [];
  
  // Process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    const contact: ParsedContact = {};
    
    headers.forEach((header, index) => {
      if (row[index]) {
        const field = normalizeFieldName(header);
        if (field) {
          (contact as any)[field] = String(row[index]).trim();
        }
      }
    });
    
    // Only add if has at least name or email
    if (contact.name || contact.email) {
      results.push(contact);
    }
  }
  
  return results;
}

// Validate and clean contact data
function validateContact(contact: ParsedContact): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Must have either name or email
  if (!contact.name && !contact.email) {
    errors.push('Contact must have either name or email');
  }
  
  // Validate email format if provided
  if (contact.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      errors.push(`Invalid email format: ${contact.email}`);
    }
  }
  
  // Generate name from email if missing
  if (!contact.name && contact.email) {
    contact.name = contact.email.split('@')[0];
  }
  
  return { valid: errors.length === 0, errors };
}

// Check for duplicate emails
async function checkDuplicate(email: string): Promise<boolean> {
  if (!email) return false;
  
  const contacts = await storage.getContacts();
  return contacts.some(c => c.email.toLowerCase() === email.toLowerCase());
}

// Main import function
export async function importContacts(filePath: string, fileType: string): Promise<ImportResult> {
  let parsedContacts: ParsedContact[] = [];
  
  try {
    // Parse file based on type
    if (fileType === 'csv') {
      parsedContacts = await parseCSV(filePath);
    } else if (fileType === 'excel') {
      parsedContacts = parseExcel(filePath);
    } else {
      throw new Error('Unsupported file type');
    }
    
    let imported = 0;
    let failed = 0;
    let duplicates = 0;
    const errors: string[] = [];
    
    // Process each contact
    for (const [index, contact] of parsedContacts.entries()) {
      try {
        // Validate contact
        const validation = validateContact(contact);
        if (!validation.valid) {
          failed++;
          errors.push(`Row ${index + 2}: ${validation.errors.join(', ')}`);
          continue;
        }
        
        // Check for duplicates
        if (contact.email && await checkDuplicate(contact.email)) {
          duplicates++;
          continue;
        }
        
        // Create contact
        const insertContact: InsertContact = {
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || null,
          company: contact.company || null,
          jobTitle: contact.jobTitle || null,
          location: contact.location || null,
          bio: contact.bio || null,
          linkedin: contact.linkedin || null,
          companyWebsite: contact.companyWebsite || null,
          numberOfEmployees: contact.numberOfEmployees || null,
          leadSource: contact.leadSource || null,
          status: contact.status || 'active'
        };
        
        await storage.createContact(insertContact);
        imported++;
        
      } catch (error: any) {
        failed++;
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      imported,
      failed,
      duplicates,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    };
    
  } catch (error: any) {
    return {
      success: false,
      imported: 0,
      failed: parsedContacts.length,
      duplicates: 0,
      errors: [error.message]
    };
  } finally {
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

// Parse file for preview without saving to database
export async function parseFileForPreview(filePath: string, fileType: string, userStorage?: DatabaseStorage) {
  let parsedContacts: ParsedContact[] = [];
  
  try {
    // Parse file based on type
    if (fileType === 'csv') {
      parsedContacts = await parseCSV(filePath);
    } else if (fileType === 'excel') {
      parsedContacts = parseExcel(filePath);
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Process and validate each contact for preview
    const preview = parsedContacts.map((contact, index) => {
      const validation = validateContact(contact);
      
      return {
        rowNumber: index + 2, // Account for header row
        originalData: contact,
        mappedData: {
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          jobTitle: contact.jobTitle || '',
          location: contact.location || '',
          bio: contact.bio || '',
          linkedin: contact.linkedin || '',
          companyWebsite: contact.companyWebsite || '',
          numberOfEmployees: contact.numberOfEmployees || '',
          leadSource: contact.leadSource || '',
          status: contact.status || 'active'
        },
        isValid: validation.valid,
        errors: validation.errors,
        isDuplicate: false // Will be checked in real-time
      };
    });
    
    // Check for duplicates within the file
    const emailMap = new Map();
    preview.forEach((item, index) => {
      if (item.mappedData.email) {
        const email = item.mappedData.email.toLowerCase();
        if (emailMap.has(email)) {
          preview[index].isDuplicate = true;
          preview[emailMap.get(email)].isDuplicate = true;
        } else {
          emailMap.set(email, index);
        }
      }
    });
    
    // Check against existing contacts
    const existingContacts = userStorage ? await userStorage.getContacts() : await storage.getContacts();
    const existingEmails = new Set(existingContacts.map(c => c.email.toLowerCase()));
    
    preview.forEach(item => {
      if (item.mappedData.email && existingEmails.has(item.mappedData.email.toLowerCase())) {
        item.isDuplicate = true;
      }
    });
    
    const stats = {
      total: preview.length,
      valid: preview.filter(p => p.isValid && !p.isDuplicate).length,
      invalid: preview.filter(p => !p.isValid).length,
      duplicates: preview.filter(p => p.isDuplicate).length
    };
    
    return {
      success: true,
      preview,
      stats,
      fieldMappings: Object.keys(fieldMappings)
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      preview: [],
      stats: { total: 0, valid: 0, invalid: 0, duplicates: 0 }
    };
  } finally {
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error cleaning up preview file:', error);
    }
  }
}

// Process validated contacts from preview
export async function processValidatedContacts(validatedContacts: any[]): Promise<ImportResult> {
  let imported = 0;
  let failed = 0;
  let duplicates = 0;
  const errors: string[] = [];
  
  try {
    for (const [index, contactData] of validatedContacts.entries()) {
      try {
        // Skip if marked as invalid or duplicate
        if (!contactData.isValid || contactData.isDuplicate) {
          if (contactData.isDuplicate) {
            duplicates++;
          } else {
            failed++;
            errors.push(`Row ${contactData.rowNumber}: ${contactData.errors?.join(', ') || 'Invalid data'}`);
          }
          continue;
        }
        
        // Create contact with mapped data
        const insertContact: InsertContact = {
          name: contactData.mappedData.name || '',
          email: contactData.mappedData.email || '',
          phone: contactData.mappedData.phone || null,
          company: contactData.mappedData.company || null,
          jobTitle: contactData.mappedData.jobTitle || null,
          location: contactData.mappedData.location || null,
          bio: contactData.mappedData.bio || null,
          linkedin: contactData.mappedData.linkedin || null,
          companyWebsite: contactData.mappedData.companyWebsite || null,
          numberOfEmployees: contactData.mappedData.numberOfEmployees || null,
          leadSource: contactData.mappedData.leadSource || null,
          status: contactData.mappedData.status || 'active'
        };
        
        await storage.createContact(insertContact);
        imported++;
        
      } catch (error: any) {
        failed++;
        errors.push(`Row ${contactData.rowNumber}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      imported,
      failed,
      duplicates,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    };
    
  } catch (error: any) {
    return {
      success: false,
      imported,
      failed: validatedContacts.length - imported,
      duplicates,
      errors: [error.message]
    };
  }
}

export { upload };