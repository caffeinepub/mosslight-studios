import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useAdminAuth } from './useAdminAuth';
import type { Product, CreateProductData, ExternalBlob } from '../backend';

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(productId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const { isAdminAuthenticated } = useAdminAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productData, images }: { productData: CreateProductData; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Log admin authentication state from AdminAuthProvider
      console.log('=== ADMIN AUTH STATE CHECK ===');
      console.log('Admin authenticated (passcode):', isAdminAuthenticated);
      console.log('==============================');
      
      // Log the complete product data being sent to backend
      console.log('=== ADD PRODUCT REQUEST ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Actor available:', !!actor);
      console.log('Product Data:', {
        name: productData.name,
        description: productData.description,
        price: productData.price.toString(),
        inventory: productData.inventory.toString(),
        hasVariants: productData.hasVariants,
        variantsCount: productData.variants?.length || 0,
      });
      
      if (productData.variants) {
        console.log('Variants Details:');
        productData.variants.forEach((variant, index) => {
          console.log(`  Variant ${index + 1}:`, {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            price: variant.price.toString(),
            priceType: typeof variant.price,
            inventory: variant.inventory.toString(),
            inventoryType: typeof variant.inventory,
            parentProductId: variant.parentProductId,
          });
        });
      }
      
      console.log('Images:', images.length, 'image(s)');
      console.log('=========================');
      
      try {
        const result = await actor.addProduct(productData, images);
        console.log('✅ Product added successfully');
        return result;
      } catch (error: any) {
        console.error('❌ ADD PRODUCT ERROR:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const { isAdminAuthenticated } = useAdminAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, productData, images }: { productId: string; productData: CreateProductData; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Log admin authentication state from AdminAuthProvider
      console.log('=== ADMIN AUTH STATE CHECK ===');
      console.log('Admin authenticated (passcode):', isAdminAuthenticated);
      console.log('==============================');
      
      // Log the complete product data being sent to backend
      console.log('=== UPDATE PRODUCT REQUEST ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Actor available:', !!actor);
      console.log('Product ID:', productId);
      console.log('Product Data:', {
        name: productData.name,
        description: productData.description,
        price: productData.price.toString(),
        inventory: productData.inventory.toString(),
        hasVariants: productData.hasVariants,
        variantsCount: productData.variants?.length || 0,
      });
      
      if (productData.variants) {
        console.log('Variants Details:');
        productData.variants.forEach((variant, index) => {
          console.log(`  Variant ${index + 1}:`, {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            price: variant.price.toString(),
            priceType: typeof variant.price,
            inventory: variant.inventory.toString(),
            inventoryType: typeof variant.inventory,
            parentProductId: variant.parentProductId,
          });
        });
      }
      
      console.log('Images:', images.length, 'image(s)');
      console.log('=============================');
      
      try {
        const result = await actor.updateProduct(productId, productData, images);
        console.log('✅ Product updated successfully');
        return result;
      } catch (error: any) {
        console.error('❌ UPDATE PRODUCT ERROR:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
