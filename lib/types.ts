export interface EventRow {
  id: string;
  admin_token: string;
  name: string;
  event_date: string | null;
  upload_enabled: boolean;
  created_at: string;
}

export interface MediaRow {
  id: string;
  event_id: string;
  storage_path: string;
  guest_name: string | null;
  media_type: 'image' | 'video';
  created_at: string;
}
