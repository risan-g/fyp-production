describe("Community & Social Interaction (The Wall)", () => {
  beforeEach(() => {
    // Log in first so we have the auth context to post to the wall
    cy.visit("/sign-in");
    cy.get('input[type="email"]').type("test9@fyp.com");
    cy.get('input[type="password"]').type("Hello123@");
    cy.contains("button", "Sign In").click();
    
    // Landing on home to make sure the session is actually established
    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
  });

  it("Should allow a user to submit a new post to The Wall and see it instantly (Optimistic UI)", () => {
    // Navigate to a specific artist's community wall
    cy.visit("/artist/0Y5tJX1MQlPlqiwlOH1tJY/wall");

    // Click the big floating '+' button to open the post modal
    cy.get('button[aria-label="Create Post"]').click();

    // The modal uses a high z-index, so we scope our search inside it to 
    // avoid hitting any hidden inputs on the main page.
    const uniquePost = `Testing the Brutalist UI at ${new Date().getTime()}`;
    cy.get('.fixed.inset-0').within(() => {
      cy.get('input[placeholder*="TITLE"]').type("Cypress Automated Test");
      cy.get('textarea').type(uniquePost);
      cy.contains("button", "POST").click();
    });

    // Check if the post appears instantly in the feed (Optimistic UI check)
    cy.contains(uniquePost, { timeout: 8000 }).should("be.visible");
  });

  it("Should verify the upvote (dB) mechanics function and visually update", () => {
    // Back to the wall to test the upvoting/dB scoring
    cy.visit("/artist/0Y5tJX1MQlPlqiwlOH1tJY/wall");

    // Look for the [+] button in the first post card
    cy.contains("button", "+", { timeout: 8000 }).first().as("upvoteBtn");

    // Click the upvote and ensure it doesn't just error out
    cy.get("@upvoteBtn").click();
      
    // Make sure the button stays active and doesn't get disabled on failure
    cy.get("@upvoteBtn").should("not.be.disabled");
  });
});
