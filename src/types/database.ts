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
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  full_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  role?: Profile["role"];
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ProfileUpdate = Partial<ProfileInsert>;

export interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
}

export type ProductUpdate = Partial<ProductInsert>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface CategoryInsert {
  name: string;
  slug: string;
}

export type CategoryUpdate = Partial<CategoryInsert>;

export interface Order {
  id: string;
  user_id: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: ShippingAddress;
  created_at: string;
  updated_at: string;
}

export interface OrderInsert {
  id?: string;
  user_id: string;
  status?: Order["status"];
  total_amount: number;
  shipping_address: ShippingAddress;
  created_at?: string;
  updated_at?: string;
}

export type OrderUpdate = Partial<OrderInsert>;

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
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
