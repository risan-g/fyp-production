describe("Mobile Responsiveness & Viewport Sanity", () => {
  // iPhone X view to test the specialized Brutalist layout on mobile
  beforeEach(() => {
    cy.viewport("iphone-x");
    
    // Log in is required to see the rating action buttons on the album page
    cy.visit("/sign-in");
    cy.get('input[type="email"]').type("test9@fyp.com");
    cy.get('input[type="password"]').type("Hello123@");
    cy.contains("button", "Sign In").click();
    
    // Wait for the redirect to home to wrap up
    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
  });

  it("Should show a functional NavBar on mobile", () => {
    // The logo should be visible even on tiny screens
    cy.contains("dotwv").should("be.visible");

    // The search bar should still be present in the header
    cy.get('input[placeholder*="SEARCH"]').should("be.visible");
  });

  it("Should handle the search dropdown correctly on mobile", () => {
    // Typing query to trigger the search API
    cy.get('input[placeholder*="SEARCH"]').type("Travis");
    cy.wait(1500); 

    // We scope to the header to avoid matching other floating boxes on the home page
    cy.get('header div.shadow-\\[8px_8px_0px_rgba\\(0\\,0\\,0\\,1\\)\\]').should("be.visible");
    
    // Using {force: true} because on mobile some spans truncate down to 0px width 
    // even though they are visually present in our Brutalist list.
    cy.contains("Travis Scott").click({ force: true });
    cy.url().should("include", "/artist/");
  });

  it("Should verify the Brutalist Rating Slider works on mobile", () => {
    // Jump straight to the album page
    cy.visit("/album/4PWBTB6NYSKQwfo79I3prg");

    // Check the vertical slider track is visible
    cy.get('div.h-72.w-32').should("be.visible");

    // Click the track at a specific point to set a rating
    cy.get('div.h-72.w-32').click(64, 100); 

    // The 'CONFIRM' button should appear at the bottom of the list
    cy.contains('button', '"CONFIRM RATING"').should("be.visible");
  });
});
