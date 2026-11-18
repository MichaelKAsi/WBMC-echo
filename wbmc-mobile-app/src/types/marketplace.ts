export interface MarketplaceItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: 'services' | 'products';
  subcategory: string | null;
  imageUrl: string | null;
  contactInfo: string | null;
  createdAt: string;
  userId: string | null;
}
