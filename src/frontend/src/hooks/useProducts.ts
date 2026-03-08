import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { CreateProductData } from "../backendTypes";
import { useFullActor } from "./useFullActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetProducts() {
  const { actor, isFetching } = useFullActor();

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(productId: string) {
  const { actor, isFetching } = useFullActor();

  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      product,
      images,
    }: {
      product: CreateProductData;
      images: ExternalBlob[];
    }) => {
      if (!actor || isFetching) {
        throw new Error(
          "BACKEND_UNAVAILABLE: Backend actor is not available. Please wait for the connection to initialize and try again.",
        );
      }

      if (!identity) {
        throw new Error(
          "AUTH_REQUIRED: You must be logged in with Internet Identity to add products.",
        );
      }

      try {
        await actor.addProduct(product, images);
      } catch (err: any) {
        const message = err?.message || String(err);
        if (
          message.includes("Permission Denied") ||
          message.includes("not registered as an admin") ||
          message.includes("Unauthorized") ||
          message.includes("Only admins")
        ) {
          throw new Error(
            `PERMISSION_DENIED: Your Internet Identity principal is not registered as an admin in the backend. Please ensure you completed the admin setup process. Your principal: ${identity.getPrincipal().toString()}`,
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      productId,
      product,
      images,
    }: {
      productId: string;
      product: CreateProductData;
      images: ExternalBlob[];
    }) => {
      if (!actor || isFetching) {
        throw new Error(
          "BACKEND_UNAVAILABLE: Backend actor is not available. Please wait for the connection to initialize and try again.",
        );
      }

      if (!identity) {
        throw new Error(
          "AUTH_REQUIRED: You must be logged in with Internet Identity to update products.",
        );
      }

      try {
        await actor.updateProduct(productId, product, images);
      } catch (err: any) {
        const message = err?.message || String(err);
        if (
          message.includes("Permission Denied") ||
          message.includes("not registered as an admin") ||
          message.includes("Unauthorized") ||
          message.includes("Only admins")
        ) {
          throw new Error(
            `PERMISSION_DENIED: Your Internet Identity principal is not registered as an admin. Your principal: ${identity.getPrincipal().toString()}`,
          );
        }
        throw err;
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor || isFetching) {
        throw new Error(
          "BACKEND_UNAVAILABLE: Backend actor is not available. Please wait for the connection to initialize and try again.",
        );
      }

      try {
        await actor.deleteProduct(productId);
      } catch (err: any) {
        const message = err?.message || String(err);
        if (
          message.includes("Permission Denied") ||
          message.includes("not registered as an admin") ||
          message.includes("Unauthorized") ||
          message.includes("Only admins")
        ) {
          throw new Error(
            "PERMISSION_DENIED: Admin permission denied. Please log out and log back in with Internet Identity, then re-enter your admin passcode.",
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
