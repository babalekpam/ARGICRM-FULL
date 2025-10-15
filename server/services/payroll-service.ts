import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { db } from "../db";
import {
  payrollProfiles,
  payrollPeriods,
  payrollEntries,
  timeSheets,
  payrollTaxFilings,
  employees,
  type PayrollProfile,
  type PayrollPeriod,
  type PayrollEntry,
  type TimeSheet,
  type PayrollTaxFiling,
  type InsertPayrollProfile,
  type InsertPayrollPeriod,
  type InsertPayrollEntry,
  type InsertTimeSheet,
  type InsertPayrollTaxFiling,
} from "@shared/schema";

export interface PayrollCalculation {
  employeeId: string;
  payrollPeriodId: string;
  basePay: number;
  overtimePay: number;
  bonusPay: number;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  totalTaxes: number;
  healthInsurance: number;
  retirement401k: number;
  totalDeductions: number;
  netPay: number;
  ytdGrossPay: number;
  ytdNetPay: number;
  ytdTaxes: number;
  ytdDeductions: number;
}

export interface PayrollSummary {
  periodId: string;
  periodName: string;
  payDate: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxes: number;
  totalDeductions: number;
  status: string;
}

export interface TimeSheetSummary {
  employeeId: string;
  employeeName: string;
  regularHours: number;
  overtimeHours: number;
  vacationHours: number;
  sickHours: number;
  totalHours: number;
  status: string;
}

export interface TaxFilingSummary {
  filingType: string;
  taxYear: number;
  quarter?: number;
  dueDate: string;
  totalWages: number;
  totalFederalTax: number;
  totalStateTax: number;
  totalSocialSecurity: number;
  totalMedicare: number;
  status: string;
}

export class PayrollService {
  private static instance: PayrollService;

  static getInstance(): PayrollService {
    if (!PayrollService.instance) {
      PayrollService.instance = new PayrollService();
    }
    return PayrollService.instance;
  }

  // Payroll Profile Management
  async createPayrollProfile(data: InsertPayrollProfile): Promise<PayrollProfile> {
    const [profile] = await db.insert(payrollProfiles).values(data).returning();
    return profile;
  }

  async getPayrollProfiles(tenantId: string): Promise<PayrollProfile[]> {
    return await db
      .select()
      .from(payrollProfiles)
      .where(eq(payrollProfiles.tenantId, tenantId))
      .orderBy(asc(payrollProfiles.createdAt));
  }

  async getPayrollProfileByEmployee(tenantId: string, employeeId: string): Promise<PayrollProfile | null> {
    const [profile] = await db
      .select()
      .from(payrollProfiles)
      .where(
        and(
          eq(payrollProfiles.tenantId, tenantId),
          eq(payrollProfiles.employeeId, employeeId),
          eq(payrollProfiles.isActive, true)
        )
      );
    return profile || null;
  }

