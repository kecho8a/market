export interface ClubSettings {
  id: number;
  club_enabled: boolean;
  welcome_bonus_points: number;
  points_per_dollar: number;
  referral_referrer_points: number;
  referral_referred_points: number;
  pwa_install_points: number;
  updated_at?: string;
}

export interface ClubAccount {
  id: string;
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  referral_code: string;
  referred_by?: string;
  welcome_bonus_given: boolean;
  pwa_install_bonus_given: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'welcome_bonus' | 'purchase' | 'referral_referrer' | 'referral_referred' |
        'pwa_install' | 'reward_redemption' | 'admin_adjustment';
  reference_id?: string;
  description?: string;
  balance_after: number;
  created_at: string;
}

export interface ClubReward {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_cost: number;
  stock: number;
  active: boolean;
  max_per_user: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClubRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ClubReferral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  created_at: string;
}

export interface ClubAccountWithUser extends ClubAccount {
  nombre: string;
  email: string;
  telefono: string;
}

export interface ClubUserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  assigned_at: string;
  used_at: string | null;
}

export interface ClubUserCouponWithDetails extends ClubUserCoupon {
  coupon_code: string;
  discount_percent: number;
  user_nombre?: string;
  user_email?: string;
  user_telefono?: string;
}
