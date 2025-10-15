import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { 
  insertEcommerceProductSchema as insertProductSchema, 
  insertEcommerceOrderSchema as insertOrderSchema,
  insertStoreSchema,
  insertCustomerSchema,
  type EcommerceProduct as Product,
  type Store,
  type EcommerceOrder as Order,
  type Customer
} from "../../shared/schema";

const router = Router();

// Store Routes
router.get("/stores", async (req, res) => {
  console.log("GET /stores hit successfully!");
  try {
    const stores = await storage.getAllStores();
    console.log("Stores fetched:", stores.length);
    res.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

router.post("/stores", async (req, res) => {
  console.log("POST /stores hit - body:", req.body);
  console.log("Headers:", req.headers);
  
  try {
    // Get user info from headers (set by getUserStorage helper)
    const userEmail = req.headers['x-user-email'] || req.headers['x-auth-email'] || 'demo@nodecrm.com';
    
    // Ensure required fields are present
    const storeData = {
      ...req.body,
      userId: req.body.userId || userEmail,
      tenantId: req.body.tenantId || '00000000-0000-0000-0000-000000000001'
    };
    
    console.log("Enhanced store data:", storeData);
    const parsedData = insertStoreSchema.parse(storeData);
    console.log("Parsed store data:", parsedData);
    
    const store = await storage.createStore(parsedData);
    console.log("Created store:", store);
    res.status(201).json(store);
  } catch (error) {
    console.error("Error in store creation:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid store data", details: error.errors });
    }
    console.error("Error creating store:", error);
    res.status(500).json({ error: "Failed to create store" });
  }
});

router.get("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await storage.getStore(storeId);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

router.put("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const updateData = insertStoreSchema.partial().parse(req.body);
    const store = await storage.updateStore(storeId, updateData);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid store data", details: error.errors });
    }
    console.error("Error updating store:", error);
    res.status(500).json({ error: "Failed to update store" });
  }
});

router.delete("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    await storage.deleteStore(storeId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ error: "Failed to delete store" });
  }
});

