export interface CourseHit {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  productType: string;
  partners: string[];
  partnerLogos: string[];
  skills: string[];
  duration: string;
  productDifficultyLevel: string;
  isPartOfCourseraPlus: boolean;
  activityBadges: string[];
}

export interface SearchPagination {
  cursor: string;
  totalElements: number;
}

export interface SearchResultElement {
  __typename: string;
  productCard?: { badges?: string[] };
  id?: string;
  name?: string;
  url?: string;
  imageUrl?: string;
  productType?: string;
  partners?: string[];
  partnerLogos?: string[];
  skills?: string[];
  duration?: string;
  productDifficultyLevel?: string;
  isPartOfCourseraPlus?: boolean;
}

export interface SearchResult {
  totalPages: number;
  pagination: SearchPagination;
  elements: SearchResultElement[];
}

export interface SearchRequest {
  query: string;
  entityType: string;
  limit: number;
  cursor: string;
  sortBy?: string;
  facetFilters?: Array<Record<string, unknown>>;
}
