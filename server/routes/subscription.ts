import type { Express } from "express";
import { subscriptionService } from "../subscription-service";

export function registerSubscriptionRoutes(app: Express) {
  // Get all subscription plans
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await subscriptionService.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get user's subscription with plan details
  app.get("/api/subscription/user/details", async (req, res) => {
    try {
      // For demo purposes, use a static user ID
      const userId = "demo-user-123";
      const details = await subscriptionService.getUserSubscriptionDetails(userId);
      res.json(details);
    } catch (error) {
      console.error("Error fetching user subscription details:", error);
      res.status(500).json({ message: "Failed to fetch subscription details" });
    }
  });

  // Change subscription plan
  app.patch("/api/subscription/change-plan", async (req, res) => {
    try {
      const { newPlanId } = req.body;
      if (!newPlanId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      // For demo purposes, use a static user ID
      const userId = "demo-user-123";
      const success = await subscriptionService.changePlan(userId, newPlanId);
      
      if (success) {
        res.json({ success: true, message: "Plan changed successfully" });
      } else {
        res.status(400).json({ message: "Failed to change plan" });
      }
    } catch (error) {
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ message: "Failed to change plan" });
    }
  });
}