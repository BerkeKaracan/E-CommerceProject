export interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  is_discounted?: number;
  discount_rate?: number;
  original_price?: number;
  sales_count?: number;
  stock?: number;
  view_count?: number;
}

export interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  product: ApiProduct;
}

export interface Product extends ApiProduct {
  quantity: number;
}
