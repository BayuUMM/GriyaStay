export type PropertyType = 'house' | 'hotel' | 'apartment';
export type FilterTab = PropertyType | 'all' | 'promo' | 'near' | 'mine';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: PropertyType;
  image: string;
  rating: number;
  reviews: number;
  features: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  amenities?: string[];
  isPromo?: boolean;
  createdAt: string;
  ownerId?: string;
}

export interface CartItem extends Property {
  quantity: number;
  duration: number;
}