// Store Statistics
router.get("/stores/:storeId/stats", async (req, res) => {
  try {
    const { storeId } = req.params;
    const stats = await storage.getStoreStats(storeId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching store stats:", error);
    res.status(500).json({ error: "Failed to fetch store statistics" });
  }
});

// Store Settings
router.get("/store-settings", async (req, res) => {
  try {
    // For demo purposes, return default settings
    // In real implementation, this would fetch from database based on current store context
    const defaultSettings = {
      name: "My Store",
      description: "Your premier online store",
      subdomain: "my-store",
      customDomain: "",
      currency: "USD",
      timezone: "UTC",
      language: "en",
      theme: "modern",
      primaryColor: "#3b82f6",
      secondaryColor: "#1f2937",
      isPublic: true,
      maintenanceMode: false
    };
    res.json(defaultSettings);
  } catch (error) {
    console.error("Error fetching store settings:", error);
    res.status(500).json({ error: "Failed to fetch store settings" });
  }
});

router.put("/store-settings", async (req, res) => {
  try {
    // In real implementation, this would update store settings in database
    const settings = req.body;
    // Simulate successful update
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating store settings:", error);
    res.status(500).json({ error: "Failed to update store settings" });
  }
});

// Product Routes
router.get("/products", async (req, res) => {
  try {
    const { storeId, category, status } = req.query;
    // For demo purposes, return sample products with images
    const sampleProducts = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        basePrice: '299.99',
        currency: 'USD',
        status: 'active',
        category: 'electronics',
        inventory: { quantity: 50, trackQuantity: true },
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=600&fit=crop'
        ],
        description: 'High-quality wireless headphones with noise cancellation'
      },
      {
        id: '2', 
        name: 'Smart Fitness Tracker',
        basePrice: '199.99',
        currency: 'USD',
        status: 'active',
        category: 'electronics',
        inventory: { quantity: 25, trackQuantity: true },
        images: [
          'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&h=600&fit=crop'
        ],
        description: 'Advanced fitness tracking with heart rate monitoring'
      }
    ];
    res.json(sampleProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    console.log("POST /products hit - body:", JSON.stringify(req.body, null, 2));
    
    // Simple product creation for demo purposes
    if (!req.body.name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    
    // Create demo product response
    const newProduct = {
      id: Date.now().toString(),
      tenantId: '00000000-0000-0000-0000-000000000001',
      storeId: '00000000-0000-0000-0000-000000000001',
      name: req.body.name,
      description: req.body.description || '',
      sku: `SKU-${Date.now()}`,
      slug: req.body.name?.toLowerCase().replace(/\s+/g, '-') || `product-${Date.now()}`,
      basePrice: String(req.body.price || req.body.basePrice || '0'),
      salePrice: null,
      costPrice: null,
      currency: req.body.currency || 'USD',
      category: req.body.category || 'general',
      tags: req.body.tags || [],
      images: req.body.images || [],
      variants: req.body.variants || [],
      inventory: {
        trackQuantity: true,
        quantity: req.body.quantity || 100,
        lowStockThreshold: 5
      },
      status: 'active',
      isDigital: false,
      weight: null,
      dimensions: null,
      seo: null,
      featured: false,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log("Created demo product:", newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Product creation error:", error);
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = insertProductSchema.partial().parse(req.body);
    const product = await storage.updateProduct(productId, updateData);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid product data", details: error.errors });
    }
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    await storage.deleteProduct(productId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Order Routes
router.get("/orders", async (req, res) => {
  try {
    const { storeId, status, paymentStatus } = req.query;
    const orders = await storage.getOrders({
      storeId: storeId as string,
      status: status as string,
      limit: 100
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid order data", details: error.errors });
    }
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.put("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = insertOrderSchema.partial().parse(req.body);
    const order = await storage.updateOrder(orderId, updateData);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid order data", details: error.errors });
    }
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.delete("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    await storage.deleteOrder(orderId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// Customer Routes
router.get("/customers", async (req, res) => {
  try {
    const { storeId } = req.query;
    const customers = await storage.getCustomers(storeId as string);
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Categories Route
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      { id: "electronics", name: "Electronics", slug: "electronics" },
      { id: "clothing", name: "Clothing", slug: "clothing" },
      { id: "home", name: "Home & Garden", slug: "home-garden" },
      { id: "sports", name: "Sports", slug: "sports" },
      { id: "books", name: "Books", slug: "books" },
      { id: "beauty", name: "Beauty", slug: "beauty" },
      { id: "automotive", name: "Automotive", slug: "automotive" },
      { id: "toys", name: "Toys & Games", slug: "toys-games" }
    ];
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Analytics Routes
router.get("/analytics/overview", async (req, res) => {
  try {
    const { storeId, period = '7d' } = req.query;
    
    // Demo analytics data 
    const analytics = {
      period,
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      totalOrders: Math.floor(Math.random() * 500) + 100,
      totalCustomers: Math.floor(Math.random() * 300) + 50,
      averageOrderValue: Math.floor(Math.random() * 200) + 50,
      conversionRate: (Math.random() * 5 + 2).toFixed(2),
      
      // Daily metrics for charts
      dailyMetrics: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 50) + 10,
        visitors: Math.floor(Math.random() * 200) + 100,
        conversions: Math.floor(Math.random() * 20) + 5
      })).reverse(),
      
      // Top products
      topProducts: [
        { name: 'Premium Headphones', revenue: 15000, orders: 150 },
        { name: 'Wireless Mouse', revenue: 8500, orders: 200 },
        { name: 'Laptop Stand', revenue: 6200, orders: 124 },
        { name: 'USB Cable', revenue: 3800, orders: 380 },
        { name: 'Phone Case', revenue: 2900, orders: 145 }
      ],
      
      // Geographic data
      topCountries: [
        { country: 'United States', revenue: 25000, percentage: 45 },
        { country: 'United Kingdom', revenue: 12000, percentage: 22 },
        { country: 'Canada', revenue: 8000, percentage: 14 },
        { country: 'Australia', revenue: 6000, percentage: 11 },
        { country: 'Germany', revenue: 4500, percentage: 8 }
      ]
    };
    
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/analytics/products", async (req, res) => {
  try {
    const { storeId, period = '30d' } = req.query;
    
    // Demo product analytics
    const productAnalytics = {
      totalProducts: Math.floor(Math.random() * 100) + 20,
      activeProducts: Math.floor(Math.random() * 80) + 15,
      topPerformers: [
        { 
          id: '1', 
          name: 'Premium Wireless Headphones', 
          revenue: 15420, 
          units: 154, 
          views: 2340, 
          conversionRate: 6.58 
        },
        { 
          id: '2', 
          name: 'Smart Fitness Tracker', 
          revenue: 12680, 
          units: 126, 
          views: 1890, 
          conversionRate: 6.67 
        },
        { 
          id: '3', 
          name: 'Ergonomic Office Chair', 
          revenue: 9850, 
          units: 39, 
          views: 890, 
          conversionRate: 4.38 
        }
      ],
      categories: [
        { name: 'Electronics', revenue: 28900, percentage: 52 },
        { name: 'Accessories', revenue: 15600, percentage: 28 },
        { name: 'Clothing', revenue: 8200, percentage: 15 },
        { name: 'Home & Garden', revenue: 2800, percentage: 5 }
      ]
    };
    
    res.json(productAnalytics);
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    res.status(500).json({ error: "Failed to fetch product analytics" });
  }
});

router.get("/analytics/customers", async (req, res) => {
  try {
    const { storeId, period = '30d' } = req.query;
    
    // Demo customer analytics
    const customerAnalytics = {
      totalCustomers: Math.floor(Math.random() * 500) + 200,
      newCustomers: Math.floor(Math.random() * 50) + 20,
      returningCustomers: Math.floor(Math.random() * 100) + 50,
      customerLifetimeValue: Math.floor(Math.random() * 500) + 200,
      
      acquisitionChannels: [
        { channel: 'Organic Search', customers: 145, percentage: 35 },
        { channel: 'Social Media', customers: 98, percentage: 24 },
        { channel: 'Direct', customers: 76, percentage: 18 },
        { channel: 'Email Marketing', customers: 54, percentage: 13 },
        { channel: 'Paid Ads', customers: 42, percentage: 10 }
      ],
      
      customerSegments: [
        { segment: 'VIP Customers', count: 28, revenue: 18500 },
        { segment: 'Regular Buyers', count: 142, revenue: 24300 },
        { segment: 'One-time Buyers', count: 186, revenue: 12800 },
        { segment: 'At Risk', count: 34, revenue: 2100 }
      ]
    };
    
    res.json(customerAnalytics);
  } catch (error) {
    console.error("Error fetching customer analytics:", error);
    res.status(500).json({ error: "Failed to fetch customer analytics" });
  }
});

export const registerEcommerceRoutes = (app: any, middleware?: any) => {
  // Skip middleware completely for demo purposes
  app.use("/api", router);
};

export default router;