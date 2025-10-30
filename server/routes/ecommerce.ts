import { Express } from "express";
import { z } from "zod";
import { 
  insertStoreSchema,
  insertEcommerceProductSchema,
  type Store,
  type EcommerceProduct
} from "../../shared/schema";
import { authenticate, type AuthUser } from "../middleware/auth";
import { DatabaseStorage } from "../database-storage";

// SECURITY: Secure user storage function - gets tenant-scoped storage
function getUserStorage(req: any): DatabaseStorage {
  const authenticatedUser = req.user;
  
  if (!authenticatedUser) {
    throw new Error('Authentication required - no valid session');
  }
  
  const userEmail = authenticatedUser.email;
  const tenantId = authenticatedUser.tenantId;
  const isPlatformOwner = userEmail === 'abel@argilette.com' || userEmail === 'admin@default.com';
  
  return new DatabaseStorage(userEmail, tenantId, isPlatformOwner);
}

export const registerEcommerceRoutes = (app: Express) => {
  // ==================== STORE ENDPOINTS ====================
  
  // Create a new store
  app.post("/api/ecommerce/stores", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      
      // Validate request body
      const storeData = insertStoreSchema.parse({
        ...req.body,
        userId: user.id,
        tenantId: user.tenantId
      });
      
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid store data", details: error.errors });
      }
      console.error("Error creating store:", error);
      res.status(500).json({ error: "Failed to create store" });
    }
  });

  // Get all stores for the authenticated user's tenant
  app.get("/api/ecommerce/stores", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      
      const stores = await storage.getStores(user.tenantId);
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  // Get a specific store by ID
  app.get("/api/ecommerce/stores/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      const store = await storage.getStoreById(id, user.tenantId);
      
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ error: "Failed to fetch store" });
    }
  });

  // Update a store
  app.put("/api/ecommerce/stores/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      // Validate update data
      const updates = insertStoreSchema.partial().parse(req.body);
      // SECURITY: Remove fields that should not be user-modifiable
      const { tenantId: _, userId: __, ...safeUpdates } = updates;
      
      const store = await storage.updateStore(id, user.tenantId, safeUpdates as any);
      res.json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid store data", details: error.errors });
      }
      console.error("Error updating store:", error);
      res.status(500).json({ error: "Failed to update store" });
    }
  });

  // Delete a store
  app.delete("/api/ecommerce/stores/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      await storage.deleteStore(id, user.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ error: "Failed to delete store" });
    }
  });

  // ==================== PRODUCT ENDPOINTS ====================
  
  // Create a new product
  app.post("/api/ecommerce/products", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      
      // Validate request body
      const productData = insertEcommerceProductSchema.parse(req.body);
      
      // SECURITY: Verify store belongs to tenant
      const store = await storage.getStoreById(productData.storeId, user.tenantId);
      if (!store) {
        return res.status(403).json({ error: "Store not found or access denied" });
      }
      
      const product = await storage.createEcommerceProduct({ ...productData, tenantId: user.tenantId });
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Bulk create products
  app.post("/api/ecommerce/products/bulk", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const tenantId = req.user?.tenantId || 'default-tenant';
      const { products } = req.body;

      // Validate input is an array
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Products must be an array" });
      }

      // Validate each product with Zod schema
      const validatedProducts = [];
      for (let i = 0; i < products.length; i++) {
        try {
          const parsed = insertEcommerceProductSchema.parse(products[i]);
          validatedProducts.push(parsed);
        } catch (error: any) {
          return res.status(400).json({ 
            error: `Product at index ${i} is invalid`, 
            details: error.errors 
          });
        }
      }

      // Verify all unique store IDs belong to tenant
      const storeIds = [...new Set(validatedProducts.map(p => p.storeId))];
      for (const storeId of storeIds) {
        const store = await storage.getStoreById(storeId, tenantId);
        if (!store) {
          return res.status(403).json({ 
            error: `Store ${storeId} not found or access denied` 
          });
        }
      }

      // Force authenticated tenantId on all products (prevent tenant hijacking)
      const productsWithTenant = validatedProducts.map(p => ({
        ...p,
        tenantId, // Override any client-supplied tenantId
      }));

      const created = await storage.bulkCreateEcommerceProducts(productsWithTenant);
      
      res.status(201).json({
        created: created.length,
        products: created,
      });
    } catch (error: any) {
      console.error('Bulk product creation error:', error);
      res.status(500).json({ error: "Failed to create products" });
    }
  });

  // Get all products (optionally filtered by storeId)
  app.get("/api/ecommerce/products", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { storeId } = req.query;
      
      const products = await storage.getEcommerceProducts(
        user.tenantId, 
        storeId as string | undefined
      );
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get a specific product by ID
  app.get("/api/ecommerce/products/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      const products = await storage.getEcommerceProducts(user.tenantId);
      const product = products.find(p => p.id === id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Update a product
  app.put("/api/ecommerce/products/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      // SECURITY: First get the product to verify it belongs to tenant
      const existingProducts = await storage.getEcommerceProducts(user.tenantId, undefined);
      const product = existingProducts.find(p => p.id === id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Validate update data
      const updates = insertEcommerceProductSchema.partial().parse(req.body);
      
      // SECURITY: If storeId is being changed, verify new store belongs to tenant
      if (updates.storeId && updates.storeId !== product.storeId) {
        const store = await storage.getStoreById(updates.storeId, user.tenantId);
        if (!store) {
          return res.status(403).json({ error: "Target store not found or access denied" });
        }
      }
      
      // SECURITY: Remove tenantId from updates (it should never change)
      const { tenantId: _, ...safeUpdates } = updates;
      
      const updatedProduct = await storage.updateEcommerceProduct(id, user.tenantId, safeUpdates as any);
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete a product
  app.delete("/api/ecommerce/products/:id", authenticate, async (req, res) => {
    try {
      const storage = getUserStorage(req);
      const user = req.user as AuthUser;
      const { id } = req.params;
      
      // SECURITY: Verify product belongs to tenant before deleting
      const existingProducts = await storage.getEcommerceProducts(user.tenantId, undefined);
      const product = existingProducts.find(p => p.id === id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await storage.deleteEcommerceProduct(id, user.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
};
