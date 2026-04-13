describe("Authentication & Route Security", () => {
  // Clear everything so we're starting with a fresh session each time, otherwise the auth state gets super messy
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("Should successfully log in with valid credentials and redirect to Home", () => {
    // Navigate to our custom Brutalist sign-in route
    cy.visit("/sign-in");

    // Using the test account I set up in Supabase for the demo
    cy.get('input[type="email"]').type("test9@fyp.com");
    cy.get('input[type="password"]').type("Hello123@");

    // The button text is case-sensitive because of our strict Brutalist design rules
    cy.contains("button", "Sign In").click();

    // Give it a generous timeout for the Supabase/Next.js handshake to finish, sometimes the API is a bit slow
    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
    
    // Check if the greeting pops up - if it does, the auth context is finally working
    cy.get("body").should("contain", "HI,");
  });

  it("Should throw a clear error if the password is wrong", () => {
    cy.visit("/sign-in");
    
    cy.get('input[type="email"]').type("test9@fyp.com");
    // Entering a bad password to test if our error handling actually catches the Supabase rejection
    cy.get('input[type="password"]').type("wrongpassword_oops");
    cy.contains("button", "Sign In").click();

    // Looking for the specific error message we mapped in the sign-in page, hope the CSS casing doesn't break this
    cy.contains("Invalid email or password.", { timeout: 8000 }).should("be.visible");
  });

  it("Should securely redirect a logged-out user away from private routes", () => {
    // If a guest tries to hit /settings, the middleware should kick them back to sign-in immediately
    cy.visit("/settings", { failOnStatusCode: false });

    // The route guard should catch this and redirect us away from /settings, preventing unauthorized access
    cy.url().should("not.include", "/settings");
    cy.url().should("include", "/sign-in");
  });
});
