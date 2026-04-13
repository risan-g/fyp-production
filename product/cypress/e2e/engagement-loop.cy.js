describe("The Core Engagement Loop: Rating & Reviewing", () => {
  beforeEach(() => {
    // Wiping everything so the auth state doesn't get tangled between tests
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Log in so we can actually touch the database with a review
    cy.visit("/sign-in");
    cy.get('input[type="email"]').type("test9@fyp.com");
    cy.get('input[type="password"]').type("Hello123@");
    cy.contains("button", "Sign In").click();
    
    // Wait for the redirect to home to wrap up
    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
  });

  it("Should allow a logged-in user to slide a rating and submit a review", () => {
    // Search for Travis Scott's 'Rodeo' to test the full discovery-to-review loop
    cy.get('input[placeholder*="SEARCH"]').type("Rodeo");
    cy.wait(1500); 
    
    // Be specific about clicking the Album result since 'Rodeo' might also be a song or user
    cy.contains('span', '"Albums"', { timeout: 8000 }).parent().next().contains("Rodeo").click();
    
    // Make sure we landed on the right album page
    cy.url({ timeout: 10000 }).should("include", "/album/");
    
    // This is the custom vertical slider. We click a specific coordinate on the 
    // track to simulate the user dragging/clicking a score.
    cy.get('div.h-72.w-32').click(64, 50); 
    
    // Click the confirm button - naming it exactly as it appears in our Brutalist UI
    cy.contains('button', '"CONFIRM RATING"', { timeout: 5000 }).click();
    
    // Type in a review message into our thoughts box
    cy.get('textarea[placeholder*="thoughts"]').clear().type("An absolute classic. The production is completely unmatched.");
    
    // Submit it via the Server Action and wait for the UI to update
    cy.contains("button", "PUBLISH REVIEW").click();
    
    // Final check to see if the optimistic UI renders our new review instantly
    cy.contains("An absolute classic.", { timeout: 8000 }).should("be.visible");
  });
});
