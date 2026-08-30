export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: DatabaseRelationship[];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: DatabaseRelationship[];
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: DatabaseRelationship[];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: DatabaseRelationship[];
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
        Relationships: DatabaseRelationship[];
      };
      cart_items: {
        Row: CartItem;
        Insert: CartItemInsert;
        Update: CartItemUpdate;
        Relationships: DatabaseRelationship[];
      };
      product_reviews: {
        Row: ProductReview;
        Insert: ProductReviewInsert;
        Update: ProductReviewUpdate;
        Relationships: DatabaseRelationship[];
      };
      wishlist: {
        Row: Wishlist;
        Insert: WishlistInsert;
        Update: WishlistUpdate;
        Relationships: DatabaseRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

interface DatabaseRelationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  full_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  role?: Profile["role"];
  created_at?: string;
  updated_at?: string;
}

export type ProfileUpdate = Partial<ProfileInsert>;

export interface ProductSpec {
  key: string;
  label: string;
  value: string;
}

/**
 * A single gallery item for the product detail carousel. `images`/`image_url`
 * are stored separately for backward compatibility, but consumers can flatten
 * them into this unified sequence (image, video, image, video, …).
 */
export type ProductMedia =
  | { type: "image"; url: string }
  | { type: "video"; url: string };

export interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  /** Advanced catalog fields (nullable until the migration is applied). */
  brand: string | null;
  original_price: number | null;
  color_family: string | null;
  images: string[] | null;
  /** Public video URLs shown as video slides in the alternating gallery. */
  videos: string[] | null;
  specs: ProductSpec[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  title: string;
  description?: string | null;
  price: number;
  category: string;
  stock: number;
  image_url?: string | null;
  brand?: string | null;
  original_price?: number | null;
  color_family?: string | null;
  images?: string[] | null;
  videos?: string[] | null;
  specs?: ProductSpec[] | null;
}

export type ProductUpdate = Partial<ProductInsert>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  /** Attribute keys enabled for products in this category. */
  fields: string[] | null;
  /** Cover image served from the public `categories` storage bucket. */
  image_url: string | null;
}

export interface CategoryInsert {
  name: string;
  slug: string;
  fields?: string[] | null;
  image_url?: string | null;
}

export type CategoryUpdate = Partial<CategoryInsert>;

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  /** Plain text address line as stored in the live orders table. */
  shipping_address: string;
  city: string;
  notes?: string | null;
  /** Optional delivery reference (landmark / near area) set at checkout. */
  near_landmark?: string | null;
  /** Courier tracking number entered by the admin once the order ships. */
  tracking_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  status?: Order["status"];
  total_amount: number;
  shipping_address: string;
  city: string;
  notes?: string | null;
  near_landmark?: string | null;
  tracking_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type OrderUpdate = Partial<OrderInsert>;

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at?: string;
}

export type OrderItemUpdate = Partial<OrderItemInsert>;

export interface ShippingAddress {
  full_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  postal_code: string;
  country: string;
  phone?: string | null;
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartItemInsert {
  id?: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
}

export type CartItemUpdate = Partial<CartItemInsert>;

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
}

export interface ProductReviewInsert {
  id?: string;
  product_id: string;
  user_id: string;
  author_name?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  created_at?: string;
}

export type ProductReviewUpdate = Partial<ProductReviewInsert>;

/** One saved favorite — mirrors the `wishlist` table. */
export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface WishlistInsert {
  id?: string;
  user_id: string;
  product_id: string;
  created_at?: string;
}

export type WishlistUpdate = Partial<WishlistInsert>;
