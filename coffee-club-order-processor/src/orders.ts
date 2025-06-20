    {
      owner(
        address: "0x2ca2306ea2387599b71888aa47b9012c33cda061c38a4cc38dcf3a439068aa64"
      ) {
        dynamicFields {
          nodes {
            name {
              ... {
                type {
                  repr
                }
                json
              }
            }
            value {
              __typename
              ... on MoveValue {
                ... {
                  type {
                    repr
                  }
                  json
                }
              }
              ... on MoveObject {
                contents {
                  ... {
                    type {
                      repr
                    }
                    json
                  }
                }
              }
            }
          }
        }
      }
    }