  async updatePayrollProfile(id: string, tenantId: string, data: Partial<PayrollProfile>): Promise<PayrollProfile> {
    const [profile] = await db
      .update(payrollProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(payrollProfiles.id, id), eq(payrollProfiles.tenantId, tenantId)))
      .returning();
    return profile;
  }

  // Payroll Period Management
  async createPayrollPeriod(data: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const [period] = await db.insert(payrollPeriods).values(data).returning();
    return period;
  }

  async getPayrollPeriods(tenantId: string): Promise<PayrollPeriod[]> {
    return await db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.tenantId, tenantId))
      .orderBy(desc(payrollPeriods.startDate));
  }

  async getCurrentPayrollPeriod(tenantId: string): Promise<PayrollPeriod | null> {
    const currentDate = new Date();
    const [period] = await db
      .select()
      .from(payrollPeriods)
      .where(
        and(
          eq(payrollPeriods.tenantId, tenantId),
          lte(payrollPeriods.startDate, currentDate.toISOString().split('T')[0]),
          gte(payrollPeriods.endDate, currentDate.toISOString().split('T')[0])
        )
      );
    return period || null;
  }

  // Time Sheet Management
  async createTimeSheet(data: InsertTimeSheet): Promise<TimeSheet> {
    const [timeSheet] = await db.insert(timeSheets).values(data).returning();
    return timeSheet;
  }

  async getTimeSheets(tenantId: string, employeeId?: string, payrollPeriodId?: string): Promise<TimeSheet[]> {
    let query = db.select().from(timeSheets).where(eq(timeSheets.tenantId, tenantId));

    if (employeeId) {
      query = query.where(eq(timeSheets.employeeId, employeeId));
    }

    if (payrollPeriodId) {
      query = query.where(eq(timeSheets.payrollPeriodId, payrollPeriodId));
    }

    return await query.orderBy(desc(timeSheets.workDate));
  }

  async getTimeSheetSummary(tenantId: string, payrollPeriodId: string): Promise<TimeSheetSummary[]> {
    const result = await db
      .select({
        employeeId: timeSheets.employeeId,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        regularHours: sql<number>`SUM(${timeSheets.regularHours})`,
        overtimeHours: sql<number>`SUM(${timeSheets.overtimeHours})`,
        vacationHours: sql<number>`SUM(${timeSheets.vacationHours})`,
        sickHours: sql<number>`SUM(${timeSheets.sickHours})`,
        totalHours: sql<number>`SUM(${timeSheets.regularHours} + ${timeSheets.overtimeHours} + ${timeSheets.vacationHours} + ${timeSheets.sickHours})`,
        status: timeSheets.status,
      })
      .from(timeSheets)
      .leftJoin(employees, eq(timeSheets.employeeId, employees.id))
      .where(
        and(
          eq(timeSheets.tenantId, tenantId),
          eq(timeSheets.payrollPeriodId, payrollPeriodId)
        )
      )
      .groupBy(timeSheets.employeeId, employees.firstName, employees.lastName, timeSheets.status);

    return result.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName || 'Unknown Employee',
      regularHours: Number(row.regularHours) || 0,
      overtimeHours: Number(row.overtimeHours) || 0,
      vacationHours: Number(row.vacationHours) || 0,
      sickHours: Number(row.sickHours) || 0,
      totalHours: Number(row.totalHours) || 0,
      status: row.status || 'pending',
    }));
  }

  // Payroll Calculation
  async calculatePayroll(tenantId: string, payrollPeriodId: string, employeeId: string): Promise<PayrollCalculation> {
    // Get payroll profile
    const profile = await this.getPayrollProfileByEmployee(tenantId, employeeId);
    if (!profile) {
      throw new Error(`No payroll profile found for employee ${employeeId}`);
    }

    // Get time sheets for the period
    const timeSheetData = await this.getTimeSheets(tenantId, employeeId, payrollPeriodId);
    
    // Calculate total hours
    const totalRegularHours = timeSheetData.reduce((sum, ts) => sum + Number(ts.regularHours), 0);
    const totalOvertimeHours = timeSheetData.reduce((sum, ts) => sum + Number(ts.overtimeHours), 0);
    
    // Calculate base pay
    let basePay = 0;
    if (profile.payType === 'salary') {
      // For salary, calculate based on pay frequency
      basePay = Number(profile.baseSalary);
      if (profile.payFrequency === 'monthly') {
        basePay = basePay / 12; // Monthly salary
      } else if (profile.payFrequency === 'bi-weekly') {
        basePay = basePay / 26; // Bi-weekly salary
      } else if (profile.payFrequency === 'weekly') {
        basePay = basePay / 52; // Weekly salary
      }
    } else if (profile.payType === 'hourly') {
      basePay = totalRegularHours * Number(profile.hourlyRate);
    }

    // Calculate overtime pay (1.5x regular rate)
    const overtimeRate = Number(profile.hourlyRate) * 1.5;
    const overtimePay = totalOvertimeHours * overtimeRate;

    // Calculate gross pay
    const grossPay = basePay + overtimePay;

    // Calculate taxes
    const taxSettings = profile.taxSettings as any || {};
    const federalTax = grossPay * (taxSettings.federalTaxRate || 0.22);
    const stateTax = grossPay * (taxSettings.stateTaxRate || 0.05);
    const socialSecurity = grossPay * (taxSettings.socialSecurityRate || 0.062);
    const medicare = grossPay * (taxSettings.medicareRate || 0.0145);
    const totalTaxes = federalTax + stateTax + socialSecurity + medicare;

    // Calculate deductions
    const benefits = profile.benefits as any || {};
    const healthInsurance = benefits.healthInsurance?.amount || 0;
    const retirement401k = benefits.retirement401k?.amount || 0;
    const totalDeductions = healthInsurance + retirement401k;

    // Calculate net pay
    const netPay = grossPay - totalTaxes - totalDeductions;

    // Calculate YTD totals (simplified - in reality, would sum previous payroll entries)
    const ytdGrossPay = grossPay;
    const ytdNetPay = netPay;
    const ytdTaxes = totalTaxes;
    const ytdDeductions = totalDeductions;

    return {
      employeeId,
      payrollPeriodId,
      basePay,
      overtimePay,
      bonusPay: 0, // Could be added later
      grossPay,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      totalTaxes,
      healthInsurance,
      retirement401k,
      totalDeductions,
      netPay,
      ytdGrossPay,
      ytdNetPay,
      ytdTaxes,
      ytdDeductions,
    };
  }

  // Payroll Entry Management
  async createPayrollEntry(calculation: PayrollCalculation, createdBy: string): Promise<PayrollEntry> {
    const entryData: InsertPayrollEntry = {
      tenantId: 'placeholder', // Will be set by caller
      payrollPeriodId: calculation.payrollPeriodId,
      employeeId: calculation.employeeId,
      payrollProfileId: 'placeholder', // Will be set by caller
      basePay: calculation.basePay.toString(),
      overtimePay: calculation.overtimePay.toString(),
      bonusPay: calculation.bonusPay.toString(),
      grossPay: calculation.grossPay.toString(),
      federalTax: calculation.federalTax.toString(),
      stateTax: calculation.stateTax.toString(),
      socialSecurity: calculation.socialSecurity.toString(),
      medicare: calculation.medicare.toString(),
      totalTaxes: calculation.totalTaxes.toString(),
      healthInsurance: calculation.healthInsurance.toString(),
      retirement401k: calculation.retirement401k.toString(),
      totalDeductions: calculation.totalDeductions.toString(),
      netPay: calculation.netPay.toString(),
      ytdGrossPay: calculation.ytdGrossPay.toString(),
      ytdNetPay: calculation.ytdNetPay.toString(),
      ytdTaxes: calculation.ytdTaxes.toString(),
      ytdDeductions: calculation.ytdDeductions.toString(),
      createdBy,
    };

    const [entry] = await db.insert(payrollEntries).values(entryData).returning();
    return entry;
  }

  async getPayrollEntries(tenantId: string, payrollPeriodId?: string): Promise<PayrollEntry[]> {
    let query = db.select().from(payrollEntries).where(eq(payrollEntries.tenantId, tenantId));

    if (payrollPeriodId) {
      query = query.where(eq(payrollEntries.payrollPeriodId, payrollPeriodId));
    }

    return await query.orderBy(desc(payrollEntries.createdAt));
  }

  // Payroll Processing
  async processPayrollPeriod(tenantId: string, payrollPeriodId: string, processedBy: string): Promise<PayrollSummary> {
    // Get all active employees with payroll profiles
    const profiles = await this.getPayrollProfiles(tenantId);
    const activeProfiles = profiles.filter(p => p.isActive);

    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTaxes = 0;
    let totalDeductions = 0;

    // Process each employee
    for (const profile of activeProfiles) {
      try {
        const calculation = await this.calculatePayroll(tenantId, payrollPeriodId, profile.employeeId);
        
        // Create payroll entry
        const entryData = {
          ...calculation,
          tenantId,
          payrollProfileId: profile.id,
        };
        
        await this.createPayrollEntry(calculation, processedBy);

        // Add to totals
        totalGrossPay += calculation.grossPay;
        totalNetPay += calculation.netPay;
        totalTaxes += calculation.totalTaxes;
        totalDeductions += calculation.totalDeductions;
      } catch (error) {
        console.error(`Error processing payroll for employee ${profile.employeeId}:`, error);
      }
    }

    // Update payroll period with totals
    const [updatedPeriod] = await db
      .update(payrollPeriods)
      .set({
        totalGrossPay: totalGrossPay.toString(),
        totalNetPay: totalNetPay.toString(),
        totalTaxes: totalTaxes.toString(),
        totalDeductions: totalDeductions.toString(),
        employeeCount: activeProfiles.length,
        status: 'completed',
        processedBy,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(payrollPeriods.id, payrollPeriodId), eq(payrollPeriods.tenantId, tenantId)))
      .returning();

    return {
      periodId: updatedPeriod.id,
      periodName: updatedPeriod.periodName,
      payDate: updatedPeriod.payDate,
      totalEmployees: activeProfiles.length,
      totalGrossPay,
      totalNetPay,
      totalTaxes,
      totalDeductions,
      status: updatedPeriod.status,
    };
  }

  // Tax Filing Management
  async createTaxFiling(data: InsertPayrollTaxFiling): Promise<PayrollTaxFiling> {
    const [filing] = await db.insert(payrollTaxFilings).values(data).returning();
    return filing;
  }

  async getTaxFilings(tenantId: string, taxYear?: number): Promise<PayrollTaxFiling[]> {
    let query = db.select().from(payrollTaxFilings).where(eq(payrollTaxFilings.tenantId, tenantId));

    if (taxYear) {
      query = query.where(eq(payrollTaxFilings.taxYear, taxYear));
    }

    return await query.orderBy(desc(payrollTaxFilings.dueDate));
  }

  async getUpcomingTaxFilings(tenantId: string, days: number = 30): Promise<TaxFilingSummary[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const filings = await db
      .select()
      .from(payrollTaxFilings)
      .where(
        and(
          eq(payrollTaxFilings.tenantId, tenantId),
          lte(payrollTaxFilings.dueDate, futureDate.toISOString().split('T')[0]),
          eq(payrollTaxFilings.status, 'pending')
        )
      )
      .orderBy(asc(payrollTaxFilings.dueDate));

    return filings.map(filing => ({
      filingType: filing.filingType,
      taxYear: filing.taxYear,
      quarter: filing.quarter || undefined,
      dueDate: filing.dueDate,
      totalWages: Number(filing.totalWages),
      totalFederalTax: Number(filing.totalFederalTax),
      totalStateTax: Number(filing.totalStateTax),
      totalSocialSecurity: Number(filing.totalSocialSecurity),
      totalMedicare: Number(filing.totalMedicare),
      status: filing.status,
    }));
  }

  // Reporting
  async getPayrollSummary(tenantId: string, startDate: string, endDate: string): Promise<PayrollSummary[]> {
    const periods = await db
      .select()
      .from(payrollPeriods)
      .where(
        and(
          eq(payrollPeriods.tenantId, tenantId),
          gte(payrollPeriods.startDate, startDate),
          lte(payrollPeriods.endDate, endDate)
        )
      )
      .orderBy(desc(payrollPeriods.startDate));

    return periods.map(period => ({
      periodId: period.id,
      periodName: period.periodName,
      payDate: period.payDate,
      totalEmployees: period.employeeCount,
      totalGrossPay: Number(period.totalGrossPay),
      totalNetPay: Number(period.totalNetPay),
      totalTaxes: Number(period.totalTaxes),
      totalDeductions: Number(period.totalDeductions),
      status: period.status,
    }));
  }

  // Dashboard metrics
  async getPayrollMetrics(tenantId: string): Promise<{
    totalEmployees: number;
    currentPeriodGrossPay: number;
    upcomingPayDate: string | null;
    pendingTaxFilings: number;
    ytdTotalWages: number;
    ytdTotalTaxes: number;
  }> {
    // Get total active employees
    const activeProfiles = await db
      .select()
      .from(payrollProfiles)
      .where(and(eq(payrollProfiles.tenantId, tenantId), eq(payrollProfiles.isActive, true)));

    // Get current period
    const currentPeriod = await this.getCurrentPayrollPeriod(tenantId);
    
    // Get pending tax filings
    const pendingFilings = await db
      .select()
      .from(payrollTaxFilings)
      .where(and(eq(payrollTaxFilings.tenantId, tenantId), eq(payrollTaxFilings.status, 'pending')));

    // Get YTD totals (simplified calculation)
    const currentYear = new Date().getFullYear();
    const ytdPeriods = await db
      .select()
      .from(payrollPeriods)
      .where(
        and(
          eq(payrollPeriods.tenantId, tenantId),
          gte(payrollPeriods.startDate, `${currentYear}-01-01`)
        )
      );

    const ytdTotalWages = ytdPeriods.reduce((sum, period) => sum + Number(period.totalGrossPay), 0);
    const ytdTotalTaxes = ytdPeriods.reduce((sum, period) => sum + Number(period.totalTaxes), 0);

    return {
      totalEmployees: activeProfiles.length,
      currentPeriodGrossPay: currentPeriod ? Number(currentPeriod.totalGrossPay) : 0,
      upcomingPayDate: currentPeriod?.payDate || null,
      pendingTaxFilings: pendingFilings.length,
      ytdTotalWages,
      ytdTotalTaxes,
    };
  }
}

export const payrollService = PayrollService.getInstance();