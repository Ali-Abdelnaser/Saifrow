export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  | 'customer'
  | 'super_admin'
  | 'orders_manager'
  | 'finance_member'
  | 'content_manager'
  | 'support_member';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_rejected'
  | 'approved'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'proof_uploaded' | 'approved' | 'rejected';
export type DeliveryType =
  | 'email_password'
  | 'activation_code'
  | 'invite_link'
  | 'custom_instructions'
  | 'manual_delivery';
export type PaymentMethodType = 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'binance' | 'credit_card' | 'other';
export type CouponDiscountType = 'percentage' | 'fixed';

type Relationship<
  Columns extends string[],
  ReferencedRelation extends string,
  ReferencedColumns extends string[],
> = {
  foreignKeyName: string;
  columns: Columns;
  isOneToOne: boolean;
  referencedRelation: ReferencedRelation;
  referencedColumns: ReferencedColumns;
};

type TableDefinition<
  Row,
  Relationships extends readonly Relationship<string[], string, string[]>[] = [],
> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type ViewDefinition<Row> = {
  Row: Row;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<{
        id: string;
        email: string;
        full_name: string;
        role: AppRole;
        phone: string | null;
        avatar_url: string | null;
        is_active?: boolean;
        created_at: string;
        updated_at: string;
      }>;
      categories: TableDefinition<{
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
      }>;
      services: TableDefinition<
        {
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
          faq_items: Json[] | null;
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
        },
        [
          Relationship<['category_id'], 'categories', ['id']>,
        ]
      >;
      service_plans: TableDefinition<
        {
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
        },
        [
          Relationship<['service_id'], 'services', ['id']>,
        ]
      >;
      payment_methods: TableDefinition<{
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
      }>;
      orders: TableDefinition<
        {
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
        },
        [
          Relationship<['user_id'], 'profiles', ['id']>,
          Relationship<['plan_id'], 'service_plans', ['id']>,
          Relationship<['service_id'], 'services', ['id']>,
          Relationship<['coupon_id'], 'coupons', ['id']>,
        ]
      >;
      payment_proofs: TableDefinition<
        {
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
        },
        [
          Relationship<['order_id'], 'orders', ['id']>,
          Relationship<['payment_method_id'], 'payment_methods', ['id']>,
        ]
      >;
      delivery_details: TableDefinition<
        {
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
          custom_fields: Json | null;
          visible_in_profile: boolean;
          email_sent: boolean;
          email_sent_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        [
          Relationship<['order_id'], 'orders', ['id']>,
          Relationship<['service_id'], 'services', ['id']>,
          Relationship<['plan_id'], 'service_plans', ['id']>,
          Relationship<['created_by'], 'profiles', ['id']>,
        ]
      >;
      coupons: TableDefinition<{
        id: string;
        code: string;
        discount_type: CouponDiscountType;
        discount_value: number;
        usage_limit: number | null;
        used_count: number;
        minimum_order_amount: number | null;
        starts_at: string | null;
        ends_at: string | null;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      coupon_usages: TableDefinition<
        {
          id: string;
          coupon_id: string;
          order_id: string;
          user_id: string;
          discount_amount: number;
          created_at: string;
        },
        [
          Relationship<['coupon_id'], 'coupons', ['id']>,
          Relationship<['order_id'], 'orders', ['id']>,
          Relationship<['user_id'], 'profiles', ['id']>,
        ]
      >;
      reviews: TableDefinition<
        {
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
        },
        [
          Relationship<['service_id'], 'services', ['id']>,
        ]
      >;
      faqs: TableDefinition<
        {
          id: string;
          question: string;
          answer: string;
          service_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        },
        [
          Relationship<['service_id'], 'services', ['id']>,
        ]
      >;
      site_settings: TableDefinition<{
        id: string;
        key: string;
        value: any;
        is_public: boolean;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      contact_messages: TableDefinition<{
        id: string;
        name: string;
        email: string;
        subject: string | null;
        message: string;
        is_read: boolean;
        created_at: string;
      }>;
      homepage_sections: TableDefinition<{
        id: string;
        hero_title: string | null;
        hero_subtitle: string | null;
        primary_cta_text: string | null;
        secondary_cta_text: string | null;
        updated_at: string;
      }>;
      email_templates: TableDefinition<{
        id: string;
        template_key: string;
        subject: string;
        body: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      email_logs: TableDefinition<{
        id: string;
        order_id: string | null;
        recipient_email: string;
        subject: string;
        status: string;
        error_message: string | null;
        created_at: string;
      }>;
      notifications: TableDefinition<{
        id: string;
        user_id: string;
        title: string;
        message: string;
        is_read: boolean;
        created_at: string;
      }>;
      admin_activity_logs: TableDefinition<{
        id: string;
        admin_id: string | null;
        admin_email: string | null;
        action_type: string;
        entity_type: string;
        entity_id: string | null;
        old_data: Json | null;
        new_data: Json | null;
        created_at: string;
      }>;
      admin_permissions: TableDefinition<{
        id: string;
        permission_key: string;
        description: string | null;
        created_at: string;
      }>;
      role_permissions: TableDefinition<{
        id: string;
        role: AppRole;
        permission_key: string;
        created_at: string;
      }>;
    };
    Views: {
      admin_dashboard_stats: ViewDefinition<{
        total_orders: number;
        pending_payment_reviews: number;
        completed_orders: number;
        rejected_payments: number;
        total_revenue: number;
      }>;
      enriched_admin_activity_logs: ViewDefinition<{
        id: string;
        admin_id: string | null;
        admin_email: string | null;
        admin_name: string | null;
        action_type: string;
        entity_type: string;
        entity_id: string | null;
        old_data: Json | null;
        new_data: Json | null;
        created_at: string;
        order_number: string | null;
        customer_name: string | null;
        customer_email: string | null;
        order_total: string | null;
      }>;
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
        Returns: string;
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
          p_custom_fields?: Json;
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
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
