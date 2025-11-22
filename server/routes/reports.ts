import type { Request, Response } from "express";
import { storage } from "../storage.js";
import { insertReportSchema } from "@shared/schema.js";

export async function registerReportsRoutes(app: any) {
  // Reports API (PostgreSQL storage)
  app.get('/api/reports', async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.post('/api/reports', async (req: Request, res: Response) => {
    try {
      const reportData = {
        name: req.body.name,
        description: req.body.description || '',
        reportType: req.body.reportType,
        status: req.body.status || 'draft',
        config: {
          dateRange: req.body.dateRange || 'last_30_days',
          accounts: req.body.accounts || [],
          includeMetrics: req.body.includeMetrics || {},
          filters: req.body.filters || {}
        },
        data: [],
        lastRun: new Date(),
        tenantId: 'default-tenant',
        createdBy: 'platform-owner-1'
      };
      
      const newReport = await storage.createReport(reportData);
      res.json(newReport);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  });

  app.get('/api/reports/:id/data', async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Return existing data or generate sample data based on report type
      let reportData = report.data || [];
      
      if (reportData.length === 0) {
        // Generate sample data based on report type
        switch (report.reportType) {
          case 'sales':
            reportData = [
              { period: 'Q1 2024', revenue: 125000, deals: 45, conversion: '23%' },
              { period: 'Q2 2024', revenue: 138000, deals: 52, conversion: '28%' },
              { period: 'Q3 2024', revenue: 142000, deals: 48, conversion: '25%' },
              { period: 'Q4 2024', revenue: 156000, deals: 58, conversion: '31%' }
            ];
            break;
          case 'customer':
            reportData = [
              { segment: 'Enterprise', count: 45, value: 850000, satisfaction: '4.2/5' },
              { segment: 'SMB', count: 128, value: 420000, satisfaction: '3.8/5' },
              { segment: 'Startup', count: 89, value: 180000, satisfaction: '4.1/5' }
            ];
            break;
          default:
            reportData = [
              { metric: 'Total Revenue', value: '$561,000', change: '+12%' },
              { metric: 'New Customers', value: '262', change: '+18%' },
              { metric: 'Deals Closed', value: '203', change: '+15%' }
            ];
        }
        
        // Update report with generated data
        await storage.updateReport(reportId, { 
          data: reportData, 
          status: 'completed',
          lastRun: new Date()
        });
      }
      
      res.json(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      res.status(500).json({ error: 'Failed to fetch report data' });
    }
  });

  app.get('/api/reports/:id/export', async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const format = req.query.format as string || 'csv';
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Get report data
      const reportData = report.data || [];
      
      // Generate CSV content
      let csvContent = `Report Name,${report.name}\nType,${report.reportType}\nStatus,${report.status}\nCreated,${report.createdAt}\nLast Run,${report.lastRun}\n\n`;
      
      if (reportData.length > 0) {
        // Add headers
        const headers = Object.keys(reportData[0]);
        csvContent += headers.join(',') + '\n';
        
        // Add data rows
        reportData.forEach(row => {
          const values = headers.map(header => row[header]);
          csvContent += values.join(',') + '\n';
        });
      } else {
        csvContent += 'No data available\n';
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });

  app.post('/api/reports/import', async (req: Request, res: Response) => {
    try {
      res.json({ message: 'Report import feature coming soon' });
    } catch (error) {
      console.error('Error importing report:', error);
      res.status(500).json({ error: 'Failed to import report' });
    }
  });

  // Initialize database with empty reports
  async function initializeReportsIfEmpty() {
    try {
      const existingReports = await storage.getReports();
    } catch (error) {
      console.error('Error checking reports storage:', error);
    }
  }

  // Initialize reports on startup - disabled to prevent UUID conflicts
  // initializeReportsIfEmpty();
}