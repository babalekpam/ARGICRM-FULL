import type { Request, Response } from "express";
import { storage } from "../storage.js";

export async function registerEnhancedReportsRoutes(app: any) {
  // Generate report data endpoint
  app.post('/api/reports/:id/generate', async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Generate sample data based on report type
      let reportData;
      
      switch (report.reportType) {
        case 'sales':
          reportData = await generateSalesReport();
          break;
        case 'leads':
          reportData = await generateLeadsReport();
          break;
        case 'contacts':
          reportData = await generateContactsReport();
          break;
        case 'pipeline':
          reportData = await generatePipelineReport();
          break;
        case 'revenue':
          reportData = await generateRevenueReport();
          break;
        case 'activity':
          reportData = await generateActivityReport();
          break;
        default:
          reportData = await generateDefaultReport();
      }

      // Update report last run time
      await storage.updateReport(reportId, { 
        lastRun: new Date().toISOString(),
        status: 'active'
      });

      res.json(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Export report data endpoint
  app.get('/api/reports/:id/export', async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const format = req.query.format || 'csv';
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Generate CSV export
      const reportData = await generateReportDataForExport(report.reportType);
      const csv = convertToCSV(reportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });
}

// Report generation functions
async function generateSalesReport() {
  const deals = await storage.getDeals();
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + parseFloat(deal.amount || '0'), 0);
  
  const statusBreakdown = deals.reduce((acc, deal) => {
    acc[deal.stage || 'Unknown'] = (acc[deal.stage || 'Unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(statusBreakdown),
    values: Object.values(statusBreakdown),
    totalRecords: totalDeals,
    summary: {
      total: totalValue,
      growth: Math.floor(Math.random() * 20) + 5, // Simulated growth
      trend: totalValue > 50000 ? 'up' : 'stable'
    }
  };
}

async function generateLeadsReport() {
  const leads = await storage.getLeads();
  const totalLeads = leads.length;
  
  const sourceBreakdown = leads.reduce((acc, lead) => {
    acc[lead.source || 'Unknown'] = (acc[lead.source || 'Unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(sourceBreakdown),
    values: Object.values(sourceBreakdown),
    totalRecords: totalLeads,
    summary: {
      total: totalLeads,
      growth: Math.floor(Math.random() * 15) + 2,
      trend: totalLeads > 20 ? 'up' : 'stable'
    }
  };
}

async function generateContactsReport() {
  const contacts = await storage.getContacts();
  const totalContacts = contacts.length;
  
  const statusBreakdown = contacts.reduce((acc, contact) => {
    acc[contact.status || 'Active'] = (acc[contact.status || 'Active'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(statusBreakdown),
    values: Object.values(statusBreakdown),
    totalRecords: totalContacts,
    summary: {
      total: totalContacts,
      growth: Math.floor(Math.random() * 10) + 1,
      trend: 'up'
    }
  };
}

async function generatePipelineReport() {
  const deals = await storage.getDeals();
  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  
  const stageBreakdown = stages.map(stage => {
    return deals.filter(deal => deal.stage === stage).length;
  });

  return {
    labels: stages,
    values: stageBreakdown,
    totalRecords: deals.length,
    summary: {
      total: deals.length,
      growth: Math.floor(Math.random() * 12) + 3,
      trend: 'up'
    }
  };
}

async function generateRevenueReport() {
  const deals = await storage.getDeals();
  const wonDeals = deals.filter(deal => deal.stage === 'Closed Won');
  const totalRevenue = wonDeals.reduce((sum, deal) => sum + parseFloat(deal.amount || '0'), 0);
  
  const monthlyRevenue = wonDeals.reduce((acc, deal) => {
    const month = new Date(deal.createdAt || new Date()).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + parseFloat(deal.amount || '0');
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(monthlyRevenue),
    values: Object.values(monthlyRevenue),
    totalRecords: wonDeals.length,
    summary: {
      total: totalRevenue,
      growth: Math.floor(Math.random() * 25) + 8,
      trend: totalRevenue > 100000 ? 'up' : 'stable'
    }
  };
}

async function generateActivityReport() {
  const tasks = await storage.getTasks();
  const totalTasks = tasks.length;
  
  const priorityBreakdown = tasks.reduce((acc, task) => {
    acc[task.priority || 'Medium'] = (acc[task.priority || 'Medium'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(priorityBreakdown),
    values: Object.values(priorityBreakdown),
    totalRecords: totalTasks,
    summary: {
      total: totalTasks,
      growth: Math.floor(Math.random() * 8) + 2,
      trend: 'stable'
    }
  };
}

async function generateDefaultReport() {
  return {
    labels: ['Category A', 'Category B', 'Category C'],
    values: [45, 30, 25],
    totalRecords: 100,
    summary: {
      total: 100,
      growth: 5,
      trend: 'stable' as const
    }
  };
}

async function generateReportDataForExport(reportType: string) {
  // Generate detailed data for CSV export
  switch (reportType) {
    case 'sales':
      const deals = await storage.getDeals();
      return deals.map(deal => ({
        'Deal Name': deal.name,
        'Amount': deal.amount || '0',
        'Stage': deal.stage || 'Unknown',
        'Account': deal.accountId || 'N/A',
        'Created Date': deal.createdAt || new Date().toISOString()
      }));
    
    case 'leads':
      const leads = await storage.getLeads();
      return leads.map(lead => ({
        'Lead Name': lead.name,
        'Email': lead.email,
        'Company': lead.company || 'N/A',
        'Source': lead.source || 'Unknown',
        'Status': lead.status || 'New',
        'Created Date': lead.createdAt || new Date().toISOString()
      }));
    
    case 'contacts':
      const contacts = await storage.getContacts();
      return contacts.map(contact => ({
        'Contact Name': contact.name,
        'Email': contact.email,
        'Company': contact.company || 'N/A',
        'Status': contact.status || 'Active',
        'Created Date': contact.createdAt || new Date().toISOString()
      }));
    
    default:
      return [
        { 'Category': 'Sample A', 'Value': 100, 'Date': new Date().toISOString() },
        { 'Category': 'Sample B', 'Value': 200, 'Date': new Date().toISOString() }
      ];
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        `"${String(row[header]).replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}