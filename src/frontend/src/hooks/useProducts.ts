import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productData, images }: { productData: CreateProductData; images: ExternalBlob[] }) => {
      console.log('=== ADD PRODUCT MUTATION START ===');
      console.log('Actor availability check:', {
        actorExists: !!actor,
        actorType: actor ? typeof actor : 'undefined',
        identityExists: !!identity,
        identityPrincipal: identity?.getPrincipal().toString() || 'no identity',
      });

      if (!actor) {
        console.error('Actor not available - cannot proceed');
        throw new Error('Backend actor not available');
      }

      if (!identity) {
        console.error('Identity not available - user may not be authenticated');
        throw new Error('User identity not available - please ensure you are logged in');
      }

      console.log('Authentication state verified:', {
        principal: identity.getPrincipal().toString(),
        isAnonymous: identity.getPrincipal().isAnonymous(),
      });
      
      // Log detailed information about the request
      console.log('=== ADD PRODUCT REQUEST DATA ===');
      console.log('Product Data:', {
        name: productData.name,
        description: productData.description,
        price: productData.price.toString(),
        inventory: productData.inventory.toString(),
        hasVariants: productData.hasVariants,
        variantCount: productData.variants?.length || 0,
      });
      
      if (productData.variants) {
        console.log('Variants:', productData.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          price: v.price.toString(),
          inventory: v.inventory.toString(),
          parentProductId: v.parentProductId,
        })));
      }
      
      console.log('Images:', images.length);
      console.log('Calling actor.addProduct with authenticated identity...');
      
      try {
        const result = await actor.addProduct(productData, images);
        console.log('=== ADD PRODUCT SUCCESS ===');
        console.log('Backend call completed successfully');
        return result;
      } catch (error: any) {
        console.error('=== ADD PRODUCT ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error string:', error?.toString());
        console.error('Full error object:', error);
        
        // Try to extract more details from the error
        if (error?.message) {
          console.error('Extracted message:', error.message);
        }
        if (error?.stack) {
          console.error('Stack trace:', error.stack);
        }
        if (error?.response) {
          console.error('Response data:', error.response);
        }
        if (error?.body) {
          console.error('Error body:', error.body);
        }
        
        // Check if this is an authentication/authorization error
        const errorMsg = error?.message || error?.toString() || '';
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('Only admins')) {
          console.error('AUTHENTICATION/AUTHORIZATION ERROR DETECTED');
          console.error('Current identity principal:', identity.getPrincipal().toString());
          console.error('Is anonymous:', identity.getPrincipal().isAnonymous());
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('=== ADD PRODUCT MUTATION SUCCESS HOOK ===');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('=== ADD PRODUCT MUTATION ERROR HOOK ===');
      console.error('Error in onError:', error);
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, productData, images }: { productId: string; productData: CreateProductData; images: ExternalBlob[] }) => {
      console.log('=== UPDATE PRODUCT MUTATION START ===');
      console.log('Actor availability check:', {
        actorExists: !!actor,
        actorType: actor ? typeof actor : 'undefined',
        identityExists: !!identity,
        identityPrincipal: identity?.getPrincipal().toString() || 'no identity',
      });

      if (!actor) {
        console.error('Actor not available - cannot proceed');
        throw new Error('Backend actor not available');
      }

      if (!identity) {
        console.error('Identity not available - user may not be authenticated');
        throw new Error('User identity not available - please ensure you are logged in');
      }

      console.log('Authentication state verified:', {
        principal: identity.getPrincipal().toString(),
        isAnonymous: identity.getPrincipal().isAnonymous(),
      });
      
      // Log detailed information about the request
      console.log('=== UPDATE PRODUCT REQUEST DATA ===');
      console.log('Product ID:', productId);
      console.log('Product Data:', {
        name: productData.name,
        description: productData.description,
        price: productData.price.toString(),
        inventory: productData.inventory.toString(),
        hasVariants: productData.hasVariants,
        variantCount: productData.variants?.length || 0,
      });
      
      if (productData.variants) {
        console.log('Variants:', productData.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          price: v.price.toString(),
          inventory: v.inventory.toString(),
          parentProductId: v.parentProductId,
        })));
      }
      
      console.log('Images:', images.length);
      console.log('Calling actor.updateProduct with authenticated identity...');
      
      try {
        const result = await actor.updateProduct(productId, productData, images);
        console.log('=== UPDATE PRODUCT SUCCESS ===');
        console.log('Backend call completed successfully');
        return result;
      } catch (error: any) {
        console.error('=== UPDATE PRODUCT ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Error string:', error?.toString());
        console.error('Full error object:', error);
        
        // Try to extract more details from the error
        if (error?.message) {
          console.error('Extracted message:', error.message);
        }
        if (error?.stack) {
          console.error('Stack trace:', error.stack);
        }
        if (error?.response) {
          console.error('Response data:', error.response);
        }
        if (error?.body) {
          console.error('Error body:', error.body);
        }
        
        // Check if this is an authentication/authorization error
        const errorMsg = error?.message || error?.toString() || '';
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('Only admins')) {
          console.error('AUTHENTICATION/AUTHORIZATION ERROR DETECTED');
          console.error('Current identity principal:', identity.getPrincipal().toString());
          console.error('Is anonymous:', identity.getPrincipal().isAnonymous());
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('=== UPDATE PRODUCT MUTATION SUCCESS HOOK ===');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('=== UPDATE PRODUCT MUTATION ERROR HOOK ===');
      console.error('Error in onError:', error);
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
