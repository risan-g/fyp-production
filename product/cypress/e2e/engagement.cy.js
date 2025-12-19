describe("User Engagement: Login, Rate, and Review", () => {
  // CONFIGURATION
  const TEST_USER = {
    email: "bot@testmail.com",
    password: "Password1231",
    username: "cypress",
  };

  // NEED TO CHANGE ALBUM ID EVERY TIME WHEN TESTING
  const ALBUM_ID = "0hvT3yIEysuuvkK73vgdcW";

  it("Should log in, rate the album, and leave a review", () => {
    // 1. Visit Login Page
    cy.visit("http://localhost:3000/sign-in");

    // 2. Login
    cy.get('input[id="emailOrUsername"]').type(TEST_USER.email);
    cy.get('input[id="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();

    // 3. Verify Redirect to Home
    // Wait up to 10 seconds for the redirect to happen
    cy.url({ timeout: 10000 }).should("eq", "http://localhost:3000/");

    // 4. Navigate to Album
    cy.visit(`http://localhost:3000/album/${ALBUM_ID}`);

    // 5. SET RATING (Slider Interaction)
    cy.get(".cursor-pointer.flex.justify-center.relative")
      .scrollIntoView()
      .should("be.visible");

    cy.get(".cursor-pointer.flex.justify-center.relative").click("bottom");
    cy.wait(500);
    cy.get(".cursor-pointer.flex.justify-center.relative").click("top");

    // 6. Confirm Rating
    cy.contains("button", "Confirm", { timeout: 10000 })
      .should("be.visible")
      .click();

    cy.contains("Confirm").should("not.exist");

    // 7. WRITE REVIEW
    cy.get("textarea").should("be.visible").clear();

    cy.get("textarea").type("This is a test review for the final report.", {
      delay: 50,
    });

    // 8. PUBLISH
    cy.contains("button", "Publish").click();

    // Wait for Supabase to save
    cy.wait(2000);
    cy.reload();

    // 9. VERIFY
    cy.get("textarea", { timeout: 10000 }).should(
      "include.value",
      "This is a test review"
    );

    // Check for username
    cy.contains(TEST_USER.username).should("be.visible");
  });
});
