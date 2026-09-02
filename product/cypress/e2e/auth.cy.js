describe("Authentication & Route Security", () => {
  // Clear everything so we're starting with a fresh session each time, otherwise the auth state gets super messy
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("Should successfully log in with valid credentials and redirect to Home", () => {
    cy.visit("/sign-in");

    cy.get('input[type="email"]').type("user1@local.test");
    cy.get('input[type="password"]').type("password123");

    cy.contains("button", "Sign In").click();

    cy.url({ timeout: 15000 }).should("eq", Cypress.config().baseUrl + "/");
    
    cy.get("body").should("contain", "HI,");
  });

  it("Should throw a clear error if the password is wrong", () => {
    cy.visit("/sign-in");
    
    cy.get('input[type="email"]').type("user1@local.test");
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
