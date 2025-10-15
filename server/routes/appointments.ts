import type { Request, Response } from "express";
import { storage } from "../storage.js";
import { InsertAppointment } from "@shared/schema.js";

export async function registerAppointmentsRoutes(app: any) {
  // Appointments API (PostgreSQL storage)
  app.get('/api/appointments', async (req: Request, res: Response) => {
    try {
      const appointments = await storage.getAppointments();
      console.log(`Fetching appointments from database: ${appointments.length}`);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  app.post('/api/appointments', async (req: Request, res: Response) => {
    try {
      // Handle both frontend formats: ISO string or separate date/time
      let startTime, endTime;
      
      if (req.body.startTime) {
        // Frontend sends ISO string
        startTime = new Date(req.body.startTime);
        endTime = new Date(req.body.endTime);
      } else {
        // Frontend sends separate date and time
        const dateTimeString = `${req.body.date}T${req.body.time}:00`;
        startTime = new Date(dateTimeString);
        endTime = new Date(startTime.getTime() + (req.body.duration || 30) * 60000);
      }

      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid date/time values:', { 
          startTime: req.body.startTime || `${req.body.date}T${req.body.time}:00`,
          endTime: req.body.endTime 
        });
        return res.status(400).json({ error: 'Invalid date/time format' });
      }

      const appointmentData = {
        tenantId: 'default-tenant',
        title: req.body.title,
        description: req.body.description || '',
        contactName: req.body.contact || req.body.contactName,
        contactEmail: req.body.contactEmail || '',
        contactPhone: req.body.contactPhone || '',
        startTime,
        endTime,
        duration: req.body.duration || 30,
        type: req.body.type || 'meeting',
        location: req.body.location || '',
        meetingUrl: req.body.meetingUrl || '',
        status: req.body.status || 'scheduled',
        notes: req.body.notes || '',
        createdBy: 'platform-owner-1'
      };
      
      const newAppointment = await storage.createAppointment(appointmentData);
      console.log(`Created new appointment in database: ${newAppointment.title}`);
      res.json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  app.get('/api/appointments/:id', async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  });

  app.put('/api/appointments/:id', async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        contactName: req.body.contact || req.body.contactName,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        startTime: req.body.date && req.body.time ? new Date(req.body.date + ' ' + req.body.time) : undefined,
        endTime: req.body.date && req.body.time && req.body.duration ? 
          new Date(new Date(req.body.date + ' ' + req.body.time).getTime() + req.body.duration * 60000) : undefined,
        duration: req.body.duration,
        type: req.body.type,
        location: req.body.location,
        meetingUrl: req.body.meetingUrl,
        status: req.body.status,
        notes: req.body.notes
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        (updateData as any)[key] === undefined && delete (updateData as any)[key]
      );

      const updatedAppointment = await storage.updateAppointment(appointmentId, updateData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      console.log(`Updated appointment in database: ${updatedAppointment.title}`);
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const deleted = await storage.deleteAppointment(appointmentId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      console.log(`Deleted appointment from database: ${appointmentId}`);
      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  // Initialize database with sample appointments if empty
  async function initializeAppointmentsIfEmpty() {
    try {
      const existingAppointments = await storage.getAppointments();
      if (existingAppointments.length === 0) {
        const sampleAppointments = [
          {
            tenantId: 'default-tenant',
            title: 'Product Demo',
            description: 'Initial product demonstration for potential enterprise client',
            contactName: 'Sarah Johnson',
            contactEmail: 'sarah.johnson@techcorp.com',
            contactPhone: '+1-555-0123',
            startTime: new Date(2025, 5, 26, 10, 0),
            endTime: new Date(2025, 5, 26, 11, 0),
            duration: 60,
            type: 'demo',
            location: 'Zoom Meeting',
            meetingUrl: 'https://zoom.us/j/1234567890',
            status: 'confirmed',
            notes: 'Enterprise client interested in CRM implementation',
            createdBy: 'platform-owner-1'
          },
          {
            tenantId: 'default-tenant',
            title: 'Sales Strategy Call',
            description: 'Discuss Q2 sales targets and strategy',
            contactName: 'Mike Chen',
            contactEmail: 'mike.chen@salesteam.com',
            contactPhone: '+1-555-0124',
            startTime: new Date(2025, 5, 26, 14, 30),
            endTime: new Date(2025, 5, 26, 15, 0),
            duration: 30,
            type: 'call',
            location: 'Phone Call',
            status: 'scheduled',
            notes: 'Internal sales team meeting',
            createdBy: 'platform-owner-1'
          },
          {
            tenantId: 'default-tenant',
            title: 'Customer Consultation',
            description: 'Consultation for CRM implementation and training',
            contactName: 'Emma Davis',
            contactEmail: 'emma.davis@startup.io',
            contactPhone: '+1-555-0125',
            startTime: new Date(2025, 5, 27, 9, 0),
            endTime: new Date(2025, 5, 27, 9, 45),
            duration: 45,
            type: 'consultation',
            location: 'Office Conference Room A',
            status: 'confirmed',
            notes: 'New startup needs CRM setup guidance',
            createdBy: 'platform-owner-1'
          }
        ];

        for (const appointment of sampleAppointments) {
          await storage.createAppointment(appointment);
        }
        console.log('Initialized database with sample appointments');
      }
    } catch (error) {
      console.error('Error initializing sample appointments:', error);
    }
  }

  // Initialize appointments on startup
  initializeAppointmentsIfEmpty();
}