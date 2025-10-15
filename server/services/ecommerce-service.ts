import { DatabaseStorage } from '../database-storage';
import type { 
  Store, Product, Category, Order, Customer, StorePage,
  InsertStore, InsertProduct, InsertCategory, InsertOrder, InsertCustomer, InsertStorePage 
} from '../../shared/ecommerce-schema';

export class EcommerceService {
  private storage: DatabaseStorage;

  constructor() {
    this.storage = DatabaseStorage.getInstance();
  }

  // Store management
  async createStore(data: InsertStore): Promise<Store> {
    // Generate subdomain from store name if not provided
    if (!data.subdomain) {
      data.subdomain = data.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Generate domain if not provided
    if (!data.domain) {
      data.domain = `${data.subdomain}.argilette-store.com`;
    }

    const store = await this.storage.createStore(data);
    return store;
  }

  async getStoresByUser(userId: string, tenantId?: string): Promise<Store[]> {
    return await this.storage.getStoresByUser(userId, tenantId);
  }

  async getStoreById(id: number): Promise<Store | null> {
    return await this.storage.getStoreById(id);
  }

  async updateStore(id: number, data: Partial<InsertStore>): Promise<Store> {
    return await this.storage.updateStore(id, data);
  }

  async deleteStore(id: number): Promise<void> {
    await this.storage.deleteStore(id);
  }

  // Product management
  async createProduct(data: InsertProduct): Promise<Product> {
    // Generate slug from product name if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return await this.storage.createProduct(data);
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    return await this.storage.getProductsByStore(storeId);
  }

  async getProductById(id: number): Promise<Product | null> {
    return await this.storage.getProductById(id);
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product> {
    return await this.storage.updateProduct(id, data);
  }

  async deleteProduct(id: number): Promise<void> {
    await this.storage.deleteProduct(id);
  }

  // Category management
  async createCategory(data: InsertCategory): Promise<Category> {
    if (!data.slug) {
      data.slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return await this.storage.createCategory(data);
  }

  async getCategoriesByStore(storeId: number): Promise<Category[]> {
    return await this.storage.getCategoriesByStore(storeId);
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category> {
    return await this.storage.updateCategory(id, data);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.storage.deleteCategory(id);
  }

  // Order management
  async createOrder(data: InsertOrder): Promise<Order> {
    // Generate order number if not provided
    if (!data.orderNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      data.orderNumber = `ORD-${timestamp}-${random}`;
    }

    const order = await this.storage.createOrder(data);

    // Update customer stats if customer exists
    if (data.customerId) {
      await this.updateCustomerStats(data.customerId, data.totalAmount);
    }

    return order;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    return await this.storage.getOrdersByStore(storeId);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return await this.storage.getOrderById(id);
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order> {
    return await this.storage.updateOrder(id, data);
  }

  // Customer management
  async createCustomer(data: InsertCustomer): Promise<Customer> {
    return await this.storage.createCustomer(data);
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    return await this.storage.getCustomersByStore(storeId);
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.storage.getCustomerById(id);
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer> {
    return await this.storage.updateCustomer(id, data);
  }

  private async updateCustomerStats(customerId: string, orderAmount: string): Promise<void> {
    try {
      const customer = await this.storage.getCustomerById(parseInt(customerId));
      if (customer) {
        const newTotalOrders = customer.totalOrders + 1;
        const newTotalSpent = parseFloat(customer.totalSpent) + parseFloat(orderAmount);
        
        await this.storage.updateCustomer(customer.id, {
          totalOrders: newTotalOrders,
          totalSpent: newTotalSpent.toString(),
          lastOrderAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating customer stats:', error);
    }
  }

  // Store pages management
  async createStorePage(data: InsertStorePage): Promise<StorePage> {
    if (!data.slug) {
      data.slug = data.title.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return await this.storage.createStorePage(data);
  }

  async getPagesByStore(storeId: number): Promise<StorePage[]> {
    return await this.storage.getPagesByStore(storeId);
  }

  async updateStorePage(id: number, data: Partial<InsertStorePage>): Promise<StorePage> {
    return await this.storage.updateStorePage(id, data);
  }

  async deleteStorePage(id: number): Promise<void> {
    await this.storage.deleteStorePage(id);
  }

  // Analytics
  async getStoreAnalytics(storeId: number): Promise<any> {
    const orders = await this.storage.getOrdersByStore(storeId);
    const products = await this.storage.getProductsByStore(storeId);
    const customers = await this.storage.getCustomersByStore(storeId);

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= last30Days
    );
    
    const monthlyRevenue = recentOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0
    );

    return {
      totalRevenue,
      totalOrders,
      totalProducts: products.length,
      totalCustomers: customers.length,
      averageOrderValue,
      monthlyRevenue,
      monthlyOrders: recentOrders.length,
      conversionRate: customers.length > 0 ? (totalOrders / customers.length) * 100 : 0
    };
  }

  // Store template generation
  async generateStoreTemplate(storeId: number, templateType: string = 'modern'): Promise<any> {
    const store = await this.getStoreById(storeId);
    if (!store) throw new Error('Store not found');

    const products = await this.getProductsByStore(storeId);
    const categories = await this.getCategoriesByStore(storeId);
    const pages = await this.getPagesByStore(storeId);

    const template = {
      store,
      products: products.slice(0, 8), // Featured products
      categories,
      pages,
      theme: {
        type: templateType,
        colors: {
          primary: store.primaryColor,
          secondary: store.secondaryColor
        },
        layout: templateType === 'modern' ? 'grid' : 'list',
        features: {
          searchBar: true,
          wishlist: true,
          quickView: true,
          compareProducts: true,
          reviewSystem: true,
          liveChatSupport: true
        }
      }
    };

    return template;
  }
}

export const ecommerceService = new EcommerceService();