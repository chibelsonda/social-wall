export type Post = {
  id: string;
  author: string;
  avatar_url: string | null;
  message: string;
  image_url: string | null;
  image_urls: string[];
  created_at: string;
};
