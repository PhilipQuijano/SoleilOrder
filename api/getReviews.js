import { supabase } from './supabaseClient';

export const reviewsApi = {
  async createReview(reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        name: reviewData.name,
        email: reviewData.email,
        rating: reviewData.rating,
        comment: reviewData.comment,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getApprovedReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return null;
    }
  }
};