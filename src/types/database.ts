export type AppRole = 'customer' | 'super_admin' | 'orders_manager' | 'finance_member' | 'content_manager' | 'support_member';
export type OrderStatus = 'pending_payment' | 'payment_submitted' | 'payment_rejected' | 'approved' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'proof_uploaded' | 'approved' | 'rejected';
export type DeliveryType = 'email_password' | 'activation_code' | 'invite_link' | 'custom_instructions' | 'manual_delivery';
export type PaymentMethodType = 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AppRole;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string | null;
          full_description: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          gallery_urls: string[] | null;
          features: string[] | null;
          benefits: string[] | null;
          requirements: string[] | null;
          important_notes: string[] | null;
          faq_items: any[] | null;
          delivery_time_text: string | null;
          support_text: string | null;
          refund_policy_text: string | null;
          is_active: boolean;
          is_featured: boolean;
          is_popular: boolean;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      service_plans: {
        Row: {
          id: string;
          service_id: string;
          name: string;
          duration_label: string | null;
          duration_days: number | null;
          price: number;
          old_price: number | null;
          discount_percentage: number | null;
          stock_quantity: number;
          low_stock_alert_quantity: number;
          features: string[] | null;
          notes: string | null;
          delivery_type: DeliveryType;
          is_active: boolean;
          is_popular: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      payment_methods: {
        Row: {
          id: string;
          method_name: string;
          type: PaymentMethodType;
          account_name: string | null;
          phone_number: string | null;
          instapay_handle: string | null;
          bank_account: string | null;
          instructions: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          plan_id: string;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          service_name_snapshot: string | null;
          plan_name_snapshot: string | null;
          price_snapshot: number | null;
          duration_label_snapshot: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          subtotal: number;
          discount: number;
          total: number;
          coupon_id: string | null;
          customer_note: string | null;
          admin_note: string | null;
          reject_reason: string | null;
          approved_by: string | null;
          approved_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      payment_proofs: {
        Row: {
          id: string;
          order_id: string;
          payment_method_id: string;
          amount: number;
          transaction_reference: string | null;
          screenshot_url: string;
          status: 'pending' | 'approved' | 'rejected';
          customer_note: string | null;
          admin_note: string | null;
          reject_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      delivery_details: {
        Row: {
          id: string;
          order_id: string;
          service_id: string | null;
          plan_id: string | null;
          delivery_type: DeliveryType;
          login_email: string | null;
          login_password: string | null;
          activation_code: string | null;
          invite_link: string | null;
          instructions: string | null;
          custom_fields: any | null;
          visible_in_profile: boolean;
          email_sent: boolean;
          email_sent_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          usage_limit: number | null;
          used_count: number;
          minimum_order_amount: number | null;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      reviews: {
        Row: {
          id: string;
          customer_name: string;
          avatar_url: string | null;
          rating: number;
          review_text: string;
          service_id: string | null;
          is_featured: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          service_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      site_settings: {
        Row: {
          id: string;
          site_name: string;
          description: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          primary_color: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          whatsapp_number: string | null;
          social_links: any | null;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      homepage_sections: {
        Row: {
          id: string;
          hero_title: string | null;
          hero_subtitle: string | null;
          primary_cta_text: string | null;
          secondary_cta_text: string | null;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
    Views: {
      admin_dashboard_stats: {
        Row: {
          total_orders: number;
          pending_payment_reviews: number;
          completed_orders: number;
          rejected_payments: number;
          total_revenue: number;
        };
      };
    };
    Functions: {
      create_order: {
        Args: {
          p_plan_id: string;
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone?: string;
          p_coupon_code?: string;
          p_customer_note?: string;
        };
        Returns: string; // Returns order_id
      };
      submit_payment_proof: {
        Args: {
          p_order_id: string;
          p_payment_method_id: string;
          p_amount: number;
          p_screenshot_url: string;
          p_transaction_reference?: string;
          p_customer_note?: string;
        };
        Returns: boolean;
      };
      approve_payment_and_complete_order: {
        Args: {
          p_order_id: string;
          p_payment_proof_id: string;
          p_delivery_type?: DeliveryType;
          p_login_email?: string;
          p_login_password?: string;
          p_activation_code?: string;
          p_invite_link?: string;
          p_instructions?: string;
          p_custom_fields?: any;
          p_visible_in_profile?: boolean;
        };
        Returns: boolean;
      };
      reject_payment_proof: {
        Args: {
          p_order_id: string;
          p_payment_proof_id: string;
          p_reject_reason: string;
        };
        Returns: boolean;
      };
    };
  };
}
