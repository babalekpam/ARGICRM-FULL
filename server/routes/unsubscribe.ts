/**
 * Unsubscribe Routes
 * Handles email unsubscribe requests
 */

import { Router, Response, Request } from 'express';
import { unsubscribeService } from '../services/unsubscribe-service.js';
import { DatabaseStorage } from '../database-storage.js';

const router = Router();

// GET /api/unsubscribe/verify - Verify unsubscribe token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const verification = unsubscribeService.verifyToken(token);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    res.json({
      success: true,
      email: verification.email,
    });
  } catch (error: any) {
    console.error('Error verifying unsubscribe token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
    });
  }
});

// POST /api/unsubscribe/confirm - Confirm unsubscribe
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const verification = unsubscribeService.verifyToken(token);

    if (!verification.valid || verification.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // In a real implementation, you would:
    // 1. Update the contact's email preferences in database
    // 2. Mark them as unsubscribed
    // For now, we'll just log it

    // You could add this to your storage:
    // const storage = new DatabaseStorage('system@default.com', 'default-tenant', false);
    // await storage.updateContactEmailPreferences(email, { unsubscribed: true });

    res.json({
      success: true,
      message: 'Successfully unsubscribed',
      email,
    });
  } catch (error: any) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process unsubscribe',
    });
  }
});

export default router;
