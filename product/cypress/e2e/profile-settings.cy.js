describe("Profile Management & Settings", () => {
  beforeEach(() => {
    // Logging in manually because the session cookie logic is still a bit flaky
    cy.visit("/sign-in");
    cy.get('input[type="email"]').type("user1@local.test");
    cy.get('input[type="password"]').type("password123");
    cy.contains("button", "Sign In").click();
    
    // Need this wait because the redirect to dashboard sometimes lags on the dev server
    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
  });

  it("Should allow the user to update their Bio and verify it appears on their public profile", () => {
    // Going to settings page - hope the CSS grid doesn't break on smaller viewports
    cy.visit("/settings");

    // Using a timestamp so I don't get confused by old data in the DB
    const newBio = `Test Bio generated at ${new Date().getTime()}`;
    
    // Clearing the field first because sometimes the old text just hangs around
    cy.get('textarea[placeholder*="BIO"]').clear().type(newBio);

    // Clicking save - praying the API call doesn't time out like it did yesterday
    cy.contains("button", "SAVE BIO").click();

    // Checking for the toast message; it's a bit fast so I gave it a generous timeout
    cy.contains("BIO UPDATED SUCCESSFULLY", { timeout: 8000 }).should("be.visible");

    // Navigating to profile via the dropdown - finding this button was a nightmare with the z-index
    cy.get('header').find('button[class*="w-10 h-10"]').click();
    cy.contains("button", "PROFILE").click();

    // Verify the bio shows up; if this fails, it's probably a caching issue again
    cy.contains(newBio, { timeout: 8000 }).should("be.visible");
  });
});
