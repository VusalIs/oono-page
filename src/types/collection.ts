export interface Collection {
  _id: string;
  collectionId: string;
  name: string;
  slug: string;
  cover: string;
  thumbnail: string;
  totalStories: number;
}

export interface CollectionsResponse {
  success: boolean;
  data: Collection[];
  totalPages: number;
  totalCollections: number;
}
