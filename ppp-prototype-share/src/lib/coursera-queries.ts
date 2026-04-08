export const SEARCH_QUERY = `
  query Search($requests: [Search_Request!]!) {
    SearchResult {
      search(requests: $requests) {
        totalPages
        pagination {
          cursor
          totalElements
        }
        elements {
          __typename
          ... on Search_ProductHit {
            id
            name
            url
            imageUrl
            productType
            partners
            partnerLogos
            skills
            duration
            productDifficultyLevel
            isPartOfCourseraPlus
            productCard {
              badges
            }
          }
        }
      }
    }
  }
`;
