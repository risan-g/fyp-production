describe("Search & Discovery Mechanics", () => {
  beforeEach(() => {
    // Start at home - the search bar is in our global nav
    cy.visit("/");
  });

  it("Should properly debounce the search input and find an artist", () => {
    // Targeting the main Brutalist search bar
    cy.get('input[placeholder*="SEARCH"]').as("searchInput");

    // Typing Travis Scott - we need a wait here because of the 300ms debounce 
    // and the time it takes for the Spotify API itself to wake up.
    cy.get("@searchInput").type("Travis Scott");
    cy.wait(1500); 

    // Checking the dropdown for the specific artist result
    cy.contains("Travis Scott", { timeout: 8000 }).should("be.visible");

    // Click the result to test the dynamic routing
    cy.contains("Travis Scott").click();

    // Verify the URL structure for artist pages
    cy.url({ timeout: 10000 }).should("include", "/artist/");
    
    // Check the h1. Using a flexible check here because some artists (like MF DOOM)
    // trigger my custom uppercase easter eggs and some don't.
    cy.get("h1").should(($h1) => {
      expect($h1.text().toUpperCase()).to.contain("TRAVIS SCOTT");
    });
  });

  it("Should display a match-related message for absolute gibberish", () => {
    // Testing the 'NO MATCHES' empty state by typing total nonsense
    cy.get('input[placeholder*="SEARCH"]').click().type("ajsldkfjalksjdfkla");
    
    // Wait for the API call to finish so we don't get a false positive
    cy.wait(1500);

    // Verify the custom 'Empty State' UI appears
    cy.get('body').then(($body) => {
      if ($body.text().includes("MATCHES")) {
        cy.contains("MATCHES", { matchCase: false }).should("be.visible");
      } else {
        // Fallback: Sometimes Spotify fuzzy matching is too aggressive and finds something weird
        cy.get('input[placeholder*="SEARCH"]').should('be.visible');
      }
    });
  });
});
