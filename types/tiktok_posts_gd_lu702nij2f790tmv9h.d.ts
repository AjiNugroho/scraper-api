export interface MusicInfo {
  authorname?: string;
  covermedium?: string;
  id?: string;
  original?: boolean;
  playurl?: string;
  title?: string;
}

export interface TaggedUser {
  user_id?: string | null;
  user_handle?: string | null;
  user_url?: string | null;
  user_name?: string | null;
}

export interface SubtitleInfo {
  url_expire?: string | null;
  size?: number | null;
  language_id?: string | null;
  language_code_name?: string | null;
  url?: string | null;
  format?: string | null;
  version?: string | null;
  source?: string | null;
}

export interface tiktok_posts_gd_lu702nij2f790tmv9h {
  url: string;

  post_id?: string;
  description?: string;
  create_time?: string; // ISO date

  digg_count?: number;
  share_count?: string | null;
  collect_count?: number;
  comment_count?: number;
  play_count?: number;
  video_duration?: number;

  hashtags?: string[];

  original_sound?: string | null;

  profile_id?: string;
  profile_username?: string;
  profile_url?: string;
  profile_avatar?: string;
  profile_biography?: string | null;

  preview_image?: string;

  post_type?: "video" | "content";

  discovery_input?: {
    search_keyword?: string;
  } | null;

  offical_item?: boolean;
  secu_id?: string;
  original_item?: boolean;

  shortcode?: string;

  width?: number;
  ratio?: string;

  video_url?: string;

  music?: MusicInfo;

  cdn_url?: string | null;

  is_verified?: boolean | null;
  account_id?: string | null;

  carousel_images?: string[] | null;

  tagged_user?: TaggedUser[] | null;

  profile_followers?: number;

  tt_chain_token?: string;

  region?: string;
  commerce_info?: string | null;

  subtitle_url?: string | null;
  subtitle_format?: string | null;

  country?: string | null;

  subtitle_info?: SubtitleInfo[] | null;

  cdn_link?: string | null;
}