export type StoryBackgroundType = 'VIDEO' | 'IMAGE' | 'EMBED' | 'GRADIENT' | 'blank';

export interface Story {
  _id: string;
  storyId: string;
  slug: string;
  background: string;
  backgroundType: StoryBackgroundType;
  thumbnail: string;
  duration?: number;
  embedCode?: string;
  collectionOrder?: Record<string, number>;
}

export interface Collection {
  _id: string;
  collectionId: string;
  name: string;
  slug: string;
  cover: string;
  thumbnail: string;
  totalStories: number;
  stories?: Story[];
}

export interface CollectionsResponse {
  success: boolean;
  data: Collection[];
  totalPages: number;
  totalCollections: number;
}
