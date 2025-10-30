import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Package,
  ShoppingCart,
  ArrowLeft,
  Store,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  AlertCircle,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { CURRENCIES } from '@shared/currencies';

interface Store {
  id: number;
  name: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  logo?: string;
  status: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  isActive: boolean;
  inventoryQuantity: number;
}

export default function StorePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch store data
  const { data: store, isLoading: storeLoading, error: storeError } = useQuery<Store>({
    queryKey: ['/api/ecommerce/stores', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/stores/${id}`);
      if (!response.ok) {
        throw new Error('Store not found');
      }
      return await response.json();
    },
    enabled: !!id
  });

  // Fetch products for this store
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/ecommerce/products', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/products?storeId=${id}`);
      return await response.json();
    },
    enabled: !!id && !!store
  });

  const currencySymbol = store ? CURRENCIES.find(c => c.code === store.currency)?.symbol || '$' : '$';

  // Loading state
  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-3 text-center font-semibold">
          <Skeleton className="h-6 w-96 mx-auto bg-yellow-600/20" data-testid="skeleton-banner" />
        </div>
        <div className="pt-16">
          <div className="px-4 py-6">
            <Skeleton className="h-32 w-full mb-8" data-testid="skeleton-header" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-96" data-testid={`skeleton-product-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (storeError || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-error">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Store Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/ecommerce-dashboard')} 
              className="w-full"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.isActive && p.inventoryQuantity > 0);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-store-preview">
      {/* PREVIEW MODE Banner */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-3 shadow-lg"
        data-testid="banner-preview-mode"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">PREVIEW MODE</span>
            <span className="hidden sm:inline">- This is how your store will look to customers</span>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate('/ecommerce-dashboard')}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Store Header */}
      <header 
        className="pt-20 pb-6 shadow-md"
        style={{ backgroundColor: store.primaryColor }}
        data-testid="header-store"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="h-16 w-16 rounded-lg object-cover bg-white"
                  data-testid="img-store-logo"
                />
              ) : (
                <div 
                  className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center"
                  data-testid="icon-store-placeholder"
                >
                  <Store className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white" data-testid="text-store-name">
                  {store.name}
                </h1>
                <p className="text-white/90 text-sm" data-testid="text-store-url">
                  {store.customDomain || `${store.subdomain}.argilette-store.com`}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    disabled
                    data-testid="button-cart-preview"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cart is disabled in preview mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {store.description && (
        <section className="bg-white py-12 border-b" data-testid="section-hero">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-lg text-gray-700 leading-relaxed" data-testid="text-store-description">
              {store.description}
            </p>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-products-title">
              Our Products
            </h2>
            {activeProducts.length > 0 && (
              <Badge variant="secondary" data-testid="badge-product-count">
                {activeProducts.length} {activeProducts.length === 1 ? 'Product' : 'Products'}
              </Badge>
            )}
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-96" data-testid={`skeleton-loading-${i}`} />
              ))}
            </div>
          ) : activeProducts.length === 0 ? (
            <Card className="py-16" data-testid="card-no-products">
              <CardContent className="text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Products Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add products to your store to see them displayed here
                </p>
                <Button 
                  onClick={() => navigate('/ecommerce-dashboard')}
                  data-testid="button-add-products"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              data-testid="grid-products"
            >
              {activeProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover-elevate"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-product-${product.id}`}
                      />
                    ) : (
                      <Package 
                        className="h-20 w-20 text-gray-400" 
                        data-testid={`icon-product-${product.id}`}
                      />
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4" data-testid={`text-product-description-${product.id}`}>
                      {product.description.substring(0, 100)}
                      {product.description.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: store.primaryColor }}
                        data-testid={`text-product-price-${product.id}`}
                      >
                        {currencySymbol}{product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through" data-testid={`text-product-compare-price-${product.id}`}>
                          {currencySymbol}{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button 
                              className="w-full"
                              disabled
                              style={{ 
                                backgroundColor: store.primaryColor,
                                color: 'white'
                              }}
                              data-testid={`button-add-to-cart-${product.id}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Shopping is disabled in preview mode</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-12 mt-12"
        style={{ backgroundColor: store.secondaryColor }}
        data-testid="footer-store"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4" data-testid="text-footer-about">About {store.name}</h3>
              <p className="text-white/80 text-sm">
                {store.description || 'Your trusted online store for quality products'}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/80 hover:text-white">Products</a></li>
                <li><a href="#" className="text-white/80 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-white/80 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-white/80 hover:text-white">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="text-white/80 hover:text-white"
                  data-testid="link-facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a 
                  href="#" 
                  className="text-white/80 hover:text-white"
                  data-testid="link-twitter"
                >
                  <Twitter className="h-6 w-6" />
                </a>
                <a 
                  href="#" 
                  className="text-white/80 hover:text-white"
                  data-testid="link-instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a 
                  href="#" 
                  className="text-white/80 hover:text-white"
                  data-testid="link-email"
                >
                  <Mail className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-white/60 text-sm" data-testid="text-footer-powered">
              Powered by <span className="font-semibold text-white">ARGILETTE</span> E-commerce Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
