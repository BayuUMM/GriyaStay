import { createClient } from '@supabase/supabase-js';
import { Property } from '../types';

// Read values safely from Vite environment keys
const env = (import.meta as any).env || {};
const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if Supabase keys have been configured by the user
export const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  supabaseAnonKey.length > 0 && 
  !supabaseUrl.includes('placeholder');

// Initialize client (or null if not configured to prevent startup crashes)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Utility: Converts snake_case database object to camelCase TypeScript property object
 */
export function convertFromDb(dbProp: any): Property {
  return {
    id: dbProp.id,
    title: dbProp.title,
    description: dbProp.description,
    price: Number(dbProp.price),
    location: dbProp.location,
    type: dbProp.type,
    image: dbProp.image,
    rating: dbProp.rating ?? 5,
    reviews: dbProp.reviews ?? 1,
    features: dbProp.features ?? [],
    bedrooms: dbProp.bedrooms,
    bathrooms: dbProp.bathrooms,
    sqft: dbProp.sqft,
    amenities: dbProp.amenities ?? [],
    isPromo: dbProp.is_promo ?? false,
    vrImage: dbProp.vr_image,
    createdAt: dbProp.created_at || new Date().toISOString(),
    ownerId: dbProp.owner_id,
  };
}

/**
 * Utility: Converts camelCase property object to snake_case database object
 */
export function convertToDb(prop: Partial<Property>): any {
  const dbData: any = {};
  if (prop.id !== undefined) dbData.id = prop.id;
  if (prop.title !== undefined) dbData.title = prop.title;
  if (prop.description !== undefined) dbData.description = prop.description;
  if (prop.price !== undefined) dbData.price = Number(prop.price);
  if (prop.location !== undefined) dbData.location = prop.location;
  if (prop.type !== undefined) dbData.type = prop.type;
  if (prop.image !== undefined) dbData.image = prop.image;
  if (prop.rating !== undefined) dbData.rating = Number(prop.rating);
  if (prop.reviews !== undefined) dbData.reviews = Number(prop.reviews);
  if (prop.features !== undefined) dbData.features = prop.features;
  if (prop.bedrooms !== undefined) dbData.bedrooms = prop.bedrooms;
  if (prop.bathrooms !== undefined) dbData.bathrooms = prop.bathrooms;
  if (prop.sqft !== undefined) dbData.sqft = prop.sqft;
  if (prop.amenities !== undefined) dbData.amenities = prop.amenities;
  if (prop.isPromo !== undefined) dbData.is_promo = !!prop.isPromo;
  if (prop.vrImage !== undefined) dbData.vr_image = prop.vrImage;
  if (prop.createdAt !== undefined) dbData.created_at = prop.createdAt;
  if (prop.ownerId !== undefined) dbData.owner_id = prop.ownerId;
  return dbData;
}

/**
 * Fetch all properties from 'properties' table in Supabase
 */
export async function fetchSupabaseProperties(): Promise<Property[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Supabase service is currently unreachable (Failed to Fetch). Check your VITE_SUPABASE_URL database configuration or internet connection. Falling back to local offline mode.');
        return null;
      }
      console.error('Error fetching properties from Supabase:', error.message);
      throw error;
    }

    if (data) {
      return data.map(convertFromDb);
    }
    return [];
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      console.warn('⚠️ Supabase connection is offline or unreachable. GriyaStay is operating gracefully using local fallback storage.');
    } else {
      console.error('Supabase fetch failed:', err);
    }
    return null;
  }
}

/**
 * Insert or update a property in Supabase 
 */
export async function upsertSupabaseProperty(prop: Property): Promise<Property | null> {
  if (!supabase) return null;
  const dbData = convertToDb(prop);
  try {
    const { data, error } = await supabase
      .from('properties')
      .upsert(dbData)
      .select();

    if (error) {
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Supabase database currently unreachable during custom property upsert. Saved locally.');
        return null;
      }
      console.error('Error upserting property in Supabase:', error.message);
      throw error;
    }

    if (data && data[0]) {
      return convertFromDb(data[0]);
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      console.warn('⚠️ Supabase connection offline during property registration. Operating in local-only mode.');
    } else {
      console.error('Supabase upsert failed:', err);
    }
    return null;
  }
}

/**
 * Delete a property from Supabase
 */
export async function deleteSupabaseProperty(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Supabase database unreachable during property deletion.');
        return false;
      }
      console.error('Error deleting property from Supabase:', error.message);
      throw error;
    }
    return true;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      console.warn('⚠️ Supabase connection offline during property deletion. Operating in local-only mode.');
    } else {
      console.error('Supabase delete failed:', err);
    }
    return false;
  }
}

export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  isKtpVerified: boolean;
  ktpNumber?: string;
  ktpPhoto?: string;
}

/**
 * Fetch a user profile from Supabase by email
 */
export async function fetchSupabaseUser(email: string): Promise<SupabaseUser | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Supabase database unreachable during user profile fetch.');
        return null;
      }
      console.error('Error fetching user from Supabase:', error.message);
      throw error;
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        isKtpVerified: data.is_ktp_verified ?? false,
        ktpNumber: data.ktp_number,
        ktpPhoto: data.ktp_photo,
      };
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      console.warn('⚠️ Supabase connection offline during user profile fetch. GriyaStay utilizing local storage.');
    } else {
      console.error('Supabase fetch user failed:', err);
    }
    return null;
  }
}

/**
 * Register or update a user profile in Supabase
 */
export async function upsertSupabaseUser(user: SupabaseUser): Promise<SupabaseUser | null> {
  if (!supabase) return null;
  try {
    const dbData = {
      id: user.id,
      name: user.name,
      email: user.email.trim().toLowerCase(),
      is_promo_eligible: true, // safe default for client profiles
      is_ktp_verified: user.isKtpVerified,
      ktp_number: user.ktpNumber || null,
      ktp_photo: user.ktpPhoto || null,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(dbData, { onConflict: 'email' })
      .select();

    if (error) {
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('⚠️ Supabase database unreachable during user profile saving.');
        return null;
      }
      console.error('Error upserting user in Supabase:', error.message);
      throw error;
    }

    if (data && data[0]) {
      return {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        isKtpVerified: data[0].is_ktp_verified ?? false,
        ktpNumber: data[0].ktp_number,
        ktpPhoto: data[0].ktp_photo,
      };
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      console.warn('⚠️ Supabase connection offline during user registration. Utilizing local storage profiles.');
    } else {
      console.error('Supabase upsert user failed:', err);
    }
    return null;
  }
}

